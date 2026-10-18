import sys,json,zipfile,subprocess,time
from pathlib import Path
from dataclasses import replace
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from optics.core import Settings
from optics.preview import kernel
O=ROOT/'research/animation-stage7';m=json.loads((ROOT/'data/animation-optics.json').read_text());defaults=Settings.parse({})
for c in m['controls']:assert getattr(defaults,c['key'])==c['default']
legacy=Settings.parse(dict(focus_m=2,source_m=5,iris_mm=4))
for c in m['controls']:assert getattr(legacy,c['key'])==c['default']
a=kernel(legacy,1.5,64);started=time.perf_counter();requests=0
for _ in range(50):
 for c in m['controls']:
  assert kernel(replace(legacy,**{c['key']:c['max']}),1.5,64) is a,c['key'];requests+=1
elapsed=(time.perf_counter()-started)*1000
errors=[]
with zipfile.ZipFile(O/'frames.zip') as z:
 names=sorted(n for n in z.namelist() if n.endswith('.png'));assert len(names)==3 and z.testzip() is None
 timeline=json.loads(z.read('timeline.json'));assert timeline['frames']==3 and timeline['fps']==30
 for i,name in enumerate(names):
  import io
  exported=np.asarray(Image.open(io.BytesIO(z.read(name))).convert('RGBA'),dtype='i2');preview=np.asarray(Image.open(O/f'preview-{i}.png').convert('RGBA'),dtype='i2');assert exported.shape==preview.shape
  error=int(abs(exported-preview).max());errors.append(error);assert error<=1,(i,error)
ffmpeg=ROOT/'native/media/ffmpeg.exe'
video=subprocess.run([str(ffmpeg),'-v','error','-i',str(O/'animation.mp4'),'-f','rawvideo','-pix_fmt','rgb24','-'],check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE).stdout
assert len(video)==3*192*128*3,len(video)
report=dict(passed=True,legacy_defaults=True,atlas_reused_for_all_controls=True,atlas_cache_requests=requests,atlas_cache_total_ms=elapsed,png_frames=3,png_preview_max_error_8bit=errors,mp4_decoded_frames=3,dimensions=[192,128],benchmark_scope='192x128 synthetic test, warm cache; not a 4K/video performance guarantee')
(O/'export-validation.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
