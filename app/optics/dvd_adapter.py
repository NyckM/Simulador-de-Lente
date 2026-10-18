"""DVD native adapter: official engine, overlapping windows inspired by comfy-dvd.
References: EnVision-Research/DVD (Apache-2.0), chettilaura/ComfyUI-DVD-Depth.
No ComfyUI runtime monkey patches or Linux-specific model paths.
"""
import json, sys, os
from pathlib import Path
import numpy as np
from PIL import Image

try:
    from .model_cache import model_file
except ImportError:
    from model_cache import model_file

def predict(paths,device,work,report):
    if not paths:raise ValueError('DVD: nenhuma imagem válida para processar.')
    import torch
    from huggingface_hub import hf_hub_download
    from safetensors.torch import load_file
    from accelerate import Accelerator
    from omegaconf import OmegaConf
    sys.path.insert(0,str(work/'dvd'))
    from examples.wanvideo.model_training.WanTrainingModule import WanTrainingModule
    report('DVD: carregando pesos Wan e DVD 1.1')
    base=[model_file('Wan-AI/Wan2.1-T2V-1.3B',name,hf_hub_download) for name in ['diffusion_pytorch_model.safetensors','Wan2.1_VAE.pth']]
    checkpoint=model_file('FayeHongfeiZhang/DVD','dvd_1.1.safetensors',hf_hub_download)
    args=OmegaConf.load(work/'dvd/ckpt/model_config.yaml')
    model=WanTrainingModule(args=args,accelerator=Accelerator(),model_paths=json.dumps(base),lora_rank=args.lora_rank,lora_base_model='dit',use_gradient_checkpointing=False)
    state=load_file(checkpoint,device='cpu')
    model.pipe.dit.load_state_dict({k.removeprefix('pipe.dit.'):v for k,v in state.items() if k.startswith('pipe.dit.')},strict=True)
    del state
    model.merge_lora_layer();model=model.to(device).eval();model.pipe.device=torch.device(device)
    result=None;end_prev=0;window=21;overlap=5
    starts=list(range(0,max(1,len(paths)-overlap),window-overlap))
    for index,start in enumerate(starts):
        end=min(start+window,len(paths));report(f'DVD: janela {index+1}/{len(starts)}')
        images=[np.asarray(Image.open(p).convert('RGB')) for p in paths[start:end]]
        x=torch.from_numpy(np.stack(images).copy()).permute(0,3,1,2).float()/255
        h,w=x.shape[-2:];scale=min(1,512/max(h,w));size=(max(16,int(h*scale)//16*16),max(16,int(w*scale)//16*16))
        x=torch.nn.functional.interpolate(x,size=size,mode='bilinear',align_corners=False).unsqueeze(0)
        original=x.shape[1];padding=(1-original)%4
        if padding:x=torch.cat([x,x[:,-1:].repeat(1,padding,1,1,1)],dim=1)
        x=x.to(device=device,dtype=torch.bfloat16);t=x.shape[1]
        with torch.inference_mode():
            out=model.pipe(prompt=[''],negative_prompt=[''],mode=args.mode,height=size[0],width=size[1],num_frames=t,batch_size=1,input_image=x[:,0],extra_images=x,extra_image_frame_index=torch.ones((1,t),device=device),input_video=x,cfg_scale=1,seed=0,tiled=False,denoise_step=args.denoise_step)
        d=np.asarray(out['depth'])[0,:original].mean(axis=-1).astype('float32')
        if result is None:result=d
        else:
            n=end_prev-start
            if n>0:
                current=d[:n].ravel();ref=result[-n:].ravel();a=np.stack([current,np.ones_like(current)],1)
                scale,shift=np.linalg.lstsq(a[::32],ref[::32],rcond=None)[0];d=d*np.clip(scale,.7,1.5)+shift
                alpha=np.linspace(0,1,n,dtype='float32')[:,None,None]
                result=np.concatenate([result[:-n],result[-n:]*(1-alpha)+d[:n]*alpha,d[n:]])
            else:result=np.concatenate([result,d])
        end_prev=end
        if end==len(paths):break
    yield from result
