import bpy,sys,json
from pathlib import Path
root=Path(__file__).resolve().parents[1];sys.path.insert(0,str(root/'blender'))
import bruxos_physical_lens as a
a.register();scene=bpy.context.scene;p=scene.bruxos_lens;p.auto_update=False;bpy.ops.bruxos.create_lens();p.filter_add_kind='directional';bpy.ops.bruxos.edit_filter(action='ADD');f=p.filters[0]
for frame,mm,stop,swirl,angle in [(1,35,4,.2,0),(10,85,8,.8,90)]:
 p.focal_mm=mm;p.fstop=stop;p.swirl=swirl;f.rotation=angle
 for key in ['focal_mm','fstop','swirl']:p.keyframe_insert(data_path=key,frame=frame)
 f.keyframe_insert(data_path='rotation',frame=frame)
values=[]
for frame in [1,10,1]:
 scene.frame_set(frame)
 assert abs(p.camera.data.lens-p.focal_mm)<.001,(frame,p.camera.data.lens,p.focal_mm)
 assert abs(p.camera.data.cycles_custom['swirl']-p.swirl)<1e-5
 from bruxos_physical_lens.filters import scene_tree
 node=next(n for n in scene_tree(scene).nodes if n.get('bruxos_filter'));saved=json.loads(node['configuration']);assert abs(saved[0][0]['rotation']-f.rotation)<1e-5
 values.append(dict(frame=frame,mm=p.camera.data.lens,fstop=p.actual_fstop,swirl=p.swirl,filter_rotation=f.rotation))
a.unregister();report=dict(passed=True,blender=bpy.app.version_string,values=values,frame_correct=True)
(root/'research/blender030-animation.json').write_text(json.dumps(report,indent=2));print('ANIM030',report)
