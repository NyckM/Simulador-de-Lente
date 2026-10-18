from pathlib import Path
import sys,json
from dataclasses import replace
import numpy as np
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from optics.core import Settings,make_psf
from optics.vignette import compensation_gain
O=ROOT/'research/field-stage4';O.mkdir(exist_ok=True)
s=Settings(lens_model='dgauss50',focus_m=.6,source_m=5,iris_mm=8,ray_focus=True)
fields=[(0,0),(9,0),(17,10)];records=[];board=Image.new('RGB',(750,300),(10,18,14));d=ImageDraw.Draw(board)
for i,f in enumerate(fields):
 psf,trans,ok=make_psf(f,5,s,1080,16384);corrected,trans2,_=make_psf(f,5,replace(s,edge_compensation=100,edge_compensation_limit=6),1080,16384)
 assert ok and np.array_equal(psf,corrected) and trans==trans2
 g=psf[...,1];y,x=np.mgrid[:g.shape[0],:g.shape[1]];mx=(x*g).sum();my=(y*g).sum();cov=np.array([[((x-mx)**2*g).sum(),((x-mx)*(y-my)*g).sum()],[((x-mx)*(y-my)*g).sum(),((y-my)**2*g).sum()]]);ev=np.linalg.eigvalsh(cov)
 records.append({'field_mm':f,'transmission':float(trans),'rms_radius_px':float(np.sqrt(ev.sum())),'axis_ratio':float(np.sqrt(ev[-1]/max(ev[0],1e-12))),'psf_unchanged_by_compensation':True})
 image=np.clip(psf/psf.max(),0,1)**.45;tile=Image.fromarray((image*255).astype('uint8'));tile.thumbnail((220,220));board.paste(tile,(i*250+(250-tile.width)//2,35+(220-tile.height)//2));d.text((i*250+12,12),f'Campo {f} mm',fill=(170,238,206));d.text((i*250+12,266),f'Eixos {records[-1]["axis_ratio"]:.2f} | Luz {trans:.3f}',fill=(190,215,205))
assert records[-1]['axis_ratio']>records[0]['axis_ratio']+.05
board.save(O/'bokeh-centro-borda.png');(O/'psf-validation.json').write_text(json.dumps({'passed':True,'lens':'Double-Gauss 50 mm','records':records},indent=2));print(json.dumps(records))
