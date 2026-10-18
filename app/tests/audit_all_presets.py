from render_gpu_banding import *
from dataclasses import replace
from optics import cuda
from optics.core import LENS_PROFILES,focus_calibration
ctx=moderngl.create_standalone_context(require=330);raw=np.zeros((H,W,4),'f4');raw[...,:3]=[.01,.005,.015];raw[...,3]=1;depth=np.zeros((H,W),'f4');depth[70:330,240:400]=1;raw[depth>0,:3]=[.04,.4,.08]
for y in range(90,310,8):raw[y:y+4,255:385,2]=.4
raw[140:143,120:123,:3]=[20,8,1];rows=[];examples=[]
for model in LENS_PROFILES:
 lens=get_lens(Settings(lens_model=model));s=Settings(lens_model=model,focus_m=2,source_m=5,near_m=2,far_m=5,iris_mm=lens.max_iris,blades=0,depth_mode='auto')
 old=render(ctx,256,True,s,raw,depth,False,gain=1);new=render(ctx,256,True,replace(s,ray_focus=True),raw,depth,False,gain=1);far=render(ctx,256,True,replace(s,ray_focus=True,focus_m=5),raw,depth,False,gain=1)
 contrast=lambda a:float(np.std(a[110:290,285:355,2]));row=dict(model=model,name=LENS_PROFILES[model]['name'],old=contrast(old),new=contrast(new),far=contrast(far),calibration=focus_calibration(s));rows.append(row)
 if len(rows)%25==0:print('Audited',len(rows),flush=True)
 if model=='lv_rodenstock_apo_sironar_w_150f56':examples=[old,new,far]
 cuda.upload(raw,depth);native,info=cuda.render(vars(replace(s,ray_focus=True)),W,H,samples=256,taps=256,use_depth=True,near=2,far=5);row['parity']=float(np.abs(native[...,:3]-new).mean());assert row['parity']<.001,row
 row['texture_improvement']=row['new']/max(row['old'],1e-9)
 row['depth_focus_separates']=row['far']<row['new']*.95
picture=Image.new('RGB',(W*3,H+32),'#101813');draw=ImageDraw.Draw(picture)
for i,(label,img) in enumerate(zip(['Foco perto / anterior','Foco perto / compensado','Foco fundo / compensado'],examples)):
 c=np.clip(img,0,1);c=np.where(c<=.0031308,c*12.92,1.055*c**(1/2.4)-.055);picture.paste(Image.fromarray(np.uint8(c*255)).transpose(Image.Transpose.FLIP_TOP_BOTTOM),(i*W,32));draw.text((i*W+10,10),label,fill='white')
picture.save(ROOT.parent/'Foco-Depth-Presets-0.9.6.8.png');(ROOT.parent/'Foco-Depth-Presets-0.9.6.8.json').write_text(json.dumps(rows,indent=2),encoding='utf-8')

print(json.dumps({'models':len(rows),'texture_regressions':[r for r in rows if r['texture_improvement']<.9],'focus_not_separated':[r for r in rows if not r['depth_focus_separates']]},ensure_ascii=False),flush=True)
