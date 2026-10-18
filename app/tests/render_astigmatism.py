from dataclasses import replace
from render_gpu_banding import *
from optics import cuda
ctx=moderngl.create_standalone_context(require=330)
raw=np.zeros((H,W,4),'f4');raw[...,3]=1;raw[H//2,W//2,:3]=1;raw[H//2,int(W*.84),:3]=1
s=Settings(focus_m=2,source_m=5,iris_mm=8.55,blades=0,astigmatism_mm=0)
images=[];result={}
for amount in [0,.8,-.8]:
 t=replace(s,astigmatism_mm=amount);gl=render(ctx,256,True,t,raw,None,False,gain=1)
 cuda.upload(raw);out=cuda.render(vars(t),W,H,samples=256,taps=256)
 # Native output is linear HDR RGB, with alpha.
 rgb=np.asarray(out[0])[...,:3] if isinstance(out,tuple) else None
 images.append(gl)
 crop=gl[H//2-30:H//2+31,int(W*.84)-35:int(W*.84)+36,1].astype('f8');y,x=np.indices(crop.shape);m=crop.sum();cx=(crop*x).sum()/m;cy=(crop*y).sum()/m;vx=(crop*(x-cx)**2).sum()/m;vy=(crop*(y-cy)**2).sum()/m
 result[str(amount)]={'radial_variance':vx,'tangential_variance':vy,'ratio':vx/vy,'energy':float(m)}
 assert rgb.shape==gl.shape,(rgb.shape,gl.shape)
 parity=float(np.abs(rgb-gl).mean());assert parity<.0002,parity
 result[str(amount)]['cuda_webgl_mean_error']=parity
print(json.dumps(result,indent=2))
assert result['0.8']['ratio']>result['-0.8']['ratio']*2,result
center=float(np.abs(images[1][180:220,300:340]-images[0][180:220,300:340]).mean());edge=float(np.abs(images[1][170:230,500:580]-images[0][170:230,500:580]).mean());assert center<edge*.1,(center,edge)

# The same split changes orientation when crossing the object focus plane.
a=replace(s,focus_m=10,astigmatism_mm=.8)
flip=render(ctx,256,True,a,raw,None,False,gain=1)
crop=flip[H//2-30:H//2+31,int(W*.84)-35:int(W*.84)+36,1].astype('f8');y,x=np.indices(crop.shape);m=crop.sum();cx=(crop*x).sum()/m;cy=(crop*y).sum()/m;vx=(crop*(x-cx)**2).sum()/m;vy=(crop*(y-cy)**2).sum()/m
assert vx/vy<1,(vx,vy)
result['cross_focus_ratio']=vx/vy
# Clear, magnified crops for visual inspection of the production render.
picture=Image.new('RGB',(900,340),'#101813');draw=ImageDraw.Draw(picture)
for i,(im,label) in enumerate(zip(images,['Sem astigmatismo','+0.8 mm / radial','-0.8 mm / tangencial'])):
 c=np.clip(im[175:225,512:562,:3],0,1);c=np.where(c<=.0031308,c*12.92,1.055*c**(1/2.4)-.055);tile=Image.fromarray(np.uint8(c*255)).resize((300,300),Image.Resampling.NEAREST);picture.paste(tile,(i*300,40));draw.text((i*300+10,12),label,fill='white')
picture.save(ROOT.parent/'Astigmatismo-0.9.6.7.png')
(ROOT.parent/'Astigmatismo-0.9.6.7.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
