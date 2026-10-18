import bpy,sys,json,math
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parents[1];sys.path.insert(0,str(root/'blender'))
import bruxos_physical_lens as a
from bruxos_physical_lens.focus_tools import target_focus,update_target
from bruxos_physical_lens.optics import rows_from_props,effective_iris
a.register();s=bpy.context.scene;p=s.bruxos_lens;p.auto_update=False
assert bpy.ops.bruxos.create_lens()=={'FINISHED'}
c=p.camera;c.location=(0,0,0);c.rotation_euler=(0,0,0)
t=bpy.data.objects.new('Focus test',None);s.collection.objects.link(t);t.location=(2,0,-3);p.focus_target=t;p.track_focus=True;bpy.context.view_layer.update()
a.sync_camera(s,False)
rows=rows_from_props(p);iris,_=effective_iris(p,rows)
sensor,_=a.cached_focus(json.dumps(rows,sort_keys=True),p.focus_m,iris)
assert abs(p.focus_m+sensor*.001-3)<1e-4,(p.focus_m,sensor)
base=p.focus_m;t.location.x=6;bpy.context.view_layer.update();a.sync_camera(s,False);assert abs(p.focus_m-base)<1e-5
geometry=json.dumps(rows);fstop=p.fstop;focal=p.focal_mm
for look in a.CHARACTER_LOOKS:
 p.character_look=look['id'];assert bpy.ops.bruxos.apply_character()=={'FINISHED'}
 assert json.dumps(rows_from_props(p))==geometry and p.fstop==fstop and p.focal_mm==focal and p.focus_target==t
assert bpy.ops.bruxos.apply_character(reset=True)=={'FINISHED'} and p.swirl==0 and p.squeeze==1
s.unit_settings.scale_length=.01;t.location=(0,0,-400);bpy.context.view_layer.update();a.sync_camera(s,False)
sensor,_=a.cached_focus(json.dumps(rows,sort_keys=True),p.focus_m,iris);assert abs(p.focus_m+sensor*.001-4)<1e-4
s.unit_settings.scale_length=1;t.location=(0,0,-4);t.keyframe_insert('location',frame=1);t.location.z=-6;t.keyframe_insert('location',frame=10);s.frame_set(1);bpy.context.view_layer.update();a.sync_camera(s,False);near=p.focus_m;s.frame_set(10);bpy.context.view_layer.update();a.sync_camera(s,False);assert p.focus_m>near+1.9
hold=p.focus_m;assert bpy.ops.bruxos.clear_focus_target()=={'FINISHED'};t.location.z=-8;bpy.context.view_layer.update();assert p.focus_m==hold
p.track_focus=True;p.focus_target=t;t.location.z=1;bpy.context.view_layer.update()
try:target_focus(s,p);raise AssertionError('Behind camera accepted')
except ValueError:pass
p.track_focus=False;p.focus_target=None
a.unregister()
report={'passed':True,'blender':bpy.app.version_string,'axis_not_radial':True,'scene_units':True,'animated_target':True,'presets_preserve_optics':True,'clear_keeps_focus':True,'invalid_target_rejected':True}
(root/'research/lite-focus-validation.json').write_text(json.dumps(report,indent=2));print('LITE_VALIDATION',report)
