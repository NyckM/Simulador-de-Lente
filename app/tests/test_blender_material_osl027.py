import bpy,sys,json
from pathlib import Path
root=Path(__file__).resolve().parents[1];sys.path.insert(0,str(root/'blender'))
import bruxos_physical_lens as addon
addon.register();scene=bpy.context.scene;scene.cycles.device='CPU';scene.cycles.shading_system=True
assert bpy.ops.bruxos.create_lens()=={'FINISHED'};scene.bruxos_lens.auto_update=False
assert scene.cycles.shading_system,'User-authored OSL setting must be preserved'
shader=scene.camera.data.custom_bytecode
assert bpy.ops.bruxos.use_native_materials()=={'FINISHED'}
assert not scene.cycles.shading_system and scene.camera.data.custom_bytecode==shader and scene.camera.data.type=='CUSTOM'
# Existing OSL inside nested groups must not silently become native material shading.
mat=bpy.data.materials.new('Authored OSL');mat.use_nodes=True;bpy.data.objects['Cube'].data.materials.append(mat)
group=bpy.data.node_groups.new('Nested OSL','ShaderNodeTree');group.nodes.new('ShaderNodeScript');node=mat.node_tree.nodes.new('ShaderNodeGroup');node.node_tree=group
scene.cycles.shading_system=True
assert addon.material_osl_users(scene)==['Authored OSL']
try:result=bpy.ops.bruxos.use_native_materials()
except RuntimeError:result={'CANCELLED'}
assert result=={'CANCELLED'} and scene.cycles.shading_system
mat.node_tree.nodes.remove(node)
scene.world.use_nodes=True;script=scene.world.node_tree.nodes.new('ShaderNodeScript')
assert scene.world.name in addon.material_osl_users(scene)
scene.world.node_tree.nodes.remove(script)
assert bpy.ops.bruxos.use_native_materials()=={'FINISHED'}
assert bpy.ops.bruxos.restore_camera()=={'FINISHED'} and scene.cycles.shading_system
addon.unregister()
report={'passed':True,'preserves_existing_global_osl':True,'native_switch_keeps_camera_bytecode':True,'nested_script_guard':True,'world_script_guard':True,'restore_original_osl_setting':True,'blender':bpy.app.version_string}
(root/'research/blender-material-osl-guard027.json').write_text(json.dumps(report,indent=2));print(report)
