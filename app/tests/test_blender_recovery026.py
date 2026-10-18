import bpy,sys,json
from pathlib import Path
root=Path(__file__).resolve().parents[1];sys.path.insert(0,str(root/'blender'))
import bruxos_physical_lens as addon
addon.register();scene=bpy.context.scene;original=scene.camera.data;baseline=dict(type=original.type,clip_start=original.clip_start,lens=original.lens,engine=scene.render.engine,shading_system=scene.cycles.shading_system)
assert bpy.ops.bruxos.create_lens()=={'FINISHED'};p=scene.bruxos_lens;p.auto_update=False
assert p.camera.data.type=='CUSTOM' and p.camera.data.custom_bytecode
assert scene.cycles.shading_system==baseline['shading_system']
objects=[o for o in bpy.data.objects if o.get('bruxos_generated')];meshes=[o.data.as_pointer() for o in objects]
source_calls=[];source=addon.camera_source
addon.camera_source=lambda rows:(source_calls.append(1) or source(rows))
for _ in range(3):assert addon.sync_camera(scene,False) is None
assert not source_calls
p.focus_m=4;addon.sync_camera(scene,True);assert [o.data.as_pointer() for o in objects]==meshes
assert bpy.ops.bruxos.use_cpu()=={'FINISHED'} and scene.cycles.device=='CPU' and p.camera.data.type=='CUSTOM'
assert bpy.ops.bruxos.restore_camera()=={'FINISHED'}
assert original.type==baseline['type'] and original.clip_start==baseline['clip_start'] and original.lens==baseline['lens']
assert scene.render.engine==baseline['engine'] and scene.cycles.shading_system==baseline['shading_system']
assert not original.custom_shader and not original.custom_bytecode
assert not any(o.get('bruxos_generated') for o in bpy.data.objects)
assert not p.auto_update
assert bpy.ops.bruxos.create_lens()=={'FINISHED'}
addon.unregister();assert original.type==baseline['type'] and not original.custom_shader
report=dict(passed=True,version='0.1.3',unchanged_frames_no_shader_work=True,focus_reuses_meshes=True,cpu_preserves_osl=True,restore_original_camera=True,clears_owned_shader_and_bytecode=True,unregister_restores=True,optix_group_limit_removed=False,material_shading_setting_preserved=True)
(root/'research/blender026-validation.json').write_text(json.dumps(report,indent=2));print(report)
