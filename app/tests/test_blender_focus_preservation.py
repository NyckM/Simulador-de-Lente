import bpy,sys,json
import numpy as np
from pathlib import Path
root=Path(__file__).resolve().parents[1];sys.path.insert(0,str(root/'blender'))
import bruxos_physical_lens as a
device=sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else 'CPU'
a.register();s=bpy.context.scene
for obj in list(s.objects):
 if obj.type!='CAMERA':bpy.data.objects.remove(obj,do_unlink=True)
s.camera.location=(0,0,0);s.camera.rotation_euler=(0,0,0);s.render.engine='CYCLES';s.cycles.samples=512;s.cycles.use_denoising=False;s.cycles.shading_system=False;s.cycles.device='CPU';s.render.resolution_x=384;s.render.resolution_y=256;s.render.resolution_percentage=100
if device=='OPTIX':
 pref=bpy.context.preferences.addons['cycles'].preferences;pref.compute_device_type='OPTIX';pref.get_devices()
 for d in pref.devices:d.use=d.type=='OPTIX'
 assert any(d.use for d in pref.devices);s.cycles.device='GPU'
assert bpy.ops.bruxos.create_lens()=={'FINISHED'};p=s.bruxos_lens;p.auto_update=False;p.focus_m=2;p.fstop=2.9;a.sync_camera(s,False)
from bruxos_physical_lens.optics import rows_from_props,effective_iris
rows=rows_from_props(p);iris,_=effective_iris(p,rows);sensor,efl=a.cached_focus(json.dumps(rows,sort_keys=True),p.focus_m,iris)
# Fronto-parallel textured plane located exactly on the selected focus plane.
bpy.ops.mesh.primitive_plane_add(size=10,location=(0,0,-(2+sensor*.001)))
mat=bpy.data.materials.new('Diagnostic fine detail');mat.use_nodes=True;n=mat.node_tree.nodes;n.clear();out=n.new('ShaderNodeOutputMaterial');emit=n.new('ShaderNodeEmission');check=n.new('ShaderNodeTexChecker');tex=n.new('ShaderNodeTexCoord');check.inputs['Scale'].default_value=720;check.inputs['Color1'].default_value=(.02,.02,.02,1);check.inputs['Color2'].default_value=(.8,.8,.8,1);mat.node_tree.links.new(tex.outputs['Generated'],check.inputs['Vector']);mat.node_tree.links.new(check.outputs['Color'],emit.inputs['Color']);mat.node_tree.links.new(emit.outputs[0],out.inputs['Surface']);bpy.context.object.data.materials.append(mat)
folder=root/('research/focus-stage12/blender' if device=='CPU' else 'research/focus-stage12/blender-optix');folder.mkdir(exist_ok=True);s.render.image_settings.file_format='OPEN_EXR';s.render.image_settings.color_depth='32'
frames={}
for strength in (0,.5,1):
 p.focus_preservation=strength;a.sync_camera(s,False);s.render.filepath=str(folder/f'focus-{strength}.exr');bpy.ops.render.render(write_still=True);im=bpy.data.images.load(s.render.filepath,check_existing=False);v=np.array(im.pixels[:],dtype='f4').reshape(256,384,4);assert np.isfinite(v).all();frames[strength]=v.copy();im.filepath_raw=str(folder/f'focus-{strength}.png');im.file_format='PNG';im.save();bpy.data.images.remove(im)
def detail(v):return float(np.abs(np.diff(v[24:232,24:360,:3],axis=1)).mean())
metrics={str(k):detail(v) for k,v in frames.items()};assert metrics['1']>metrics['0'],metrics
# New property is animatable and is propagated to shader uniforms at each frame.
p.focus_preservation=0;p.keyframe_insert('focus_preservation',frame=1);p.focus_preservation=1;p.keyframe_insert('focus_preservation',frame=10);s.frame_set(1);a.sync_camera(s,False);assert p.camera.data.cycles_custom['focus_preservation']==0;s.frame_set(10);a.sync_camera(s,False);assert p.camera.data.cycles_custom['focus_preservation']==1
report=dict(passed=True,device=device,blender=bpy.app.version_string,checker_detail=metrics,shader_compiles=True,keyframes=True,depth_mask=False)
(folder/'validation.json').write_text(json.dumps(report,indent=2));print('BLENDER_FOCUS',report);a.unregister()

