"""Bounded, process-local caches. Content hashes invalidate replaced inputs."""
from collections import OrderedDict
import hashlib,json,time,threading,copy
import numpy as np

LOCK=threading.RLock();PREPARED=OrderedDict();RESULTS=OrderedDict()
PREPARED_BYTES=128*1024*1024;RESULT_BYTES=64*1024*1024

def size(value):
    if isinstance(value,np.ndarray):return value.nbytes
    if isinstance(value,(tuple,list)):return sum(size(v) for v in value)
    if isinstance(value,dict):return sum(size(v) for v in value.values())
    return 0

def get(cache,key):
    with LOCK:
        value=cache.get(key)
        if value is not None:cache.move_to_end(key)
        return value

def put(cache,key,value,budget):
    if size(value)>budget:return False
    with LOCK:
        cache[key]=value;cache.move_to_end(key)
        while len(cache)>4 or sum(size(v) for v in cache.values())>budget:cache.popitem(last=False)
    return True

def clear():
    with LOCK:PREPARED.clear();RESULTS.clear()

def compute(folder,config,loader,progress,cancel):
    from .geometry_render import Cancelled,render as render_points
    from .geometry_mesh import render as render_mesh
    t=time.perf_counter();optimized=config.get('engine','reference')=='optimized';mesh=config['visibility']=='mesh'
    identity_s=0.;prepared_hit=False;result_hit=False;identity=None
    if cancel():raise Cancelled()
    if optimized:
        before=time.perf_counter();hashes=[]
        for path in (folder/f"geometry-{config['index']:06d}.npz",folder/f"rgb-{config['index']:06d}.png"):
            with path.open('rb') as file:
                digest=hashlib.sha256()
                for chunk in iter(lambda:file.read(1024*1024),b''):
                    if cancel():raise Cancelled()
                    digest.update(chunk)
                hashes.append(digest.hexdigest())
        identity=(str(folder.resolve()),*hashes,config['representation'],config['depth_jump_percent'])
        identity_s=time.perf_counter()-before
        result_key=(identity,json.dumps(config,sort_keys=True,separators=(',',':')))
        cached=get(RESULTS,result_key)
        if cached is not None:
            linear,original=cached;info=copy.deepcopy(original);result_hit=True
            info.update(actual_raster_evaluations=0,reused_raster_evaluations=info.get('effective_samples',config['samples']),projection_s=0.,raster_s=0.,accumulate_s=0.,candidate_pixels=0,accepted_fragments=0,color_fragments=0)
            if cancel():raise Cancelled()
            progress(config['samples']*config['spatial_samples'],config['samples']*config['spatial_samples'])
            info['performance']=dict(engine='optimized',result_cache_hit=True,geometry_cache_hit=False,identity_s=identity_s,prepare_s=0.,render_s=0.,compute_s=time.perf_counter()-t)
            return linear,info
    before=time.perf_counter();prepared=get(PREPARED,identity) if optimized else None
    if prepared is None:
        prepared=loader(folder,config['index'],config['representation'],True,config['depth_jump_percent']) if mesh else loader(folder,config['index'],config['representation'])
        if optimized:
            for value in prepared:
                if isinstance(value,np.ndarray):value.flags.writeable=False
            put(PREPARED,identity,prepared,PREPARED_BYTES)
    else:prepared_hit=True
    prepare_s=time.perf_counter()-before
    if cancel():raise Cancelled()
    before=time.perf_counter()
    if mesh:
        points,rgb,k,shape,faces,mesh_info=prepared
        linear,info=render_mesh(points,rgb,k,shape,config,faces,mesh_info,progress,cancel)
    else:
        points,rgb,k,shape=prepared;linear,info=render_points(points,rgb,k,shape,config,progress,cancel)
    render_s=time.perf_counter()-before
    if cancel():raise Cancelled()
    if optimized:
        linear.flags.writeable=False;put(RESULTS,result_key,(linear,copy.deepcopy(info)),RESULT_BYTES)
    info['performance']=dict(engine='optimized' if optimized else 'reference',result_cache_hit=result_hit,geometry_cache_hit=prepared_hit,identity_s=identity_s,prepare_s=prepare_s,render_s=render_s,compute_s=time.perf_counter()-t)
    return linear,info
