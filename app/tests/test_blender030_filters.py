import bpy,sys,json,math
import numpy as np
from pathlib import Path
root=Path(__file__).resolve().parents[1];sys.path.insert(0,str(root/'blender'))
import bruxos_physical_lens as a
from bruxos_physical_lens.filters import KINDS,sync
a.register();scene=bpy.context.scene;p=scene.bruxos_lens;p.auto_update=False
scene.render.engine='CYCLES';scene.cycles.samples=1;scene.cycles.use_denoising=False;scene.render.resolution_x=192;scene.render.resolution_y=128;scene.render.resolution_percentage=100
scene.use_nodes=True
if hasattr(scene,'node_tree'):tree=scene.node_tree
else:
 tree=bpy.data.node_groups.new('Authored compositor','CompositorNodeTree');tree.interface.new_socket(name='Image',in_out='OUTPUT',socket_type='NodeSocketColor');output=tree.nodes.new('NodeGroupOutput');layer=tree.nodes.new('CompositorNodeRLayers');tree.links.new(layer.outputs['Image'],output.inputs[0]);scene.compositing_node_group=tree
output=next(n for n in tree.nodes if n.type=='COMPOSITE' or n.bl_idname=='NodeGroupOutput')
out=output;im=bpy.data.images.new('Asymmetric HDR filter fixture',192,128,alpha=True,float_buffer=True)
y,x=np.mgrid[:128,:192];colors=np.stack((.1+.2*(x/192),.05+.15*(y/128),.05+.1*(np.sin(x*.2)*np.cos(y*.3)+1),.25+.75*(x/192)),axis=-1).astype('f4')
colors[20:70,30:45,:3]=[1,.2,.05];colors[70:95,100:150,:3]=[.1,.4,1]
for xx,yy in [(20,20),(80,24),(130,30),(164,90),(56,100)]:colors[((x-xx)**2+(y-yy)**2)<9,:3]=[4,2,1]
im.pixels.foreach_set(colors.ravel());image=tree.nodes.new('CompositorNodeImage');image.image=im;tree.links.new(image.outputs['Image'],out.inputs[0])
folder=root/('research/blender030-filters-'+str(bpy.app.version[0]));folder.mkdir(exist_ok=True);scene.render.image_settings.file_format='OPEN_EXR';scene.render.image_settings.color_depth='32'
def render(name):
 scene.render.filepath=str(folder/(name+'.exr'));bpy.ops.render.render(write_still=True);v=bpy.data.images.load(scene.render.filepath,check_existing=False);raw=np.array(v.pixels[:],dtype='f4').reshape(128,192,4);assert np.isfinite(raw).all();v.filepath_raw=str(folder/(name+'.png'));v.file_format='PNG';v.save();bpy.data.images.remove(v);return raw
base=render('original');f=p.filters.add();f.amount=.8;f.radius=.07;f.shift=.07
result=[]
for kind in KINDS:
 f.kind=kind;sync(scene);b=render(kind);diff=float(np.mean(abs(b[:,:,:3]-base[:,:,:3])));alpha=float(np.max(abs(b[:,:,3]-base[:,:,3])));assert diff>1e-5,(kind,diff);assert alpha<1e-6,(kind,alpha);result.append(dict(kind=kind,mean_rgb_difference=diff,alpha_max_error=alpha))
f.kind='prism';f.region=True;f.x=.2;sync(scene);first=render('prism-region-left');f.x=.8;sync(scene);second=render('prism-region-right');assert np.mean(abs(first-second))>1e-5
f.kind='directional';f.region=False;f.rotation=0;sync(scene);first=render('directional-horizontal');f.rotation=90;sync(scene);second=render('directional-vertical');assert np.mean(abs(first-second))>1e-5
f.amount=0;sync(scene);zero=render('zero');assert np.max(abs(zero-base))<1e-6
a.unregister();report=dict(passed=True,blender=bpy.app.version_string,filters=result,region_position=True,directional_rotation=True,zero_exact=True,alpha_preserved=True,implementation='native compositor approximations, HDR fixture, 192x128')
(root/('research/blender030-filter-validation-'+str(bpy.app.version[0])+'.json')).write_text(json.dumps(report,indent=2));print('FILTER030_REPORT',json.dumps(report))
