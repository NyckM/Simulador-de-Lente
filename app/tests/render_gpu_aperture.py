"""Production shader aperture regression, including an atlas still in flight."""
from dataclasses import replace
from render_gpu_banding import *
from optics.core import aperture_info

def rms(image):
 weight=np.maximum(image[...,1].astype('f8'),0);yy,xx=np.indices(weight.shape);cx=(xx*weight).sum()/weight.sum();cy=(yy*weight).sum()/weight.sum()
 return float(np.sqrt((((xx-cx)**2+(yy-cy)**2)*weight).sum()/weight.sum()))

def main():
 ctx=moderngl.create_standalone_context(require=330)
 raw=np.zeros((H,W,4),'f4');raw[...,3]=1;raw[H//2-1:H//2+2,W//2-1:W//2+2,:3]=[300,160,50]
 opened=Settings(focus_m=.6,source_m=5,iris_mm=8.55)
 radii=[8.55,4.275,2.1375];pictures=[];measurements=[]
 for radius in radii:
  s=replace(opened,iris_mm=radius);picture=render(ctx,256,True,s,raw,creative=False,gain=2)
  pictures.append(picture);measurements.append(dict(f_number=aperture_info(s)['f_number'],iris_mm=radius,rms_px=rms(picture)))
 assert measurements[1]['rms_px']<measurements[0]['rms_px']*.65,measurements
 assert measurements[2]['rms_px']<measurements[1]['rms_px']*.65,measurements
 closed=replace(opened,iris_mm=radii[-1])
 immediate=render(ctx,256,True,closed,raw,creative=False,gain=2,atlas_settings=opened)
 assert rms(immediate)<rms(pictures[0])*.4
 # Creative spherical terms must not leave an aperture-independent blur floor.
 focused=replace(opened,focus_m=5)
 creative_open=render(ctx,256,True,focused,raw,creative=True)
 creative_closed=render(ctx,256,True,replace(focused,iris_mm=radii[-1]),raw,creative=True)
 assert rms(creative_closed)<rms(creative_open)*.7,(rms(creative_open),rms(creative_closed))
 repeated=render(ctx,256,True,closed,raw,creative=False,gain=2,atlas_settings=opened)
 np.testing.assert_array_equal(immediate,repeated)
 canvas=Image.new('RGB',(W*3,H+44),'#101813');draw=ImageDraw.Draw(canvas);font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',18)
 for i,(picture,measurement) in enumerate(zip(pictures,measurements)):
  c=np.clip(picture,0,1);c=np.where(c<=.0031308,c*12.92,1.055*c**(1/2.4)-.055)
  canvas.paste(Image.fromarray(np.uint8(c*255)).transpose(Image.Transpose.FLIP_TOP_BOTTOM),(i*W,44));draw.text((i*W+12,8),f"f/{measurement['f_number']:.2f} · raio RMS {measurement['rms_px']:.2f} px",font=font,fill='#b9efc8')
 path=ROOT.parent/'Aperture-GPU-0.7.11.png';canvas.save(path)
 result=dict(renderer=ctx.info['GL_RENDERER'],measurements=measurements,immediate_rms_px=rms(immediate),creative_open_rms_px=rms(creative_open),creative_closed_rms_px=rms(creative_closed),repeated_frames_identical=True,path=str(path))
 (ROOT.parent/'Aperture-GPU-0.7.11.json').write_text(json.dumps(result,indent=2),encoding='utf-8');print(json.dumps(result))
if __name__=='__main__':main()
