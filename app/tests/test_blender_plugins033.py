import bpy,sys,json
import numpy as np
from pathlib import Path
root=Path(__file__).resolve().parents[1];sys.path.insert(0,str(root/'blender'))
import bruxos_physical_lens as a
device=sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else 'CPU'
a.register();s=bpy.context.scene
for obj in list(s.objects):
 if obj.type!='CAMERA':bpy.data.objects.remove(obj,do_unlink=True)
s.camera.location=(0,0,0);s.camera.rotation_euler=(0,0,0);s.render.engine='CYCLES';s.cycles.samples=256;s.cycles.seed=41;s.cycles.use_denoising=False;s.cycles.shading_system=False;s.cycles.device='CPU';s.render.resolution_x=128;s.render.resolution_y=96;s.render.resolution_percentage=100
if device=='OPTIX':
 pref=bpy.context.preferences.addons['cycles'].preferences;pref.compute_device_type='OPTIX';pref.get_devices()
 for d in pref.devices:d.use=d.type=='OPTIX'
 assert any(d.use for d in pref.devices);s.cycles.device='GPU'
bpy.ops.bruxos.create_lens();p=s.bruxos_lens;p.auto_update=False;p.focus_m=2;p.fstop=2.8
bpy.ops.mesh.primitive_plane_add(size=5,location=(0,0,-5));mat=bpy.data.materials.new('Texture probe');mat.use_nodes=True;n=mat.node_tree.nodes;n.clear();o=n.new('ShaderNodeOutputMaterial');e=n.new('ShaderNodeEmission');check=n.new('ShaderNodeTexChecker');tex=n.new('ShaderNodeTexCoord');check.inputs['Scale'].default_value=24;check.inputs['Color1'].default_value=(0,0,0,1);check.inputs['Color2'].default_value=(1,1,1,1);mat.node_tree.links.new(tex.outputs['Generated'],check.inputs['Vector']);mat.node_tree.links.new(check.outputs['Color'],e.inputs['Color']);mat.node_tree.links.new(e.outputs[0],o.inputs['Surface']);bpy.context.object.data.materials.append(mat)
folder=root/'research/plugins-update';folder.mkdir(exist_ok=True);s.render.image_settings.file_format='OPEN_EXR';s.render.image_settings.color_depth='32'
images=[]
for rings,grain,angle in [(0,0,0),(1,.8,45),(1,.8,90)]:
 p.bokeh_texture_rings=rings;p.bokeh_texture_grain=grain;p.bokeh_texture_rotation=angle;a.sync_camera(s,False);s.render.filepath=str(folder/f'blender-{device}-{len(images)}.exr');bpy.ops.render.render(write_still=True);im=bpy.data.images.load(s.render.filepath,check_existing=False);v=np.array(im.pixels[:],dtype='f4').reshape(96,128,4);assert np.isfinite(v).all();images.append(v);bpy.data.images.remove(im)
assert np.max(np.abs(images[0]-images[1]))>1e-4;assert np.max(np.abs(images[1]-images[2]))>1e-4
for frame,ring,rot in [(1,0,0),(10,1,90)]:
 p.bokeh_texture_rings=ring;p.bokeh_texture_rotation=rot;p.keyframe_insert('bokeh_texture_rings',frame=frame);p.keyframe_insert('bokeh_texture_rotation',frame=frame)
for frame,ring,rot in [(1,0,0),(10,1,90),(1,0,0)]:
 s.frame_set(frame);a.sync_camera(s,False);assert abs(p.camera.data.cycles_custom['bokeh_texture_rings']-ring)<1e-6;assert abs(p.camera.data.cycles_custom['bokeh_texture_rotation']-rot)<1e-6
report=dict(passed=True,blender=bpy.app.version_string,device=device,OSL=True,texture_image_change=float(np.max(np.abs(images[0]-images[1]))),texture_rotation_change=float(np.max(np.abs(images[1]-images[2]))),keyframes=True);(folder/f'blender-{device}.json').write_text(json.dumps(report,indent=2));print('PLUGIN033',report);a.unregister()
