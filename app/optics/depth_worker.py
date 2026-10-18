"""Isolated GPU inference and sequence-wide depth normalization."""
from pathlib import Path
import json, sys, os, traceback, time
import numpy as np
from PIL import Image, ImageOps
# Canonical paths also avoid repeated Windows separators inherited from launchers.
cache_home=Path(os.environ.get('HF_HOME',str(Path.home()/'.cache/huggingface'))).resolve()
os.environ['HF_HOME']=str(cache_home)
os.environ['HF_HUB_CACHE']=str(Path(os.environ.get('HF_HUB_CACHE',str(cache_home/'hub'))).resolve())
JOB=Path(sys.argv[1]).resolve()
CONFIG=json.loads((JOB/'input.json').read_text())
WORK=Path(os.environ.get('OPTICA_DEPTH_WORK',str(Path(__file__).resolve().parents[3]/'work')))
sys.path.insert(0,str(Path(__file__).resolve().parent))
from model_cache import model_file,model_directory
from worker_status import write_status
from depth_errors import diagnostic
from depth_models import MODELS, options, moge3_model, marigold_batch, save_geometry, convert_relative, normalize_sequence, preview

def progress(state,**kw):
    write_status(JOB, dict(state=state, **kw))

def main():
    started=time.monotonic()
    import cv2, torch
    torch.set_num_threads(4)
    device='cuda' if torch.cuda.is_available() else 'cpu'
    if device=='cuda':torch.cuda.reset_peak_memory_stats()
    progress('loading',message='Carregando mídia e modelo; o primeiro uso pode baixar pesos.')
    max_size=options(CONFIG)['max_size'] if CONFIG['model'] in MODELS else 640
    frames=[];fps=0;timestamps=[]
    if CONFIG['kind']=='video':
        cap=cv2.VideoCapture(str(JOB/'source'));fps=cap.get(cv2.CAP_PROP_FPS)
        if not 1<=fps<=120: raise ValueError('Não foi possível ler o FPS do vídeo')
        while True:
            ok,bgr=cap.read()
            if not ok: break
            if len(frames)>=3000: raise ValueError('Limite atual: 3000 frames por geração de depth. Recorte o vídeo.')
            timestamps.append(cap.get(cv2.CAP_PROP_POS_MSEC)/1000)
            rgb=cv2.cvtColor(bgr,cv2.COLOR_BGR2RGB);h,w=rgb.shape[:2]
            scale=min(1,max_size/max(w,h));rgb=cv2.resize(rgb,(round(w*scale),round(h*scale)),interpolation=cv2.INTER_AREA)
            path=JOB/f'rgb-{len(frames):06d}.png';Image.fromarray(rgb).save(path);frames.append(path)
        cap.release()
    else:
        im=ImageOps.exif_transpose(Image.open(JOB/'source')).convert('RGB');im.thumbnail((max_size,max_size));path=JOB/'rgb-000000.png';im.save(path);frames=[path]
    if not frames: raise ValueError('Mídia sem frames decodificáveis')
    w,h=Image.open(frames[0]).size
    name=CONFIG['model'];raw=[]
    if name=='da2':
        from transformers import AutoImageProcessor, AutoModelForDepthEstimation
        ident='depth-anything/Depth-Anything-V2-Large-hf'
        local=model_directory(ident,['config.json','preprocessor_config.json','model.safetensors'])
        processor=AutoImageProcessor.from_pretrained(local,local_files_only=True)
        dtype=torch.float16 if device=='cuda' else torch.float32
        model=AutoModelForDepthEstimation.from_pretrained(local,local_files_only=True).to(device=device,dtype=dtype).eval()
        def infer(path):
            inputs=processor(images=Image.open(path).convert('RGB'),return_tensors='pt').to(device=device,dtype=dtype)
            with torch.inference_mode():return model(**inputs).predicted_depth[0].float().cpu().numpy()
    elif name=='moge3':
        from huggingface_hub import hf_hub_download
        config=options(CONFIG)
        checkpoint=CONFIG.get('checkpoint') or model_file(MODELS[name]['repo'],'model.pt',hf_hub_download)
        predict_geometry=moge3_model(device,config,checkpoint)
        def infer(path):
            arrays=predict_geometry(path)
            save_geometry(JOB,len(raw),arrays)
            return arrays['depth']
    elif name=='marigold2':
        progress('running',message='Marigold V2: inferência relativa em log-depth; sem escala métrica.')
        predictions=marigold_batch(frames,JOB,options(CONFIG))
        for i,d in enumerate(predictions):
            d=convert_relative(d,'affine-log-distance')
            if d.shape!=(h,w):d=cv2.resize(d,(w,h),interpolation=cv2.INTER_LINEAR)
            p=JOB/f'raw-{i:06d}.npy';np.save(p,d);raw.append(p)
    elif name=='moge':
        from moge.model.v2 import MoGeModel
        from huggingface_hub import hf_hub_download
        checkpoint=model_file('Ruicheng/moge-2-vitl-normal','model.pt',hf_hub_download)
        model=MoGeModel.from_pretrained(str(checkpoint)).to(device).eval()
        def infer(path):
            tensor=torch.from_numpy(np.asarray(Image.open(path)).copy()).permute(2,0,1).float().to(device)/255
            with torch.inference_mode(): out=model.infer(tensor)
            z=out['depth'].float().cpu().numpy();valid=out['mask'].cpu().numpy().astype(bool)
            return np.where(valid,1/np.maximum(z,1e-6),0)
    elif name=='da3':
        from depth_anything_3.api import DepthAnything3
        local=model_directory('depth-anything/DA3-BASE',['config.json','model.safetensors'])
        model=DepthAnything3.from_pretrained(local,local_files_only=True).to(device).eval()
        # Single view per frame: no assertion of temporal inference for this adapter.
        def infer(path):
            with torch.inference_mode(): pred=model.inference([str(path)],process_res=504)
            return 1/np.maximum(pred.depth[0],1e-6)
    else:
        from dvd_adapter import predict
        for i,d in enumerate(predict(frames,device,WORK,lambda msg:progress('running',message=msg))):
            d=cv2.resize(d,(w,h),interpolation=cv2.INTER_LINEAR);path=JOB/f'raw-{i:06d}.npy';np.save(path,d);raw.append(path)
    if name not in ('dvd','marigold2'):
        for i,path in enumerate(frames):
            progress('running',current=i,total=len(frames),message=f'{name}: frame {i+1}/{len(frames)}')
            d=infer(path)
            if d.shape!=(h,w):d=cv2.resize(d,(w,h),interpolation=cv2.INTER_LINEAR)
            if not np.isfinite(d).any():raise ValueError('Modelo produziu depth inválido')
            d=np.where(np.isfinite(d),d,np.nan) if name=='moge3' else np.nan_to_num(d,nan=0,posinf=0,neginf=0);p=JOB/f'raw-{i:06d}.npy';np.save(p,d.astype('float32'));raw.append(p)
    metric=name=='moge3'
    lo,hi=normalize_sequence(raw,metric)
    for i,p in enumerate(raw):
        native=np.load(p,allow_pickle=False).astype('<f4')
        d=preview(native,lo,hi,metric)
        # Metric Z remains float32, including invalid NaN. The preview is not the render input.
        (native if metric else d).tofile(JOB/f'depth-{i:06d}.bin')
        Image.fromarray(np.uint8(d*255+.5)).save(JOB/f'depth-{i:06d}.png')
    if fps and (len(timestamps)!=len(raw) or any(b<=a for a,b in zip(timestamps,timestamps[1:]))):timestamps=[i/fps for i in range(len(raw))]
    metadata=MODELS.get(name,{})
    message='Depth métrico estimado em coordenadas da câmera. Geometria preservada.' if metric else 'Depth relativo: branco próximo. Escala única por sequência.'
    if name=='marigold2':message+=' Log-depth afim: normalização não calibra metros.'
    if name!='dvd' and fps:message+=' Inferência monocular; pode haver variação temporal.'
    progress('complete',runtime_fingerprint=CONFIG.get('runtime_fingerprint'),elapsed_s=round(time.monotonic()-started,3),device=torch.cuda.get_device_name() if device=='cuda' else 'CPU',peak_vram_bytes=torch.cuda.max_memory_allocated() if device=='cuda' else 0,timestamps=timestamps,width=w,height=h,count=len(raw),fps=fps,model=name,units='meters' if metric else 'relative',encoding=metadata.get('encoding','relative-nearness'),geometry=metric,geometry_convention='OpenCV: x right, y down, z forward; intrinsics normalized' if metric else None,checkpoint=metadata.get('repo'),options=options(CONFIG) if name in MODELS else {},normalization=[lo,hi],message=message)

if __name__=='__main__':
    try: main()
    except Exception as e:traceback.print_exc();progress('error',**diagnostic(e))
