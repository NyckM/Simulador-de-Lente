"""Run against the local test server; verifies CPU timing boundaries and response."""
import os,json,base64
from io import BytesIO
from pathlib import Path
from urllib.request import Request,urlopen
import numpy as np
from PIL import Image
image=BytesIO();Image.new('RGB',(32,32),(80,120,200)).save(image,format='PNG')
body={'image':'data:image/png;base64,'+base64.b64encode(image.getvalue()).decode(),'settings':{'quality':'preview'}}
url=os.environ.get('OPTICA_TEST_URL','http://127.0.0.1:8886')
with urlopen(Request(url+'/api/render',data=json.dumps(body).encode(),headers={'Content-Type':'application/json'}),timeout=60) as r:result=json.load(r)
assert result['profile']['backend']=='cpu'
assert all(np.isfinite(v) and v>=0 for k,v in result['profile'].items() if k.endswith('_ms'))
assert Image.open(BytesIO(base64.b64decode(result['image'].split(',')[1]))).size==(32,32)
out=Path(__file__).resolve().parents[1]/'research/cpu-profile-stage3-validation.json'
out.write_text(json.dumps({'profile':result['profile'],'response_dimensions':[result['width'],result['height']],'image_valid':True},indent=2)+'\n')
print(out.read_text())
