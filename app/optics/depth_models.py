"""Official depth model adapters and explicit metric/relative output contracts."""
from pathlib import Path
import importlib, json, os, subprocess, sys
import numpy as np

MODELS={
 'moge3':dict(label='MoGe 3 · geometry',repo='Ruicheng/moge-3-vitl',units='meters',encoding='camera-z',geometry=True),
 'marigold2':dict(label='Marigold V2 · Log-stage2',repo='huawei-bayerlab/marigold-v2-0',units='relative',encoding='affine-log-distance',geometry=False),
}

def options(body):
    result={}
    for key,default,lo,hi in [('refine_steps',3,0,8),('resolution_level',6,0,9),('seed',2025,0,2147483647),('max_size',1024,256,2048)]:
        v=body.get(key,default)
        if not isinstance(v,int) or isinstance(v,bool) or not lo<=v<=hi:raise ValueError('Opção de depth inválida: '+key)
        result[key]=v
    return result

def metric_prediction(output):
    def cpu(v):return v.detach().float().cpu().numpy() if hasattr(v,'detach') else np.asarray(v)
    z=np.asarray(cpu(output['depth']),dtype='f4');mask=output.get('mask')
    valid=np.isfinite(z)&(z>0)
    if z.ndim!=2:raise ValueError('MoGe: depth deve ter duas dimensões.')
    if mask is not None:
        m=cpu(mask).astype(bool)
        if m.shape!=z.shape:raise ValueError('MoGe: máscara incompatível.')
        valid &= m
    arrays={'depth':np.where(valid,z,np.nan).astype('f4'),'mask':valid}
    for key in ('points','normal'):
        if output.get(key) is not None:
            a=np.asarray(cpu(output[key]),dtype='f4')
            if a.shape!=(*z.shape,3):raise ValueError('MoGe: geometria incompatível: '+key)
            arrays[key]=np.where(valid[...,None],a,np.nan).astype('f4')
    if output.get('intrinsics') is not None:
        a=np.asarray(cpu(output['intrinsics']),dtype='f4')
        if a.shape!=(3,3) or not np.isfinite(a).all():raise ValueError('MoGe: intrínsecos inválidos.')
        arrays['intrinsics']=a
    if not valid.any():raise ValueError('MoGe: nenhum pixel válido.')
    return arrays

def save_geometry(job,index,arrays):
    np.savez_compressed(Path(job)/f'geometry-{index:06d}.npz',**arrays)
    from PIL import Image
    Image.fromarray(arrays['mask'].astype('uint8')*255).save(Path(job)/f'mask-{index:06d}.png')
    if 'normal' in arrays:
        rgb=np.nan_to_num((arrays['normal']*.5+.5)*255,nan=0).clip(0,255).astype('uint8')
        Image.fromarray(rgb).save(Path(job)/f'normal-{index:06d}.png')

def convert_relative(values,encoding):
    a=np.asarray(values,dtype='f4')
    if a.ndim!=2:raise ValueError('Depth deve ter duas dimensões.')
    # Affine log distance has an unknown scale and shift: never exp() it into meters.
    return -a if encoding=='affine-log-distance' else a

def normalize_sequence(paths,metric=False):
    samples=[]
    for p in paths:
        a=np.load(p,allow_pickle=False).ravel()[::64];valid=np.isfinite(a)
        if metric:valid &= a>0
        samples.append(a[valid])
    finite=np.concatenate(samples)
    if not finite.size:
        fallback=[]
        for p in paths:
            a=np.load(p,allow_pickle=False).ravel();valid=np.isfinite(a)&((a>0) if metric else True);fallback.append(a[valid])
        finite=np.concatenate(fallback)
    if not finite.size:raise ValueError('Modelo produziu depth inválido.')
    if metric:
        lo,hi=np.percentile(1/finite,[1,99])
    else:lo,hi=np.percentile(finite,[1,99])
    return float(lo),float(hi)

def preview(values,lo,hi,metric=False):
    a=np.asarray(values,dtype='f4');valid=np.isfinite(a)
    if metric:valid &= a>0
    a=np.divide(1,a,out=np.zeros_like(a),where=valid) if metric else np.where(valid,a,0)
    return np.where(valid,.5 if hi-lo<1e-8 else np.clip((a-lo)/(hi-lo),0,1),0).astype('<f4')

def moge3_model(device,config,checkpoint):
    import torch
    from moge.model.v3 import MoGeModel
    import flex_gemm
    flex_gemm.config.AUTOTUNE_MODE='never'
    model=MoGeModel.from_pretrained(checkpoint).to(device).eval()
    def infer(path):
        from PIL import Image
        image=torch.from_numpy(np.asarray(Image.open(path).convert('RGB')).copy()).permute(2,0,1).float().to(device)/255
        with torch.inference_mode():out=model.infer(image,refine_steps=config['refine_steps'],resolution_level=config['resolution_level'])
        return metric_prediction(out)
    return infer

def marigold_batch(frames,job,config):
    repository=os.environ.get('OPTICA_MARIGOLD_ROOT')
    if not repository:raise RuntimeError('Configure o ambiente oficial Marigold V2.')
    root=Path(repository).resolve()
    if not (root/'scripts/infer.py').is_file():raise RuntimeError('Configure o repositório oficial Marigold V2 e seus pesos no painel de modelos.')
    folder=Path(job)/'marigold-input';folder.mkdir()
    import shutil
    for i,frame in enumerate(frames):shutil.copy2(frame,folder/f'rgb-{i:06d}.png')
    dest=Path(job)/'marigold-output'
    # Run in this worker process so cancelling a job also stops GPU inference.
    # The official CLI spawns a grandchild; execute its config builder and pipeline in-process instead.
    spec=importlib.util.spec_from_file_location('optica_marigold_infer',root/'scripts/infer.py')
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    checkpoint=str(module.MARIGOLD_CHECKPOINTS/'depth/Log-stage2')
    module._validate_inputs(folder,checkpoint,'depth')
    from omegaconf import OmegaConf
    dest.mkdir();yaml=dest/'config.yaml';OmegaConf.save(OmegaConf.create(module._build_config(folder,dest,'depth',checkpoint,None,None,config['seed'])),str(yaml))
    sys.path.insert(0,str(root));old=list(sys.argv);cwd=Path.cwd()
    try:
        os.chdir(root);sys.argv=['evaluate_pipeline','--config',str(yaml),'--output_dir',str(dest),'--checkpoint',checkpoint]
        import runpy
        runpy.run_module('evaluation.depth.evaluate_pipeline',run_name='__main__')
    finally:sys.argv=old;os.chdir(cwd)
    return [np.load(dest/'images/predictions_npy'/f'rgb-{i:06d}.npy',allow_pickle=False) for i in range(len(frames))]
