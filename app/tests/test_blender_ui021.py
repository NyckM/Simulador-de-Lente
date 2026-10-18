import bpy,sys,json,time
from pathlib import Path
root=Path(__file__).resolve().parents[1];sys.path.insert(0,str(root/'blender'))
import bruxos_physical_lens as a
a.register();scene=bpy.context.scene;baseline=scene.camera.data.type
results=[]
for key in a.PRESETS:
 p=scene.bruxos_lens;p.auto_update=False;p.preset=key
 t=time.perf_counter();assert bpy.ops.bruxos.apply_preset()=={'FINISHED'},key
 assert p.camera.data.custom_bytecode and len(p.surfaces)==len(a.PRESETS[key]['rows'])
 assert not any(o.get('bruxos_generated') for o in bpy.data.objects),'Meshes must be opt-in'
 results.append(dict(key=key,surfaces=len(p.surfaces),setup_ms=(time.perf_counter()-t)*1000))
p.preset='dgauss50';assert bpy.ops.bruxos.apply_preset()=={'FINISHED'}
fit_calls=[];original=a.focus_sensor;a.cached_focus.cache_clear()
def fit(*args):
 fit_calls.append(1);return original(*args)
a.focus_sensor=fit;a.sync_camera(scene,True);assert len(fit_calls)==1
timings=[];bytecode=p.camera.data.custom_bytecode
for i in range(20):
 p.exposure=i/10;p.coating_strength=i/20
 t=time.perf_counter();a.sync_camera(scene,False);timings.append((time.perf_counter()-t)*1000)
assert len(fit_calls)==1,'Exposure/coating must reuse focus fit'
assert p.camera.data.custom_bytecode==bytecode,'Runtime parameters must not recompile'
p.focus_m=4;a.sync_camera(scene,False);assert len(fit_calls)==2
assert bpy.ops.bruxos.build_meshes()=={'FINISHED'}
objects=[o for o in bpy.data.objects if o.get('bruxos_generated')];assert objects
meshes=[o.data.as_pointer() for o in objects]
p.focus_m=5;a.sync_camera(scene,True);assert [o.data.as_pointer() for o in objects]==meshes
p.lens_flare=True;p.preview_quality='FAST';a.sync_camera(scene,False);assert p.camera.data.cycles_custom['lens_flare']==0
a.render_begin(scene);assert p.camera.data.cycles_custom['lens_flare']==1 and p.lens_flare
a.render_end(scene);assert p.camera.data.cycles_custom['lens_flare']==0 and p.lens_flare
p.preview_quality='FULL';a.sync_camera(scene,False);assert p.camera.data.cycles_custom['lens_flare']==1
# Draw every panel with a recording layout: technical prescription is absent from main.
class Layout:
 def __init__(self,props=None):self.props=[] if props is None else props
 def prop(self,owner,key,**kw):self.props.append(key)
 def operator(self,*args,**kw):return self
 def label(self,*args,**kw):pass
 def row(self,**kw):return self
 def box(self):return self
 def column(self):return self
main=Layout();a.BRUXOS_PT_panel.draw(type('P',(),{'layout':main})(),bpy.context)
assert 'preset' in main.props and not any(k in main.props for k in ('nd','radius','thickness','dispersion','coating_nm'))
for cls in [a.BRUXOS_PT_bokeh,a.BRUXOS_PT_flare,a.BRUXOS_PT_technical,a.BRUXOS_PT_surfaces,a.BRUXOS_PT_splats]:
 assert 'DEFAULT_CLOSED' in cls.bl_options;cls.draw(type('P',(),{'layout':Layout()})(),bpy.context)
assert bpy.ops.bruxos.restore_camera()=={'FINISHED'};assert p.camera.data.type==baseline
a.unregister();assert a.render_begin not in bpy.app.handlers.render_pre
report=dict(passed=True,version='0.2.1',blender=bpy.app.version_string,presets=results,runtime_update_ms=timings,focus_fit_calls=len(fit_calls),runtime_parameters_reuse_fit=True,shader_unchanged=True,meshes_opt_in=True,focus_reuses_meshes=True,fast_preview_preserves_final_flare=True,collapsed_panels=True,restore=True)
(root/'research/blender-ui021-validation.json').write_text(json.dumps(report,indent=2));print('UI021_REPORT',json.dumps(report))
