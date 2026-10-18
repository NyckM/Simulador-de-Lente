"""Opaque image-grid triangles, discontinuity cuts and per-aperture rasterization.
No hidden-surface reconstruction. Coordinates and radiance use float64.
"""
import numpy as np
import time


def topology(valid,points,jump):
    h,w=valid.shape
    ids=np.arange(h*w).reshape(h,w)
    a=ids[:-1,:-1].ravel();b=ids[:-1,1:].ravel();c=ids[1:,:-1].ravel();d=ids[1:,1:].ravel()
    triangles=np.concatenate((np.stack((a,b,d),-1),np.stack((a,d,c),-1)))
    good=valid.ravel()[triangles].all(axis=1)
    invalid=int((~good).sum());triangles=triangles[good]
    z=points.reshape(-1,3)[triangles,2]
    continuous=z.max(axis=1)<=z.min(axis=1)*(1+jump)
    cut=int((~continuous).sum());triangles=triangles[continuous]
    remap=np.full(h*w,-1,dtype='int64');remap[valid.ravel()]=np.arange(valid.sum())
    return remap[triangles],dict(triangles=int(len(triangles)),invalid_triangles=invalid,depth_cut_triangles=cut,depth_jump_percent=jump*100)


def raster(uv,points,rgb,faces,width,height,cancel,kernel="sorted",stats=None):
    from .geometry_render import Cancelled
    nearest=np.full(width*height,np.inf);owners=np.full(width*height,np.iinfo('int64').max,dtype='int64');image=np.zeros((width*height,4))
    # Bound candidate memory independently of triangle size, including an
    # enormous foreground triangle covering the entire viewport.
    for first in range(0,len(faces),2048):
        if cancel():raise Cancelled()
        f=faces[first:first+2048];p=uv[f];finite=np.isfinite(p).all(axis=(1,2))
        p=np.where(np.isfinite(p),p,0)
        lo=np.ceil(np.clip(p.min(axis=1),[0,0],[width,height])).astype('int64')
        hi=np.floor(np.clip(p.max(axis=1),[-1,-1],[width-1,height-1])).astype('int64')
        span=np.maximum(hi-lo+1,0);counts=span[:,0]*span[:,1];counts[~finite]=0
        end=np.cumsum(counts);total=int(end[-1]) if len(end) else 0
        starts=end-counts
        for begin in range(0,total,200000):
            if cancel():raise Cancelled()
            if stats is not None:stats['candidate_pixels']+=min(200000,total-begin)
            flat=np.arange(begin,min(begin+200000,total));t=np.searchsorted(end,flat,side='right');local=flat-starts[t]
            x=lo[t,0]+local%span[t,0];y=lo[t,1]+local//span[t,0]
            v=p[t];den=(v[:,1,1]-v[:,2,1])*(v[:,0,0]-v[:,2,0])+(v[:,2,0]-v[:,1,0])*(v[:,0,1]-v[:,2,1])
            safe=np.where(np.abs(den)>1e-12,den,1)
            b0=((v[:,1,1]-v[:,2,1])*(x-v[:,2,0])+(v[:,2,0]-v[:,1,0])*(y-v[:,2,1]))/safe
            b1=((v[:,2,1]-v[:,0,1])*(x-v[:,2,0])+(v[:,0,0]-v[:,2,0])*(y-v[:,2,1]))/safe
            bary=np.stack((b0,b1,1-b0-b1),axis=-1)
            inside=(np.abs(den)>1e-12)&(bary.min(axis=1)>=-1e-10)
            t=t[inside];x=x[inside];y=y[inside];bary=bary[inside]
            if stats is not None:stats['accepted_fragments']+=len(t)
            if not len(t):continue
            vertices=f[t];weights=bary/points[vertices,2];inv=weights.sum(axis=1);depth=1/inv
            if kernel=='sorted':
                color=(weights[...,None]*rgb[vertices]).sum(axis=1)/inv[:,None]
                if stats is not None:stats['color_fragments']+=len(t)
            pixel=y*width+x;face_id=first+t
            if kernel=='reduction':
                # Stable pixel-only grouping preserves the monotonically ordered
                # face IDs within each bounded candidate chunk. Reduce depths per
                # pixel, then keep the first equal-depth face, matching lexsort.
                order=np.argsort(pixel,kind='stable');group_pixels=pixel[order];group_depths=depth[order];group_faces=face_id[order]
                group_starts=np.flatnonzero(np.concatenate(([True],group_pixels[1:]!=group_pixels[:-1])))
                group_lengths=np.diff(np.concatenate((group_starts,[len(pixel)])))
                minimum=np.minimum.reduceat(group_depths,group_starts)
                eligible=np.flatnonzero(group_depths==np.repeat(minimum,group_lengths))
                candidate_pixels=group_pixels[eligible]
                group_first=np.concatenate(([True],candidate_pixels[1:]!=candidate_pixels[:-1]))
                chosen=eligible[group_first];pixel=group_pixels[chosen];depth=group_depths[chosen];face_id=group_faces[chosen]
                closer=(depth<nearest[pixel])|((depth==nearest[pixel])&(face_id<owners[pixel]))
                source=order[chosen[closer]]
                if stats is not None:stats['color_fragments']+=len(source)
                # Interpolate RGB only for visible winners. Hidden fragments still
                # participate in exact depth/owner selection but need no color work.
                color=(weights[source,:,None]*rgb[vertices[source]]).sum(axis=1)/inv[source,None]
                pixel=pixel[closer];nearest[pixel]=depth[closer];owners[pixel]=face_id[closer]
                image[pixel,:3]=color;image[pixel,3]=1
            else:
                # Stable nearest-depth reduction; shared edges have a deterministic
                # face owner. Sort within the bounded chunk before writing each pixel.
                order=np.lexsort((face_id,depth,pixel));pixel=pixel[order];depth=depth[order];color=color[order];face_id=face_id[order]
                unique=np.concatenate(([True],pixel[1:]!=pixel[:-1]));pixel=pixel[unique];depth=depth[unique];color=color[unique];face_id=face_id[unique]
                closer=(depth<nearest[pixel])|((depth==nearest[pixel])&(face_id<owners[pixel]))
                pixel=pixel[closer];nearest[pixel]=depth[closer];owners[pixel]=face_id[closer]
                image[pixel,:3]=color[closer];image[pixel,3]=1
    return image


def render(points,rgb,k,shape,config,faces,mesh_info,progress,cancel):
    from .geometry_render import aperture,project,pupil_transform,Cancelled
    if not len(faces):raise ValueError('Sem triângulos válidos. Use o modo de pontos ou ajuste o limite de salto de profundidade.')
    h,w=shape;scale=min(1,config['size']/max(w,h));ow=max(1,round(w*scale));oh=max(1,round(h*scale));count=config['samples']
    points=np.asarray(points,dtype='f8');rgb=np.asarray(rgb,dtype='f8');out=np.zeros((oh*ow,4))
    spatial=config.get('spatial_samples',1);side=int(np.sqrt(spatial));axis=(np.arange(side)+.5)/side-.5
    offsets=np.array([(x,y) for y in axis for x in axis]);total=count*spatial;completed=0;projection_s=0.;raster_s=0.;accumulate_s=0.
    kernel=config.get('kernel','sorted') if config.get('engine','reference')=='optimized' else 'sorted';stats=dict(candidate_pixels=0,accepted_fragments=0,color_fragments=0)
    reuse=config.get('engine','reference')=='optimized' and (config['radius_mm']==0 or np.all(points[:,2]==config['focus_m']))
    blades=config.get('blades',0);rotation=config.get('rotation_deg',0.);aspect=config.get('pupil_aspect',1.)
    openings=aperture(1 if reuse else count,config['radius_mm']/1000,blades,rotation,aspect);evaluations=len(openings)*spatial
    for index,a in enumerate(openings):
        if cancel():raise Cancelled()
        before=time.perf_counter();uv=project(points,k,a,config['focus_m'])*[ow,oh]-.5;projection_s+=time.perf_counter()-before
        # Integrate visibility and perspective-correct radiance together. Averaging
        # a binary mask after the render would mix colors from hidden surfaces.
        for offset in offsets:
            if cancel():raise Cancelled()
            before=time.perf_counter();layer=raster(uv-offset,points,rgb,faces,ow,oh,cancel,kernel,stats);raster_s+=time.perf_counter()-before
            before=time.perf_counter();out+=layer/evaluations;accumulate_s+=time.perf_counter()-before
            completed+=count if reuse else 1;progress(completed,total)
    angles=np.arange(blades)*2*np.pi/blades+np.deg2rad(rotation) if blades else np.empty(0)
    vertices=np.stack((np.cos(angles),np.sin(angles)),axis=-1)*config['radius_mm']
    if aspect!=1:vertices=pupil_transform(np.stack((np.cos(np.arange(blades)*2*np.pi/blades),np.sin(np.arange(blades)*2*np.pi/blades)),axis=-1)*config['radius_mm'],aspect,rotation) if blades else np.empty((0,2))
    outline_angles=np.arange(blades if blades else 96)*2*np.pi/(blades if blades else 96)
    outline=pupil_transform(np.stack((np.cos(outline_angles),np.sin(outline_angles)),axis=-1)*config['radius_mm'],aspect,rotation)
    area_mm2=(blades*np.sin(2*np.pi/blades)/2 if blades else np.pi)*config['radius_mm']**2
    info=dict(mesh_info,pupil_shape='polygon' if blades else ('ellipse' if aspect!=1 else 'circle'),pupil_aspect=float(aspect),pupil_semiaxes_mm=[config['radius_mm']*np.sqrt(aspect),config['radius_mm']/np.sqrt(aspect)],pupil_outline_mm=outline.tolist(),blades=blades,rotation_deg=rotation,pupil_area_mm2=float(area_mm2),pupil_vertices_mm=vertices.tolist(),pupil_samples_mm=(openings*1000).tolist(),width=ow,height=oh,input_points=len(points),samples=count,spatial_samples=spatial,effective_samples=total,spatial_pattern='fixed centered square grid',kernel_used=kernel,candidate_pixels=stats['candidate_pixels'],accepted_fragments=stats['accepted_fragments'],color_fragments=stats['color_fragments'],actual_raster_evaluations=evaluations,reused_raster_evaluations=total-evaluations,projection_s=projection_s,raster_s=raster_s,accumulate_s=accumulate_s,focus_m=config['focus_m'],radius_mm=config['radius_mm'],model='thin-lens-grid-triangles',visibility='mesh',output_linear_energy=out[:,:3].sum(axis=0).tolist(),energy_semantics='integrated opaque radiance; not additive point flux',lost_linear_energy=None,occluded_linear_energy=None,resampling_linear_energy=None,coverage_min=float(out[:,3].min()),coverage_max=float(out[:,3].max()))
    return out.reshape(oh,ow,4).astype('f4'),info

