import bpy,sys,json,math
from pathlib import Path
root=Path(__file__).resolve().parents[1];sys.path.insert(0,str(root/'blender'))
from bruxos_physical_lens.shader import camera_source
device=sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else 'CPU'
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=256;scene.cycles.use_denoising=False
scene.render.resolution_x=48;scene.render.resolution_y=32;scene.render.resolution_percentage=100
scene.cycles.shading_system=False
if device=='OPTIX':
 prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='OPTIX';prefs.get_devices()
 for d in prefs.devices:d.use=d.type=='OPTIX'
 assert any(d.use for d in prefs.devices);scene.cycles.device='GPU'
else:scene.cycles.device='CPU'
for obj in list(scene.objects):
 if obj.type!='CAMERA':bpy.data.objects.remove(obj,do_unlink=True)
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(1,1,1,1);scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=1
rows=[dict(radius=0,thickness=5,diameter=1000,nd=1.5,abbe=55,dx=0,dy=0,tx=0,ty=0,stop=0),dict(radius=0,thickness=0,diameter=1000,nd=1,abbe=55,dx=0,dy=0,tx=0,ty=0,stop=0)]
cam=scene.camera.data;cam.type='CUSTOM';cam.custom_mode='INTERNAL';text=bpy.data.texts.new('Plane plate reflection test');text.write(camera_source(rows));cam.custom_shader=text
from cycles.osl import update_custom_camera_shader
errors=[];assert update_custom_camera_shader(cam,lambda severity,msg:errors.append(msg)),errors
settings=cam.cycles_custom
for key,v in dict(sensor_z=80.,iris_radius=6.,blades=0,iris_rotation=0.,dispersion=0.,spectral_bokeh=1,exposure=0.,mm_to_scene=.001,coating_nm=550.).items():settings[key]=v
scene.render.image_settings.file_format='OPEN_EXR';scene.render.image_settings.color_depth='32'
out=root/'research/blender-flare020';out.mkdir(exist_ok=True)
means={}
for name,enabled,gain,coat in [('base',0,0,0),('zero',1,0,0),('flare',1,40,0),('coated-base',0,0,1),('coated-flare',1,40,1)]:
 settings['lens_flare']=enabled;settings['flare_gain']=float(gain);settings['coating_strength']=float(coat);cam.update_tag()
 scene.render.filepath=str(out/(device+'-'+name+'.exr'));bpy.ops.render.render(write_still=True)
 img=bpy.data.images.load(scene.render.filepath,check_existing=False);values=list(img.pixels)
 assert values and all(math.isfinite(v) for v in values)
 means[name]=sum(values[i] for i in range(0,len(values),4))/(len(values)/4);bpy.data.images.remove(img)
assert abs(means['base']-means['zero'])<1e-7,means
assert means['flare']>means['base']+.01,means
assert means['coated-base']>means['base'],means
assert means['coated-flare']-means['coated-base']<means['flare']-means['base'],means
report=dict(passed=True,device=device,blender=bpy.app.version_string,means=means,zeroExact=True,globalMaterialOSL=scene.cycles.shading_system,limits='plane plate scene; 256 samples; two reflections only; hash-based path sampling')
(out/(device+'.json')).write_text(json.dumps(report,indent=2));print('FLARE_REPORT',json.dumps(report))
