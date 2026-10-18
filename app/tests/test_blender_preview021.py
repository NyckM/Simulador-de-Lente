import bpy,sys,json,math
from pathlib import Path
root=Path(__file__).resolve().parents[1];sys.path.insert(0,str(root/'blender'))
import bruxos_physical_lens as a
a.register();scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=16;scene.cycles.use_denoising=False
device=sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else 'CPU'
if device=='OPTIX':
 prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='OPTIX';prefs.get_devices()
 for d in prefs.devices:d.use=d.type=='OPTIX'
 assert any(d.use for d in prefs.devices);scene.cycles.device='GPU'
else:scene.cycles.device='CPU'
scene.cycles.shading_system=False;scene.render.resolution_x=64;scene.render.resolution_y=48;scene.render.resolution_percentage=100
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=1
assert bpy.ops.bruxos.create_lens()=={'FINISHED'};p=scene.bruxos_lens;p.auto_update=False;p.lens_flare=True;p.flare_gain=1
seen=[]
def observe(scene,*args):seen.append(int(p.camera.data.cycles_custom['lens_flare']))
bpy.app.handlers.render_pre.append(observe)
values=[];out=root/'research/blender-preview021';out.mkdir(exist_ok=True)
scene.render.image_settings.file_format='OPEN_EXR';scene.render.image_settings.color_depth='32'
for mode in ['FAST','FULL']:
 p.preview_quality=mode;a.sync_camera(scene,False);scene.render.filepath=str(out/(device+'-'+mode+'.exr'));bpy.ops.render.render(write_still=True)
 im=bpy.data.images.load(scene.render.filepath,check_existing=False);pixels=list(im.pixels);bpy.data.images.remove(im);assert all(math.isfinite(x) for x in pixels);values.append(pixels)
 assert int(p.camera.data.cycles_custom['lens_flare'])==(mode=='FULL')
assert seen==[1,1],seen
error=max(abs(x-y) for x,y in zip(*values));assert error<1e-6,error
assert sum(values[0][::4])>0
bpy.app.handlers.render_pre.remove(observe);a.unregister()
report=dict(passed=True,device=device,blender=bpy.app.version_string,final_render_flare_enabled=seen,fast_full_max_error=error,preview_restored_after_render=True,material_osl_preserved=True)
(out/(device+'.json')).write_text(json.dumps(report,indent=2));print('PREVIEW021_REPORT',json.dumps(report))
