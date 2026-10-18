import sys, json, time
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import numpy as np
from dataclasses import asdict
from optics import cuda, cuda_worker
from optics.core import Settings


def main():
    worker=cuda_worker._worker
    records=[]
    try:
        assert cuda.available(), cuda.info()
        rng=np.random.default_rng(17)
        rgba=rng.random((48,64,4),dtype='f4');rgba[:,:,3]=1
        depth=np.linspace(0,1,48*64,dtype='f4').reshape(48,64)
        for revision in range(2):
            source=rgba*(1-.25*revision);source[:,:,3]=1
            token='worker-'+str(revision)
            cuda.upload(source,depth,token)
            worker.call('upload',source,depth,token,timeout=12)
            for mode in ('auto','cut','slicing'):
                settings=asdict(Settings(depth_mode=mode,depth_slices=4))
                for preview in (False,True):
                    args=(settings,64,48,32,32,True,False,.8,10,token)
                    direct,metadata=cuda.render(*args,preview=preview)
                    isolated,info=cuda_worker.render(*args,preview=preview)
                    np.testing.assert_array_equal(direct,isolated)
                    records.append(dict(mode=mode,preview=preview,source=revision,
                        max_error=0,worker_ms=info['workerRoundtripMs'],gpu_ms=info['gpuMs']))
        report=dict(passed=True,device=cuda.info()['device'],cases=records,
            generation=worker.generation,precision=['float16','float32'])
        path=Path(__file__).resolve().parents[1]/'research/cuda-worker-parity100.json'
        path.write_text(json.dumps(report,indent=2),encoding='utf-8')
        print(json.dumps(report,indent=2))
    finally:
        worker.close()


if __name__=='__main__':main()
