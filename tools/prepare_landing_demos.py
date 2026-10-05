from pathlib import Path
import sys,json,hashlib,shutil
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter
ROOT=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path(__file__).resolve().parents[1]
if not (ROOT/'outputs/OpticaLab').is_dir():
 raise SystemExit('Pass the original workspace path: python prepare_landing_demos.py C:/path/to/ol')
SITE=ROOT/'outputs/landing-simulador-v1'
A=SITE/'assets/demos';A.mkdir(parents=True,exist_ok=True)
sys.path.insert(0,str(ROOT/'outputs/OpticaLab'))
from optics.core import Settings
from optics.ghosts import analyze
p=ROOT/'work/depth-contour100/cache/f5701557c3d148ff84fd07162385c041'
d=np.load(p/'geometry-000000.npz');rgb=np.array(Image.open(p/'rgb-000000.png').convert('RGB'))
Image.fromarray(rgb).resize((432,768),Image.Resampling.LANCZOS).save(A/'moge-rgb.jpg',quality=90)
z=d['depth'][::2,::2].astype('<f4');z.tofile(A/'moge-depth.bin')
valid=d['mask'][::6,::6]&np.isfinite(d['points'][::6,::6]).all(axis=-1)
records=np.concatenate((d['points'][::6,::6][valid],rgb[::6,::6][valid]/255),axis=1).astype('<f4')
records.tofile(A/'moge-points.bin')
meta=dict(width=z.shape[1],height=z.shape[0],count=len(records),intrinsics=d['intrinsics'].tolist(),depth_range=np.percentile(z,[1,99]).tolist(),source='MoGe 3',row_order='top-down',inference=json.loads((p/'input.json').read_text()),geometry_sha256=hashlib.sha256((p/'geometry-000000.npz').read_bytes()).hexdigest(),convention='OpenCV X right, Y down, Z forward; meters')
(A/'moge.json').write_text(json.dumps(meta),encoding='utf8')
src=Path('C:/Users/nyckm/OneDrive/Pictures/Screenshots 1/Captura de tela 2026-10-04 194138.png')
im=Image.open(src).convert('RGB');im.thumbnail((900,1100));im.save(A/'filters.jpg',quality=92)
f=(ROOT/'outputs/OpticaLab/web/filter-stack.js').read_text(encoding='utf8').split("document.addEventListener('optica-layout-ready'")[0]
(SITE/'js/demo-filter-engine.js').write_text(f,encoding='utf8')
W,H=256,160
manifest=dict(grid=5,width=W,height=H,field_mm=[-14,-7,0,7,14],iris_mm=[3,6,10],coatings=[0,1],lens='dgauss50',samples=1024,pairs=16,frames=[],limits='Two reflections, three wavelengths, idealized coatings. Precomputed grid, bilinear interpolation; no wave diffraction.',gain=1800)
for iris in manifest['iris_mm']:
 for coat in manifest['coatings']:
  atlas=Image.new('RGB',(W*5,H*5))
  for iy,y in enumerate(manifest['field_mm']):
   for ix,x in enumerate(manifest['field_mm']):
    s=Settings(lens_model='dgauss50',iris_mm=iris,coating_strength=coat,dispersion=1,blades=7,focus_m=5)
    r=analyze(s,(x,y),samples=1024,pair_limit=16)
    frame=np.zeros((H,W,3),dtype='f4')
    for fam in r['families']:
     for c,ch in enumerate(fam['channels']):
      xy=np.array(ch['xy_mm']);weight=np.array(ch['weight'])
      if not len(xy):continue
      px=xy[:,0]/36*W+W/2;py=xy[:,1]/36*W+H/2
      xx=np.floor(px).astype(int);yy=np.floor(py).astype(int)
      for dx in (0,1):
       for dy in (0,1):
        good=(xx+dx>=0)&(xx+dx<W)&(yy+dy>=0)&(yy+dy<H)
        v=weight*(1-np.abs(px-xx-dx))*(1-np.abs(py-yy-dy))
        np.add.at(frame[:,:,c],(yy[good]+dy,xx[good]+dx),v[good])
    frame=gaussian_filter(frame,(2.,2.,0))*manifest['gain']
    frame=1-np.exp(-frame)
    frame=np.where(frame<=.0031308,frame*12.92,1.055*frame**(1/2.4)-.055)
    atlas.paste(Image.fromarray(np.uint8(np.clip(frame,0,1)*255)),(ix*W,(4-iy)*H))
    if ix==4:print('flare',iris,coat,iy,flush=True)
  name=f'flare-{iris}-{coat}.png';atlas.save(A/name);manifest['frames'].append(dict(iris=iris,coating=coat,file=name))
(A/'flare.json').write_text(json.dumps(manifest),encoding='utf8')
print('assets ready',len(records),flush=True)
