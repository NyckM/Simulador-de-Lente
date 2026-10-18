import bpy,sys,json,math
import numpy as np
from pathlib import Path
root=Path(__file__).resolve().parents[1];sys.path.insert(0,str(root/'blender'))
import bruxos_physical_lens as a
device=sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else 'CPU'
a.register();scene=bpy.context.scene
for o in list(scene.objects):
 if o.type!='CAMERA':bpy.data.objects.remove(o,do_unlink=True)
scene.camera.location=(0,0,0);scene.camera.rotation_euler=(0,0,0);scene.render.engine='CYCLES';scene.cycles.samples=128;scene.cycles.use_denoising=False;scene.cycles.shading_system=False
if device=='OPTIX':
 pref=bpy.context.preferences.addons['cycles'].preferences;pref.compute_device_type='OPTIX';pref.get_devices()
 for d in pref.devices:d.use=d.type=='OPTIX'
 assert any(d.use for d in pref.devices);scene.cycles.device='GPU'
else:scene.cycles.device='CPU'
scene.render.resolution_x=128;scene.render.resolution_y=96;scene.render.resolution_percentage=100;scene.world.color=(0,0,0)
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=0
assert bpy.ops.bruxos.create_lens()=={'FINISHED'};p=scene.bruxos_lens;p.auto_update=False;p.focus_m=2;p.fstop=2.2
material=bpy.data.materials.new('Bokeh lights');material.use_nodes=True;n=material.node_tree.nodes;n.clear();out=n.new('ShaderNodeOutputMaterial');emit=n.new('ShaderNodeEmission');emit.inputs['Color'].default_value=(1,.6,.2,1);emit.inputs['Strength'].default_value=20;material.node_tree.links.new(emit.outputs[0],out.inputs['Surface'])
for y in range(-2,3):
 for x in range(-3,4):
  bpy.ops.mesh.primitive_uv_sphere_add(segments=8,ring_count=4,radius=.025,location=(x*.4,y*.4,-5));bpy.context.object.data.materials.append(material)
folder=root/'research/blender030-bokeh';folder.mkdir(exist_ok=True);scene.render.image_settings.file_format='OPEN_EXR';scene.render.image_settings.color_depth='32'
def render(name):
 a.sync_camera(scene,False);scene.render.filepath=str(folder/(device+'-'+name+'.exr'));bpy.ops.render.render(write_still=True);im=bpy.data.images.load(scene.render.filepath,check_existing=False);v=np.array(im.pixels[:],dtype='f4').reshape(96,128,4);assert np.isfinite(v).all();im.filepath_raw=str(folder/(device+'-'+name+'.png'));im.file_format='PNG';im.save();bpy.data.images.remove(im);return v
base=render('PHYSICAL');assert base[:,:,:3].sum()>0
cases=[]
for kind in ['CIRCULAR','POLYGON','CAT_EYE','CROPPED','ANAMORPHIC','SWIRL']:
 p.bokeh_type=kind;p.blades=5 if kind=='POLYGON' else 7;v=render(kind);diff=float(np.mean(abs(base[:,:,:3]-v[:,:,:3])));assert diff>1e-5,(kind,diff);cases.append(dict(type=kind,mean_rgb_difference=diff))
p.bokeh_type='PHYSICAL';p.swirl=0;p.squeeze=1;p.cat_eye=0;p.crop_bokeh=0;p.coma=0;p.astigmatism=0;p.blades=7
zero=render('zero');assert np.max(abs(base-zero))<1e-6
# A mesh exactly in the optical focus plane must retain the original ray intersections.
for o in list(scene.objects):
 if o.type=='MESH':bpy.data.objects.remove(o,do_unlink=True)
sensor=p.camera.data.cycles_custom['sensor_z'];z=-(p.focus_m+sensor*.001)
bpy.ops.mesh.primitive_plane_add(size=1.2,location=(.15,0,z));plane=bpy.context.object
mat=bpy.data.materials.new('Focus checker');mat.use_nodes=True;nodes=mat.node_tree.nodes;nodes.clear();output=nodes.new('ShaderNodeOutputMaterial');em=nodes.new('ShaderNodeEmission');checker=nodes.new('ShaderNodeTexChecker');checker.inputs['Scale'].default_value=12;checker.inputs['Color1'].default_value=(1,1,1,1);checker.inputs['Color2'].default_value=(0,0,0,1);mat.node_tree.links.new(checker.outputs['Color'],em.inputs['Color']);mat.node_tree.links.new(em.outputs[0],output.inputs['Surface']);plane.data.materials.append(mat)
sharp=render('focused');p.swirl=.9;p.squeeze=2;p.coma=.5;p.astigmatism=.5;anchored=render('focused-modified');focus_error=float(np.max(abs(sharp-anchored)));focus_mean=float(np.mean(abs(sharp-anchored)))
def contrast(v):return float(np.mean(abs(np.diff(v[:,:,:3],axis=0)))+np.mean(abs(np.diff(v[:,:,:3],axis=1))))
contrast_ratio=contrast(anchored)/max(1e-10,contrast(sharp));assert focus_mean<1e-5 and contrast_ratio>.999,(focus_error,focus_mean,contrast_ratio)
a.unregister();report=dict(passed=True,device=device,blender=bpy.app.version_string,cases=cases,zero_exact=True,focus_plane_max_error=focus_error,focus_plane_mean_error=focus_mean,focus_contrast_ratio=contrast_ratio,fixture='128x96, 128 samples, near-focus checker and distant emissive points')
(folder/(device+'.json')).write_text(json.dumps(report,indent=2));print('BOKEH030',json.dumps(report))
