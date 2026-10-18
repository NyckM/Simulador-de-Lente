"""Real shader regression: soft depth must not create a second colored silhouette."""
import render_gpu_banding as gpu
from render_gpu_banding import *
from scipy.ndimage import gaussian_filter,distance_transform_edt

def main():
 ctx=moderngl.create_standalone_context(require=330)
 yy,xx=np.mgrid[:H,:W];mask=(xx>220+(yy-200)*.35)&(xx<490)&(yy>60)&(yy<350)
 raw=np.zeros((H,W,4),'f4');raw[...,:3]=[.08,.055,.24];raw[...,3]=1;raw[mask,:3]=[.9,.18,.035]
 # White fabric/highlights belong to the same foreground surface.
 raw[mask&(yy>145)&(yy<205)&(xx<410),:3]=[.85,.85,.85]
 depth=gaussian_filter(mask.astype('f4'),5)
 s=Settings(focus_m=2,source_m=5,near_m=2,far_m=5,iris_mm=8.55,blades=0,depth_mode='slicing')
 fixed=gpu.SHADERS;legacy=fixed.replace('clamp(refinedDepth()*depthGain+depthBias','clamp(rawDepth(uv)*depthGain+depthBias')
 gpu.SHADERS=legacy;before=render(ctx,128,True,s,raw,depth,False,gain=4)
 gpu.SHADERS=fixed;after=render(ctx,128,True,s,raw,depth,False,gain=4);reference=render(ctx,128,True,s,raw,mask.astype('f4'),False,gain=4)
 outside=(distance_transform_edt(~mask)>4)&(distance_transform_edt(~mask)<20)&(yy>100)&(yy<300)&(xx<350)
 old_error=float(abs(before[outside]-reference[outside]).mean());new_error=float(abs(after[outside]-reference[outside]).mean())
 assert new_error<old_error*.2,(old_error,new_error)
 np.testing.assert_array_equal(after,render(ctx,128,True,s,raw,depth,False,gain=4))
 # A real continuous depth ramp must keep the original renderer's response.
 ramp=np.broadcast_to(np.linspace(0,1,W,dtype='f4'),(H,W)).copy()
 gpu.SHADERS=legacy;old_ramp=render(ctx,128,True,s,raw,ramp,False,gain=4)
 gpu.SHADERS=fixed;new_ramp=render(ctx,128,True,s,raw,ramp,False,gain=4)
 ramp_error=float(abs(old_ramp-new_ramp).max());assert ramp_error<.001,ramp_error
 # Reversing focus still blurs the foreground; no forced sharp subject matte.
 far=Settings(focus_m=5,source_m=5,near_m=2,far_m=5,iris_mm=8.55,blades=0,depth_mode='slicing')
 defocused=render(ctx,128,True,far,raw,depth,False,gain=4)
 core=mask&(yy>210)&(yy<300)&(xx<270)
 assert float(abs(defocused[core]-after[core]).mean())>.01
 result=dict(soft_depth_halo_error_before=old_error,soft_depth_halo_error_after=new_error,reduction_percent=100*(1-new_error/old_error),continuous_depth_max_change=ramp_error,stable=True,foreground_defocus_preserved=True)
 target=ROOT.parent/'Halo-Depth-Corrigido.png';canvas=Image.new('RGB',(W*2,H+40),'#202020');draw=ImageDraw.Draw(canvas);font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',18)
 for i,(label,a) in enumerate([('Antes / depth suave',before),('Depois / borda guiada pela imagem',after)]):
  c=np.clip(a,0,1);c=np.where(c<=.0031308,12.92*c,1.055*c**(1/2.4)-.055);canvas.paste(Image.fromarray(np.uint8(c*255)),(i*W,40));draw.text((i*W+12,8),label,font=font,fill='#eee')
 canvas.save(target);(ROOT.parent/'Halo-Depth-Corrigido.json').write_text(json.dumps(result,indent=2),encoding='utf-8');print(json.dumps(result))
if __name__=='__main__':main()
