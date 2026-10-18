import bpy,sys,json,math
from pathlib import Path
root=Path(__file__).resolve().parents[1];sys.path.insert(0,str(root/'blender'))
import bruxos_physical_lens as addon
mode=sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else 'camera_only'
addon.register();scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.samples=2
scene.render.resolution_x=64;scene.render.resolution_y=48;scene.render.resolution_percentage=100
pref=bpy.context.preferences.addons['cycles'].preferences;pref.compute_device_type='OPTIX';pref.get_devices()
for d in pref.devices:d.use=d.type=='OPTIX'
assert any(d.use for d in pref.devices),'No OptiX device'
scene.cycles.device='GPU'
scene.cycles.shading_system=mode=='global_osl'
assert bpy.ops.bruxos.create_lens()=={'FINISHED'};scene.bruxos_lens.auto_update=False
assert scene.cycles.shading_system==(mode=='global_osl')
# Large, connected material: camera OSL must not force this group through OSL.
mat=bpy.data.materials.new('Stress material');mat.use_nodes=True;n=mat.node_tree.nodes;l=mat.node_tree.links;n.clear()
out=n.new('ShaderNodeOutputMaterial');emit=n.new('ShaderNodeEmission');l.new(emit.outputs[0],out.inputs['Surface'])
tex=n.new('ShaderNodeTexCoord');acc=None
for i in range(100):
 noise=n.new('ShaderNodeTexNoise');noise.noise_dimensions='3D';noise.inputs['Scale'].default_value=1+i*.13;l.new(tex.outputs['Generated'],noise.inputs['Vector'])
 if acc is None:acc=noise.outputs['Fac']
 else:
  add=n.new('ShaderNodeMath');add.operation='ADD';l.new(acc,add.inputs[0]);l.new(noise.outputs['Fac'],add.inputs[1]);acc=add.outputs[0]
div=n.new('ShaderNodeMath');div.operation='DIVIDE';div.inputs[1].default_value=100;l.new(acc,div.inputs[0]);l.new(div.outputs[0],emit.inputs['Color'])
bpy.data.objects['Cube'].data.materials.clear();bpy.data.objects['Cube'].data.materials.append(mat)
scene.world.use_nodes=True;wn=scene.world.node_tree.nodes;wl=scene.world.node_tree.links
# Float HDR environment asset, local only.
img=bpy.data.images.new('HDR environment',width=16,height=8,float_buffer=True);img.pixels=[v for i in range(128) for v in (2.0+(i%16)/16,1.0,.5,1.0)]
env=wn.new('ShaderNodeTexEnvironment');env.image=img;wl.new(env.outputs['Color'],wn.get('Background').inputs['Color'])
report={'mode':mode,'blender_version':bpy.app.version_string,'camera_custom':scene.camera.data.type=='CUSTOM','global_osl':scene.cycles.shading_system,'material_nodes':len(n),'device':'OPTIX','success':False}
try:
 bpy.ops.render.render();report['success']=True
except Exception as exc:report['error']=str(exc)
if mode=='global_osl':
 assert not report['success'] and 'group data size' in report['error'],report
 assert bpy.ops.bruxos.use_native_materials()=={'FINISHED'}
 assert scene.camera.data.type=='CUSTOM' and scene.camera.data.custom_bytecode
 try:
  bpy.ops.render.render();report['recovered_native_materials']=True
 except Exception as exc:report['recovered_native_materials']=False;report['recovery_error']=str(exc)
 assert report['recovered_native_materials'],report
else:
 assert report['success'],report
 scene.bruxos_lens.focus_m=4;addon.sync_camera(scene,False);bpy.ops.render.render();report['focus_change_rerender']=True
 assert bpy.ops.bruxos.restore_camera()=={'FINISHED'};bpy.ops.render.render();report['restored_optix_rerender']=True

(root/f'research/blender-optix-{mode}.json').write_text(json.dumps(report,indent=2));print('OPTIX_REPORT',json.dumps(report))


