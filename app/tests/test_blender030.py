import bpy,sys,json,math,time
from pathlib import Path
root=Path(__file__).resolve().parents[1];sys.path.insert(0,str(root/'blender'))
import bruxos_physical_lens as a
from bruxos_physical_lens.filters import KINDS,sync,restore
from bruxos_physical_lens.optics import rows_from_props,effective_iris,paraxial
a.register();scene=bpy.context.scene;p=scene.bruxos_lens;p.auto_update=False
assert bpy.ops.bruxos.create_lens()=={'FINISHED'}
focals=[]
for mm in [24,35,50,85]:
 assert bpy.ops.bruxos.set_focal(mm=mm)=={'FINISHED'}
 assert abs(p.camera.data.lens-mm)<.001,(p.camera.data.lens,mm)
 rows=rows_from_props(p);iris,f=effective_iris(p,rows);assert abs(f-p.actual_fstop)<.0001
 focals.append(dict(requested_mm=mm,actual_mm=p.camera.data.lens,fstop=f))
p.focal_mm=50;p.fstop=8;a.sync_camera(scene,False);assert abs(p.actual_fstop-8)<.001
p.fstop=1;a.sync_camera(scene,False);assert p.actual_fstop>1,'Physical aperture limit must be reported'
p.fstop=4
for kind in ['PHYSICAL','CIRCULAR','POLYGON','CAT_EYE','CROPPED','ANAMORPHIC','SWIRL']:
 p.bokeh_type=kind;a.sync_camera(scene,False);assert p.camera.data.custom_bytecode
p.bokeh_type='PHYSICAL';p.swirl=.75;p.squeeze=1.5;p.astigmatism=.5;p.coma=.3;p.cat_eye=.2;p.crop_bokeh=.1;p.edge_brightness=.5;p.vignette=.1;a.sync_camera(scene,False)
for key in ['swirl','squeeze','astigmatism','coma','cat_eye','crop_bokeh','edge_brightness','vignette']:assert abs(p.camera.data.cycles_custom[key]-getattr(p,key))<1e-5
# Native filters must preserve the user's original compositor source and unrelated nodes.
scene.use_nodes=True
if hasattr(scene,'node_tree'):tree=scene.node_tree
else:
 tree=bpy.data.node_groups.new('Authored compositor','CompositorNodeTree');tree.interface.new_socket(name='Image',in_out='OUTPUT',socket_type='NodeSocketColor');output=tree.nodes.new('NodeGroupOutput');layer=tree.nodes.new('CompositorNodeRLayers');tree.links.new(layer.outputs['Image'],output.inputs[0]);scene.compositing_node_group=tree
output=next(n for n in tree.nodes if n.type=='COMPOSITE' or n.bl_idname=='NodeGroupOutput');source=output.inputs[0].links[0].from_socket
sentinel=tree.nodes.new('CompositorNodeMath' if hasattr(bpy.types,'CompositorNodeMath') else 'ShaderNodeMath');sentinel.label='Authored node — preserve'
profiles=[]
for kind in KINDS:
 print('FILTER',kind,flush=True)
 p.filter_add_kind=kind;assert bpy.ops.bruxos.edit_filter(action='ADD')=={'FINISHED'}
 f=p.filters[-1];f.amount=.6;sync(scene)
 own=[n for n in tree.nodes if n.get('bruxos_filter')];assert len(own)==1 and own[0].inputs[0].links[0].from_socket==source
 profiles.append(dict(kind=kind,nodes=len(own[0].node_tree.nodes)))
 assert bpy.ops.bruxos.edit_filter(action='REMOVE',index=len(p.filters)-1)=={'FINISHED'}
 assert own[0].mute
p.filter_add_kind='prism';bpy.ops.bruxos.edit_filter(action='ADD');f=p.filters[0];f.x=.2;f.y=.8;f.rotation=40;f.scale=2;f.amount=.7
assert bpy.ops.bruxos.edit_filter(action='RESET',index=0)=={'FINISHED'};assert f.x==f.y==.5 and f.scale==1 and f.rotation==0 and abs(f.amount-.7)<1e-5
group=[n for n in tree.nodes if n.get('bruxos_filter')][0].node_tree;sync(scene);assert [n for n in tree.nodes if n.get('bruxos_filter')][0].node_tree==group
restore(scene);assert output.inputs[0].links[0].from_socket==source and sentinel in list(tree.nodes)
a.restore_camera(scene);a.unregister()
report=dict(passed=True,version='0.3.0',blender=bpy.app.version_string,focals=focals,fstop=True,aperture_limit=True,bokeh_types=7,pupil_modifiers=True,filters=profiles,compositor_restore=True,reset_transform_only=True,unchanged_filter_graph_reused=True)
(root/('research/blender030-controls-'+str(bpy.app.version[0])+'.json')).write_text(json.dumps(report,indent=2));print('BLENDER030',json.dumps(report))
