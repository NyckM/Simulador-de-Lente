bl_info={'name':'Bruxos Physical Lens','author':'Bruxosdovfx','version':(0,4,0),'blender':(4,5,0),'location':'View3D > Sidebar > Bruxos','description':'Sequential refractive OSL camera, editable lens elements and Gaussian volume bridge','category':'Render'}

import bpy,math,json,hashlib,time
from functools import lru_cache
from pathlib import Path
from bpy.props import FloatProperty,IntProperty,BoolProperty,EnumProperty,CollectionProperty,PointerProperty,StringProperty
from bpy.app.handlers import persistent
from mathutils import Vector,Matrix
from .optics import rows_from_props,validate,focus_sensor,vertices,sag,paraxial,aperture_info,effective_iris
from .shader import camera_source
from .filters import ITEMS as FILTER_ITEMS,PRISM_TYPES,sync as sync_filters,restore as restore_filters

ROOT=Path(__file__).resolve().parent
_busy=False
_pending=False
_timers=set()
_last_change=0.
_rendering=set()
PRESETS=json.loads((ROOT/'data/presets.json').read_text(encoding='utf8'))
CHARACTER_LOOKS=json.loads((ROOT/'data/character-looks.json').read_text(encoding='utf8'))
CHARACTER_ITEMS=[(p['id'],p.get('blender_name',p['name']),'Caráter artístico separado da prescrição') for p in CHARACTER_LOOKS]
PRESET_ITEMS=[(key,data['name'],data['note']) for key,data in PRESETS.items()]
PREVIEW_ITEMS={
 'pt-BR':[('FAST','Leve · flare só no render final','Mantém os vidros e o bokeh; desliga reflexos internos na prévia'),('FULL','Completa · com flare','Inclui reflexos internos na prévia; exige mais amostras')],
 'en':[('FAST','Fast · flare on final render only','Keep lens optics and bokeh; disable reflected flare in viewport'),('FULL','Full · with flare','Include internal reflections in viewport; requires more samples')],
 'zh-CN':[('FAST','轻量 · 仅最终渲染耀斑','保留光学与散景，预览中关闭内部反射'),('FULL','完整 · 含耀斑','预览内部反射，需要更多采样')],
}
def preview_items(self,context):return PREVIEW_ITEMS.get(self.language,PREVIEW_ITEMS['en'])


@lru_cache(maxsize=32)
def cached_focus(rows_json,focus,iris):
 return focus_sensor(json.loads(rows_json),focus,iris)

@lru_cache(maxsize=16)
def cached_source(rows_json):
 return camera_source(json.loads(rows_json))

@lru_cache(maxsize=128)
def texture_mean(rings,grain,scale,rotation):
 # Deterministic normalization over a circular pupil; physical clipping stays in OSL.
 if rings==0 and grain==0:return 1.
 import numpy as np
 r=np.sqrt((np.arange(64)+.5)/64)[:,None];a=(np.arange(128)+.5)*2*np.pi/128+math.radians(rotation)
 x=r*np.cos(a)*scale;y=r*np.sin(a)*scale
 radial=.5+.5*np.cos(2*np.pi*np.hypot(x,y))
 noise=.5+.25*np.sin(2.17*x+.7)*np.sin(1.73*y+1.3)+.25*np.sin(4.31*x+1.9)*np.sin(3.11*y-.4)
 return float(np.mean((1-rings*.8*(1-radial))*(1-grain*.7*(1-noise))))

LABELS={
 'Approximate optical profiles':('Perfis ópticos aproximados','近似光学模型'),
 'Camera':('Câmera','相机'),'Lens preset':('Preset de lente','镜头预设'),'Apply preset':('Aplicar preset','应用预设'),'Preview':('Prévia','预览'),'Flare on final render only':('Flare ativo só no render final','耀斑仅在最终渲染启用'),
 'Use native materials':('Usar materiais nativos · câmera OSL','使用原生材质 · OSL 相机'),
 'Material OSL':('OSL nos materiais','材质 OSL'),
 'Use optical lens on CPU':('Usar lente óptica em CPU','使用 CPU 光学镜头'),'Restore original camera':('Restaurar câmera original','恢复原始相机'),
 'Create lens':('Criar lente','创建镜头'),'Apply changes':('Aplicar alterações','应用修改'),
 'Build glass meshes':('Gerar vidros 3D','生成三维镜片'),'Focus · m':('Foco · m','对焦 · 米'),
 'Iris radius · mm':('Raio da íris · mm','光圈半径 · 毫米'),'Blades':('Lâminas','光圈叶片'),
 'Coating strength':('Força do coating','镀膜强度'),'Coating wavelength · nm':('Coating · nm','镀膜波长 · nm'),'Lens flare':('Lens Flare · reflexos internos','镜头耀斑 · 内部反射'),'Flare gain':('Ganho do flare','耀斑增益'),
 'Spectral bokeh':('Bokeh espectral · arco-íris','光谱散景 · 彩虹'),
 'Rotation':('Rotação','旋转'),'Dispersion':('Dispersão','色散'),'Exposure':('Exposição','曝光'),
 'Sensor · mm':('Sensor · mm','传感器 · 毫米'),'Language':('Idioma','语言'),
 'Surfaces':('Superfícies','光学表面'),'Automatic update':('Atualização automática','自动更新'),
 'Import prescription JSON':('Importar prescrição JSON','导入光学处方 JSON'),
 'Import PLY · volume proxy':('Importar PLY · proxy volumétrico','导入 PLY · 体积代理'),
 'Import native Gaussian Splats':('Importar Gaussian Splats nativos','导入原生高斯泼溅'),
 'Splat compatibility':('Compatibilidade de splats','高斯泼溅兼容性'),
 'Cycles CPU or OptiX only':('Somente Cycles CPU ou OptiX','仅支持 Cycles CPU 或 OptiX'),
 'Analytical camera + inspection meshes':('Câmera analítica + vidros para inspeção','解析光学相机 + 检查镜片'),
}
def tr(s,p):
 pair=LABELS.get(s)
 return s if p.language=='en' or not pair else pair[0 if p.language=='pt-BR' else 1]

def changed(self,context):
 global _pending,_last_change
 if _busy or not context or not context.scene:return
 _last_change=time.monotonic()
 if _pending:return
 p=context.scene.bruxos_lens
 if not p.auto_update or not p.camera or not p.surfaces:return
 _pending=True
 scene=context.scene
 def apply():
  global _pending
  if time.monotonic()-_last_change<.45:return .15
  _pending=False;_timers.discard(apply)
  try:
   if scene.name in bpy.data.scenes and hasattr(scene,'bruxos_lens') and scene.bruxos_lens.auto_update:sync_camera(scene,False)
  except Exception as exc:scene.bruxos_lens.status=str(exc)
  return None
 _timers.add(apply);bpy.app.timers.register(apply,first_interval=.35)


def bokeh_changed(self,context):
 global _busy
 if _busy:return
 _busy=True
 try:
  self.swirl=0;self.squeeze=1;self.cat_eye=0;self.crop_bokeh=0
  if self.bokeh_type=='SWIRL':self.swirl=.8
  elif self.bokeh_type=='ANAMORPHIC':self.squeeze=2
  elif self.bokeh_type=='CAT_EYE':self.cat_eye=.7
  elif self.bokeh_type=='CROPPED':self.crop_bokeh=.6
  elif self.bokeh_type=='CIRCULAR':self.blades=0
  elif self.bokeh_type=='POLYGON' and self.blades<3:self.blades=7
 finally:_busy=False
 changed(self,context)

class BruxosSurface(bpy.types.PropertyGroup):
 radius:FloatProperty(name='Radius mm',default=0,update=changed)
 thickness:FloatProperty(name='Thickness mm',default=1,min=0,update=changed)
 diameter:FloatProperty(name='Diameter mm',default=20,min=.01,update=changed)
 nd:FloatProperty(name='IOR d',default=1,min=1,max=2.5,precision=5,update=changed)
 abbe:FloatProperty(name='Abbe Vd',default=55,min=1,max=150,update=changed)
 stop:BoolProperty(name='Stop',default=False,update=changed)
 dx:FloatProperty(name='Decenter X mm',default=0,update=changed)
 dy:FloatProperty(name='Decenter Y mm',default=0,update=changed)
 tx:FloatProperty(name='Tilt X degrees',default=0,min=-20,max=20,update=changed)
 ty:FloatProperty(name='Tilt Y degrees',default=0,min=-20,max=20,update=changed)

class BruxosFilter(bpy.types.PropertyGroup):
 kind:EnumProperty(items=FILTER_ITEMS,default='black_mist',update=changed)
 enabled:BoolProperty(default=True,update=changed)
 amount:FloatProperty(default=.35,min=0,max=1,update=changed)
 x:FloatProperty(default=.5,min=-1,max=2,update=changed)
 y:FloatProperty(default=.5,min=-1,max=2,update=changed)
 scale:FloatProperty(default=1,min=.05,max=4,update=changed)
 rotation:FloatProperty(default=0,min=-360,max=360,update=changed)
 radius:FloatProperty(default=.04,min=.001,max=.3,update=changed)
 shift:FloatProperty(default=.04,min=-.5,max=.5,update=changed)
 count:IntProperty(default=4,min=2,max=8,update=changed)
 region:BoolProperty(default=False,update=changed)
 feather:FloatProperty(default=.25,min=.01,max=1,update=changed)
 prism_type:EnumProperty(name='Tipo de prisma',items=PRISM_TYPES,default='0',update=changed)
 edge_blur:FloatProperty(name='Borda do vidro · desfoque',default=.06,min=0,max=.3,update=changed)
 threshold:FloatProperty(name='Limiar de luz',default=.7,min=0,max=20,update=changed)
 show_controls:BoolProperty(default=False)

class BruxosSettings(bpy.types.PropertyGroup):
 camera:PointerProperty(type=bpy.types.Object,poll=lambda self,obj:obj.type=='CAMERA')
 surfaces:CollectionProperty(type=BruxosSurface)
 preset:EnumProperty(name='Lens preset',items=PRESET_ITEMS,default='dgauss50')
 active_preset:StringProperty(default='')
 preview_quality:EnumProperty(items=preview_items,default=0,update=changed)
 inspection_meshes:BoolProperty(default=False)
 language:EnumProperty(name='Language',items=[('pt-BR','Português',''),('en','English',''),('zh-CN','简体中文','')],default='pt-BR')
 focal_mm:FloatProperty(name='Focal length mm',default=0,min=0,max=1000,update=changed)
 fstop:FloatProperty(default=4,min=.7,max=64,update=changed)
 aperture_mode:EnumProperty(items=[('FSTOP','f-stop','Entrance pupil f-number'),('RADIUS','Raio · mm','Physical iris radius')],default='RADIUS',update=changed)
 actual_fstop:FloatProperty(default=4)
 bokeh_type:EnumProperty(items=[('PHYSICAL','Óptico · prescrição','Real lens geometry'),('CIRCULAR','Circular','Round iris'),('POLYGON','Poligonal','Bladed iris'),('CAT_EYE',"Cat’s eye",'Artistic field-dependent pupil clipping'),('CROPPED','Recortado','Artistic off-axis clipping'),('ANAMORPHIC','Anamórfico','Artistic pupil squeeze'),('SWIRL','Swirl','Artistic tangential pupil deformation')],default='PHYSICAL',update=bokeh_changed)
 swirl:FloatProperty(default=0,min=-1,max=1,update=changed)
 squeeze:FloatProperty(default=1,min=.25,max=4,update=changed)
 cat_eye:FloatProperty(default=0,min=0,max=1,update=changed)
 crop_bokeh:FloatProperty(default=0,min=0,max=1,update=changed)
 astigmatism:FloatProperty(default=0,min=-2,max=2,update=changed)
 coma:FloatProperty(default=0,min=0,max=2,update=changed)
 edge_brightness:FloatProperty(default=0,min=0,max=3,update=changed)
 vignette:FloatProperty(default=0,min=0,max=1,update=changed)
 filters:CollectionProperty(type=BruxosFilter)
 filter_add_kind:EnumProperty(items=FILTER_ITEMS,default='black_mist')
 character_look:EnumProperty(items=CHARACTER_ITEMS,default='clean')
 focus_preservation:FloatProperty(name='Preservar detalhe no foco',default=0,min=0,max=1,update=changed)
 bokeh_texture_rings:FloatProperty(name='Textura do bokeh · anéis',default=0,min=0,max=1,update=changed)
 bokeh_texture_grain:FloatProperty(name='Textura do bokeh · granulado',default=0,min=0,max=1,update=changed)
 bokeh_texture_scale:FloatProperty(name='Frequência da textura',default=6,min=0.5,max=12,update=changed)
 bokeh_texture_rotation:FloatProperty(name='Rotação da textura · graus',default=0,min=0,max=360,update=changed)

 focus_target:PointerProperty(type=bpy.types.Object,update=changed)
 track_focus:BoolProperty(default=False,update=changed)
 focus_m:FloatProperty(default=2,min=.3,max=1000,update=changed)
 iris:FloatProperty(default=6,min=.01,max=80,update=changed)
 blades:IntProperty(default=7,min=0,max=32,update=changed)
 rotation:FloatProperty(default=0,min=0,max=360,update=changed)
 dispersion:FloatProperty(default=0,min=0,max=1,update=changed)
 spectral_bokeh:BoolProperty(default=True,description="12 wavelength bands; approximate RGB response",update=changed)
 coating_strength:FloatProperty(default=0,min=0,max=1,update=changed)
 coating_nm:FloatProperty(default=550,min=400,max=700,update=changed)
 lens_flare:BoolProperty(default=False,description="Two interface reflections; increases sampling noise",update=changed)
 flare_gain:FloatProperty(default=1,min=0,max=40,update=changed)
 starburst_gain:FloatProperty(name='Starburst · intensidade',default=0,min=0,max=20,update=changed)
 starburst_size:FloatProperty(name='Starburst · tamanho',default=1,min=.1,max=6,update=changed)
 starburst_streaks:FloatProperty(name='Raios finos · borda das lâminas',default=.35,min=0,max=1,update=changed)
 lens_dirt_amount:FloatProperty(name='Lens Dirt · intensidade',default=0,min=0,max=1,update=changed)
 lens_dirt_seed:IntProperty(name='Variação',default=1,min=1,max=1000,update=changed)
 lens_dirt_fingerprints:FloatProperty(name='Marcas de dedo',default=.7,min=0,max=2,update=changed)
 lens_dirt_dust:FloatProperty(name='Poeira',default=.6,min=0,max=2,update=changed)
 lens_dirt_scratches:FloatProperty(name='Riscos',default=.35,min=0,max=2,update=changed)
 lens_dirt_fungus:FloatProperty(name='Fungos',default=0,min=0,max=2,update=changed)
 lens_dirt_defocus:FloatProperty(name='Desfoque da sujeira',default=.35,min=0,max=4,update=changed)
 lens_dirt_threshold:FloatProperty(name='Limiar das altas luzes',default=.8,min=0,max=20,update=changed)
 exposure:FloatProperty(default=0,min=-10,max=10,update=changed)
 sensor:FloatProperty(default=36,min=1,max=80,update=changed)
 auto_update:BoolProperty(default=True)
 status:StringProperty(default='')
 shader_signature:StringProperty(default='')
 runtime_signature:StringProperty(default='')
 mesh_signature:StringProperty(default='')
 mesh_sensor:FloatProperty(default=0)

def load_rows(p,raw):
 global _busy
 _busy=True
 try:
  items=raw if isinstance(raw,list) else sorted(raw.values(),key=lambda s:s['index'])
  parsed=[]
  for s in items:
   if s.get('shape','spherical') not in ('spherical','sphere',0,None) or any(float(s.get(k,0) or 0) != 0 for k in ('conic','a4','a6')):
    raise ValueError('Esta câmera suporta superfícies esféricas; a prescrição contém uma superfície não suportada.')
   parsed.append(dict(radius=float(s.get('radius',s.get('curvature_radius',0))),thickness=float(s['thickness']),diameter=float(s.get('diameter',s.get('aperture_diameter',20))),nd=float(s['nd']),abbe=float(s.get('abbe',s.get('vd',55))),stop=bool(s.get('stop',s.get('is_stop',False))),dx=float(s.get('dx',0)),dy=float(s.get('dy',0)),tx=float(s.get('tx',0)),ty=float(s.get('ty',0))))
  validate(parsed,p.iris)
  p.surfaces.clear()
  for s in parsed:
   row=p.surfaces.add()
   for k,v in s.items():setattr(row,k,v)
 finally:_busy=False

def sync_camera(scene,rebuild=False):
 p=scene.bruxos_lens;obj=p.camera
 from .focus_tools import update_target
 update_target(scene,p)
 sync_filters(scene)
 if not obj or obj.type!='CAMERA':raise ValueError('Selecione uma câmera.')
 if bpy.app.version<(4,5,0):raise ValueError('A câmera OSL requer Blender 4.5 ou superior.')
 if p.blades in (1,2):raise ValueError('Lâminas: use 0 ou 3–32.')
 rows=rows_from_props(p)
 iris,actual=effective_iris(p,rows);validate(rows,iris)
 p.actual_fstop=actual
 if not p.focal_mm:p.focal_mm=abs(paraxial(rows,1e6)[1])
 optical=[getattr(p,k) for k in ['focal_mm','fstop','aperture_mode','bokeh_type','swirl','squeeze','cat_eye','crop_bokeh','astigmatism','coma','edge_brightness','vignette']]
 input_signature=json.dumps([optical,rows,p.focus_m,p.focus_preservation,p.bokeh_texture_rings,p.bokeh_texture_grain,p.bokeh_texture_scale,p.bokeh_texture_rotation,p.iris,p.blades,p.rotation,p.dispersion,p.spectral_bokeh,p.exposure,p.coating_strength,p.coating_nm,p.lens_flare,p.flare_gain,p.sensor,p.preview_quality,scene.as_pointer() in _rendering,scene.unit_settings.scale_length,scene.cycles.device,scene.cycles.shading_system],sort_keys=True)
 if not rebuild and obj.data.get('bruxos_input_signature')==input_signature and obj.data.type=='CUSTOM' and obj.data.custom_shader and scene.render.engine=='CYCLES':return None
 rows_json=json.dumps(rows,sort_keys=True)
 sensor,efl=cached_focus(rows_json,p.focus_m,iris)
 original_engine=scene.render.engine
 if scene.render.engine!='CYCLES':scene.render.engine='CYCLES'
 if scene.cycles.device=='GPU':
  preferences=bpy.context.preferences.addons['cycles'].preferences
  if preferences.compute_device_type!='OPTIX':raise ValueError('Câmera OSL: use CPU ou OptiX, não CUDA/HIP/Metal.')
 cam=obj.data
 if 'bruxos_camera_backup' not in cam:
  if cam.type=='CUSTOM' and cam.custom_shader and not cam.custom_shader.name.startswith('Bruxos Lens OSL') :raise ValueError('Esta câmera customizada já pertence a outro shader.')
  cam['bruxos_camera_backup']=json.dumps(dict(type='PERSP' if cam.type=='CUSTOM' else cam.type,sensor_width=cam.sensor_width,sensor_fit=cam.sensor_fit,lens=cam.lens,clip_start=cam.clip_start,engine=original_engine,shading_system=scene.cycles.shading_system,device=scene.cycles.device,camera=scene.camera.name if scene.camera else '',owner_name=obj.name))
 # Custom camera OSL is independent of material shading. Preserve the user setting.
 # Enabling global OSL here turns every material/world into a limited OptiX OSL group.
 for key,value in dict(type='CUSTOM',sensor_width=p.sensor,sensor_fit='HORIZONTAL',lens=abs(efl),clip_start=.00001).items():
  if getattr(cam,key)!=value:setattr(cam,key,value)
 if scene.camera!=obj:scene.camera=obj
 source=cached_source(rows_json);signature=hashlib.sha256(source.encode('utf-8')).hexdigest()
 if signature!=p.shader_signature or not cam.custom_shader:
  name='Bruxos Lens OSL · '+cam.name
  text=bpy.data.texts.get(name) or bpy.data.texts.new(name)
  text.clear();text.write(source)
  cam.custom_mode='INTERNAL';cam.custom_shader=text
  from cycles.osl import update_custom_camera_shader
  reports=[]
  ok=update_custom_camera_shader(cam,lambda severity,msg:reports.append(msg))
  if not ok:raise ValueError('OSL: '+'; '.join(reports))
  p.shader_signature=signature
 params=cam.cycles_custom
 values=dict(sensor_z=sensor,iris_radius=iris,blades=0 if p.bokeh_type=='CIRCULAR' else max(3,p.blades) if p.bokeh_type=='POLYGON' else p.blades,iris_rotation=p.rotation,dispersion=p.dispersion,spectral_bokeh=int(p.spectral_bokeh),exposure=p.exposure,coating_strength=p.coating_strength,coating_nm=p.coating_nm,lens_flare=int(p.lens_flare and (p.preview_quality=='FULL' or scene.as_pointer() in _rendering)),flare_gain=p.flare_gain,focus_distance=p.focus_m,focus_preservation=p.focus_preservation,bokeh_texture_rings=p.bokeh_texture_rings,bokeh_texture_grain=p.bokeh_texture_grain,bokeh_texture_scale=p.bokeh_texture_scale,bokeh_texture_rotation=p.bokeh_texture_rotation,texture_normalization=texture_mean(p.bokeh_texture_rings,p.bokeh_texture_grain,p.bokeh_texture_scale,p.bokeh_texture_rotation),swirl=p.swirl,squeeze=p.squeeze,cat_eye=p.cat_eye,crop_bokeh=p.crop_bokeh,astigmatism=p.astigmatism,coma=p.coma,edge_brightness=p.edge_brightness,vignette=p.vignette,mm_to_scene=.001/(scene.unit_settings.scale_length or 1))
 runtime=json.dumps([signature,values,p.sensor],sort_keys=True)
 if runtime!=p.runtime_signature:
  for k,v in values.items():
   if params.get(k)!=v:params[k]=v
  cam.update_tag();p.runtime_signature=runtime
 mesh_key=json.dumps([rows,scene.unit_settings.scale_length],sort_keys=True)
 if rebuild and p.inspection_meshes and mesh_key!=p.mesh_signature:
  build_meshes(scene,rows,sensor);p.mesh_signature=mesh_key;p.mesh_sensor=sensor
 elif rebuild and p.inspection_meshes and p.mesh_sensor!=sensor:
  delta=(p.mesh_sensor-sensor)*.001/(scene.unit_settings.scale_length or 1)
  for ob in bpy.data.objects:
   if ob.get('bruxos_generated')==obj.name:ob.location.z+=delta
  p.mesh_sensor=sensor
 cam['bruxos_input_signature']=input_signature
 p.status=f'OSL · {efl:.1f} mm · f/{actual:.2f} · {len(rows)} surfaces' + (' · abertura limitada pela prescrição' if p.aperture_mode=='FSTOP' and abs(actual-p.fstop)>.01 else '')
 return sensor,efl

def surface_point(s,z,r,t):
 q=Vector((r*math.cos(t),r*math.sin(t),sag(s['radius'],r)))
 q=Matrix.Rotation(math.radians(s['ty']),4,'Y')@Matrix.Rotation(math.radians(s['tx']),4,'X')@q
 return q+Vector((s['dx'],s['dy'],z))

def build_meshes(scene,rows,sensor):
 p=scene.bruxos_lens;camera=p.camera;name='Bruxos Glass · '+camera.name
 coll=bpy.data.collections.get(name)
 if coll is None:
  coll=bpy.data.collections.new(name);scene.collection.children.link(coll)
 for obj in list(coll.objects):
  if obj.get('bruxos_generated')==camera.name:
   mesh=obj.data;bpy.data.objects.remove(obj,do_unlink=True)
   if mesh.users==0:bpy.data.meshes.remove(mesh)
 unit=.001/(scene.unit_settings.scale_length or 1);zs=vertices(rows);segs,rings=64,12
 for i,s in enumerate(rows[:-1]):
  if s['nd']<=1.00001 or s['thickness']<=0:continue
  back=rows[i+1];radius=min(s['diameter'],back['diameter'])/2
  verts=[];faces=[]
  for side,(row,z) in enumerate([(s,zs[i]),(back,zs[i+1])]):
   for j in range(rings+1):
    r=max(1e-6,radius*j/rings)
    for k in range(segs):
     q=surface_point(row,z,r,k*2*math.pi/segs);verts.append((q.x*unit,q.y*unit,(q.z-sensor)*unit))
  side_size=(rings+1)*segs
  for side in range(2):
   off=side*side_size
   for j in range(rings):
    for k in range(segs):
     a=off+j*segs+k;b=off+j*segs+(k+1)%segs;c=b+segs;d=a+segs;faces.append((a,b,c,d))
   faces.append(tuple(off+k for k in range(segs)))
  for k in range(segs):
   a=rings*segs+k;b=rings*segs+(k+1)%segs;faces.append((a,b,b+side_size,a+side_size))
  mesh=bpy.data.meshes.new(f'Glass {i+1}');mesh.from_pydata(verts,[],faces);mesh.update()
  import bmesh
  bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
  obj=bpy.data.objects.new(f'Bruxos Glass {i+1} · IOR {s["nd"]}',mesh);coll.objects.link(obj);obj.parent=camera;obj.hide_render=True;obj['bruxos_generated']=camera.name
  obj['optical_surface']=i;obj['ior_d']=s['nd'];obj['abbe_vd']=s['abbe']
  for face in mesh.polygons:face.use_smooth=True
  matname=f'Bruxos Glass · {s["nd"]:.5f}';mat=bpy.data.materials.get(matname) or bpy.data.materials.new(matname);mat.use_nodes=True
  mat.node_tree.nodes.clear();out=mat.node_tree.nodes.new('ShaderNodeOutputMaterial');glass=mat.node_tree.nodes.new('ShaderNodeBsdfGlass');glass.inputs['IOR'].default_value=s['nd'];glass.inputs['Roughness'].default_value=0;mat.node_tree.links.new(glass.outputs[0],out.inputs['Surface']);mesh.materials.append(mat)


def restore_camera(scene):
 restore_filters(scene)
 p=scene.bruxos_lens;obj=p.camera
 if not obj or 'bruxos_camera_backup' not in obj.data:raise ValueError('Sem câmera gerenciada para restaurar.')
 cam=obj.data;backup=json.loads(cam['bruxos_camera_backup']);p.auto_update=False
 text=cam.custom_shader
 # Only detach a shader created by this addon.
 if text and not text.name.startswith('Bruxos Lens OSL'):raise ValueError('Shader substituído por outro usuário; restauração cancelada.')
 cam.custom_shader=None
 cam.custom_bytecode=''
 for key in ('type','sensor_width','sensor_fit','lens','clip_start'):setattr(cam,key,backup[key])
 scene.cycles.shading_system=backup['shading_system'];scene.cycles.device=backup['device'];scene.render.engine=backup['engine']
 previous=bpy.data.objects.get(backup['camera'])
 if previous and previous.type=='CAMERA':scene.camera=previous
 for ob in list(bpy.data.objects):
  if ob.get('bruxos_generated') in (obj.name,backup['owner_name']):
   mesh=ob.data;bpy.data.objects.remove(ob,do_unlink=True)
   if mesh and mesh.users==0:bpy.data.meshes.remove(mesh)
 if text and text.users==0:bpy.data.texts.remove(text)
 for key in ('bruxos_camera_backup','bruxos_input_signature'):
  if key in cam:del cam[key]
 p.shader_signature='';p.runtime_signature='';p.mesh_signature='';cam.update_tag();p.status='Câmera original restaurada; atualização automática desligada.'

class BRUXOS_OT_restore(bpy.types.Operator):
 bl_idname='bruxos.restore_camera';bl_label='Restore original camera';bl_options={'REGISTER','UNDO'}
 def execute(self,context):
  try:restore_camera(context.scene);return {'FINISHED'}
  except Exception as exc:self.report({'ERROR'},str(exc));return {'CANCELLED'}

def material_osl_users(scene):
 # Scan nested graphs conservatively, including disabled/unconnected script nodes.
 # Refuse the convenience switch rather than silently changing authored OSL materials.
 def contains_script(tree,seen):
  if not tree or tree.as_pointer() in seen:return False
  seen.add(tree.as_pointer())
  return any(n.bl_idname=='ShaderNodeScript' or (n.type=='GROUP' and contains_script(n.node_tree,seen)) for n in tree.nodes)
 owners=[m for m in bpy.data.materials if m.users]+([scene.world] if scene.world else [])
 return [owner.name for owner in owners if contains_script(owner.node_tree,set())]

class BRUXOS_OT_native_materials(bpy.types.Operator):
 bl_idname='bruxos.use_native_materials';bl_label='Use native materials';bl_options={'REGISTER','UNDO'}
 def execute(self,context):
  scene=context.scene;p=scene.bruxos_lens
  if not p.camera or p.camera.data.type!='CUSTOM' or not p.camera.data.custom_shader or not p.camera.data.custom_shader.name.startswith('Bruxos Lens OSL'):
   self.report({'ERROR'},'Ative primeiro a câmera óptica do addon.');return {'CANCELLED'}
  owners=material_osl_users(scene)
  if owners:
   self.report({'ERROR'},'Materiais/ambiente com Script OSL: '+', '.join(owners)+'. Use CPU ou revise esses shaders antes de desligar OSL nos materiais.');return {'CANCELLED'}
  scene.cycles.shading_system=False
  p.status='Câmera óptica OSL mantida; materiais e ambiente usam Cycles nativo. Se a sessão já falhou, reinicie o Blender.'
  return {'FINISHED'}

class BRUXOS_OT_cpu(bpy.types.Operator):
 bl_idname='bruxos.use_cpu';bl_label='Use optical lens on CPU';bl_options={'REGISTER','UNDO'}
 def execute(self,context):
  previous=context.scene.cycles.device
  try:context.scene.cycles.device='CPU';sync_camera(context.scene,False);return {'FINISHED'}
  except Exception as exc:context.scene.cycles.device=previous;self.report({'ERROR'},str(exc));return {'CANCELLED'}

class BRUXOS_OT_create(bpy.types.Operator):
 bl_idname='bruxos.create_lens';bl_label='Create physical lens';bl_options={'REGISTER','UNDO'}
 def execute(self,context):
  try:
   p=context.scene.bruxos_lens
   if not p.camera:
    if context.scene.camera:p.camera=context.scene.camera
    else:
     camera=bpy.data.objects.new('Bruxos Physical Camera',bpy.data.cameras.new('Bruxos Lens'));context.scene.collection.objects.link(camera);p.camera=camera
   if not p.surfaces:apply_preset(p)
   sync_camera(context.scene,True);return {'FINISHED'}
  except Exception as exc:self.report({'ERROR'},str(exc));return {'CANCELLED'}

class BRUXOS_OT_apply(bpy.types.Operator):
 bl_idname='bruxos.apply_lens';bl_label='Apply lens changes';bl_options={'REGISTER','UNDO'}
 def execute(self,context):
  try:sync_camera(context.scene,True);return {'FINISHED'}
  except Exception as exc:self.report({'ERROR'},str(exc));return {'CANCELLED'}

class BRUXOS_OT_import(bpy.types.Operator):
 bl_idname='bruxos.import_prescription';bl_label='Import prescription JSON';bl_options={'REGISTER','UNDO'}
 filepath:StringProperty(subtype='FILE_PATH')
 filter_glob:StringProperty(default='*.json',options={'HIDDEN'})
 def invoke(self,context,event):context.window_manager.fileselect_add(self);return {'RUNNING_MODAL'}
 def execute(self,context):
  try:
   p=context.scene.bruxos_lens;load_rows(p,json.loads(Path(self.filepath).read_text(encoding='utf-8')));p.focal_mm=0;p.active_preset=Path(self.filepath).stem;sync_camera(context.scene,True);return {'FINISHED'}
  except Exception as exc:self.report({'ERROR'},str(exc));return {'CANCELLED'}

class BRUXOS_OT_check(bpy.types.Operator):
 bl_idname='bruxos.check_splats';bl_label='Check splat compatibility'
 def execute(self,context):
  obj=context.object
  msg='Câmera óptica: Cycles CPU/OptiX. Splats rasterizados por KIRI/Splatviz não recebem raios OSL. Use splats nativos Cycles (Blender 5.3+) ou o proxy volumétrico.'
  if obj:msg+=' Objeto: '+obj.type+'.'
  context.scene.bruxos_lens.status=msg;self.report({'INFO'},msg);return {'FINISHED'}


def apply_preset(p):
 global _busy
 data=PRESETS[p.preset]
 previous=_busy;_busy=True
 try:
  p.iris=data['iris'];p.focal_mm=0;p.blades=data['blades'];p.coating_strength=data['coating']
  load_rows(p,data['rows']);p.active_preset=data['name'];p.focal_mm=abs(data['focal_mm']);mag,_=aperture_info(data['rows']);p.fstop=abs(data['focal_mm'])*mag/(2*p.iris);p.aperture_mode='FSTOP'
 finally:_busy=previous

class BRUXOS_OT_preset(bpy.types.Operator):
 bl_idname='bruxos.apply_preset';bl_label='Apply preset';bl_options={'REGISTER','UNDO'}
 def execute(self,context):
  try:
   apply_preset(context.scene.bruxos_lens)
   return bpy.ops.bruxos.create_lens()
  except Exception as exc:self.report({'ERROR'},str(exc));return {'CANCELLED'}

class BRUXOS_OT_meshes(bpy.types.Operator):
 bl_idname='bruxos.build_meshes';bl_label='Build inspection meshes';bl_options={'REGISTER','UNDO'}
 def execute(self,context):
  try:
   context.scene.bruxos_lens.inspection_meshes=True;sync_camera(context.scene,True);return {'FINISHED'}
  except Exception as exc:self.report({'ERROR'},str(exc));return {'CANCELLED'}

@persistent
def render_begin(scene,*args):
 if not hasattr(scene,'bruxos_lens') or not scene.bruxos_lens.shader_signature:return
 _rendering.add(scene.as_pointer())
 try:sync_camera(scene,False)
 except Exception as exc:scene.bruxos_lens.status=str(exc)

@persistent
def render_end(scene,*args):
 _rendering.discard(scene.as_pointer())
 if hasattr(scene,'bruxos_lens') and scene.bruxos_lens.shader_signature:
  try:sync_camera(scene,False)
  except Exception as exc:scene.bruxos_lens.status=str(exc)


class BRUXOS_OT_focal(bpy.types.Operator):
 bl_idname='bruxos.set_focal';bl_label='Set focal length';bl_options={'REGISTER','UNDO'}
 mm:FloatProperty(default=50)
 def execute(self,context):
  try:
   if not context.scene.bruxos_lens.surfaces:
    if bpy.ops.bruxos.create_lens()!={'FINISHED'}:return {'CANCELLED'}
   context.scene.bruxos_lens.focal_mm=self.mm;sync_camera(context.scene,False);return {'FINISHED'}
  except Exception as exc:self.report({'ERROR'},str(exc));return {'CANCELLED'}

class BRUXOS_OT_filter(bpy.types.Operator):
 bl_idname='bruxos.edit_filter';bl_label='Edit filter stack';bl_options={'REGISTER','UNDO'}
 action:EnumProperty(items=[('ADD','Add',''),('REMOVE','Remove',''),('RESET','Reset transform',''),('UP','Move up',''),('DOWN','Move down','')],default='ADD')
 index:IntProperty(default=0)
 def execute(self,context):
  global _busy
  p=context.scene.bruxos_lens
  try:
   _busy=True
   if self.action=='ADD':
    if len(p.filters)>=16:raise ValueError('Use no máximo 16 filtros.')
    f=p.filters.add();f.kind=p.filter_add_kind
    if f.kind=='replicate':f.shift=.12
    if f.kind=='prism':f.shift=.015
   elif not 0<=self.index<len(p.filters):raise ValueError('Filtro não encontrado.')
   elif self.action=='REMOVE':p.filters.remove(self.index)
   elif self.action in ('UP','DOWN'):p.filters.move(self.index,max(0,min(len(p.filters)-1,self.index+(-1 if self.action=='UP' else 1))))
   else:
    f=p.filters[self.index];f.x=f.y=.5;f.scale=1;f.rotation=0
   sync_filters(context.scene);return {'FINISHED'}
  except Exception as exc:self.report({'ERROR'},str(exc));return {'CANCELLED'}
  finally:_busy=False

class BRUXOS_PT_filters(bpy.types.Panel):
 bl_label='Filtros de imagem · compositor';bl_idname='BRUXOS_PT_filters';bl_parent_id='BRUXOS_PT_lens';bl_space_type='VIEW_3D';bl_region_type='UI';bl_category='Bruxos'
 def draw(self,context):
  l=self.layout;p=context.scene.bruxos_lens;l.prop(p,'filter_add_kind',text='Filtro');op=l.operator('bruxos.edit_filter',text='Adicionar filtro',icon='ADD');op.action='ADD'
  l.label(text='Aproximações nativas · render/compositor',icon='INFO')
  for i,f in enumerate(p.filters):
   box=l.box();row=box.row(align=True);row.prop(f,'enabled',text='');row.prop(f,'kind',text='');op=row.operator('bruxos.edit_filter',text='',icon='X');op.action='REMOVE';op.index=i
   order=box.row(align=True)
   for action,icon in [('UP','TRIA_UP'),('DOWN','TRIA_DOWN')]:op=order.operator('bruxos.edit_filter',text='',icon=icon);op.action=action;op.index=i
   box.prop(f,'amount',text='Intensidade');box.prop(f,'show_controls',text='Transformação e ajustes',icon='PREFERENCES')
   if f.show_controls:
    if not f.region and f.kind not in ('veil','split','window','halo','kaleidoscope'):box.label(text='Global · posição sem efeito',icon='INFO')
    row=box.row(align=True);row.prop(f,'x',text='X');row.prop(f,'y',text='Y');box.prop(f,'scale',text='Escala');box.prop(f,'rotation',text='Rotação °');box.prop(f,'region',text='Região de aplicação')
    if f.kind=='prism':box.prop(f,'prism_type');box.prop(f,'edge_blur')
    if f.kind in ('black_mist','halation','streak','star'):box.prop(f,'threshold')
    box.prop(f,'radius',text='Alcance / blur');box.prop(f,'shift',text='Deslocamento');box.prop(f,'count',text='Contagem');box.prop(f,'feather',text='Suavidade da região')
    op=box.operator('bruxos.edit_filter',text='Reset transformação');op.action='RESET';op.index=i

class BRUXOS_OT_character(bpy.types.Operator):
 bl_idname='bruxos.apply_character';bl_label='Aplicar caráter';bl_options={'REGISTER','UNDO'}
 reset:BoolProperty(default=False)
 def execute(self,context):
  global _busy
  p=context.scene.bruxos_lens;look=next(v for v in CHARACTER_LOOKS if v['id']==('clean' if self.reset else p.character_look))
  _busy=True
  try:
   for key,value in look['blender'].items():setattr(p,key,value)
   if self.reset:p.character_look='clean'
  finally:_busy=False
  try:sync_camera(context.scene,False)
  except Exception as exc:self.report({'ERROR'},str(exc));return {'CANCELLED'}
  return {'FINISHED'}

class BRUXOS_PT_panel(bpy.types.Panel):
 bl_label='Bruxos Physical Lens';bl_idname='BRUXOS_PT_lens';bl_space_type='VIEW_3D';bl_region_type='UI';bl_category='Bruxos'
 def draw(self,context):
  l=self.layout;p=context.scene.bruxos_lens
  l.use_property_split=True
  l.prop(p,'language',text=tr('Language',p));l.prop(p,'camera',text=tr('Camera',p))
  l.prop(p,'preset',text=tr('Lens preset',p));l.operator('bruxos.apply_preset',text=tr('Apply preset',p),icon='CAMERA_DATA')
  l.label(text=tr('Approximate optical profiles',p),icon='INFO')
  if not p.shader_signature:l.operator('bruxos.create_lens',text=tr('Create lens',p))
  if p.surfaces:l.prop(p,'focal_mm',text='Distância focal · mm')
  row=l.row(align=True)
  for mm in [24,35,50,85]:op=row.operator('bruxos.set_focal',text=f'{mm} mm');op.mm=mm
  row=l.row();row.enabled=not (p.track_focus and p.focus_target);row.prop(p,'focus_m',text=tr('Focus · m',p));l.prop(p,'focus_target',text='Alvo de foco');l.prop(p,'track_focus',text='Acompanhar alvo');row=l.row(align=True);row.operator('bruxos.pick_focus_surface',text='Escolher ponto',icon='EYEDROPPER');row.operator('bruxos.clear_focus_target',text='Liberar',icon='X');l.prop(p,'aperture_mode',text='Diafragma')
  if p.aperture_mode=='FSTOP':l.prop(p,'fstop',text='Abertura · f-stop')
  else:l.prop(p,'iris',text=tr('Iris radius · mm',p))
  if p.shader_signature:l.label(text=f'Abertura efetiva: f/{p.actual_fstop:.2f}')
  l.prop(p,'focus_preservation');l.label(text='0 = resposta óptica original',icon='INFO')
  l.prop(p,'exposure',text=tr('Exposure',p))
  l.prop(p,'preview_quality',text=tr('Preview',p));l.prop(p,'auto_update',text=tr('Automatic update',p))
  l.operator('bruxos.apply_lens',text=tr('Apply changes',p),icon='FILE_REFRESH')
  if p.lens_flare and p.preview_quality=='FAST':l.label(text=tr('Flare on final render only',p),icon='INFO')

class BRUXOS_PT_bokeh(bpy.types.Panel):
 bl_label='Bokeh';bl_idname='BRUXOS_PT_bokeh';bl_parent_id='BRUXOS_PT_lens';bl_space_type='VIEW_3D';bl_region_type='UI';bl_category='Bruxos'
 def draw(self,context):
  l=self.layout;p=context.scene.bruxos_lens
  l.prop(p,'character_look',text='Preset de caráter')
  row=l.row(align=True);row.operator('bruxos.apply_character',text='Aplicar caráter');row.operator('bruxos.apply_character',text='Reset do caráter').reset=True
  l.prop(p,'bokeh_type',text='Tipo de desfoque')
  for key in ['bokeh_texture_rings', 'bokeh_texture_grain', 'bokeh_texture_scale', 'bokeh_texture_rotation']:l.prop(p,key)
  for key,title in [('swirl','Swirl'),('squeeze','Anamórfico / squeeze'),('cat_eye',"Cat’s eye"),('crop_bokeh','Bokeh recortado'),('astigmatism','Astigmatismo artístico'),('coma','Coma artístico')]:l.prop(p,key,text=title)
  for k,title in [('blades','Blades'),('rotation','Rotation'),('dispersion','Dispersion'),('spectral_bokeh','Spectral bokeh')]:l.prop(p,k,text=tr(title,p))

class BRUXOS_PT_flare(bpy.types.Panel):
 bl_label='Lens Flare / Coating';bl_idname='BRUXOS_PT_flare';bl_parent_id='BRUXOS_PT_lens';bl_space_type='VIEW_3D';bl_region_type='UI';bl_category='Bruxos';bl_options={'DEFAULT_CLOSED'}
 def draw(self,context):
  l=self.layout;p=context.scene.bruxos_lens;l.prop(p,'lens_flare',text=tr('Lens flare',p));col=l.column();col.enabled=p.lens_flare;col.prop(p,'flare_gain',text=tr('Flare gain',p))
  l.prop(p,'coating_strength',text=tr('Coating strength',p));l.prop(p,'coating_nm',text=tr('Coating wavelength · nm',p))
  box=l.box();box.label(text='Starburst · difração da íris',icon='LIGHT_SUN')
  for k in ('starburst_gain','starburst_size','starburst_streaks'):box.prop(p,k)
  box.label(text='Lâminas pares: N raios · ímpares: 2N · fechar a íris aumenta',icon='INFO')

class BRUXOS_PT_dirt(bpy.types.Panel):
 bl_label='Lens Dirt · sujeira na lente';bl_idname='BRUXOS_PT_dirt';bl_parent_id='BRUXOS_PT_lens';bl_space_type='VIEW_3D';bl_region_type='UI';bl_category='Bruxos';bl_options={'DEFAULT_CLOSED'}
 def draw(self,context):
  l=self.layout;p=context.scene.bruxos_lens
  for k in ('lens_dirt_amount','lens_dirt_seed','lens_dirt_fingerprints','lens_dirt_dust','lens_dirt_scratches','lens_dirt_fungus','lens_dirt_defocus','lens_dirt_threshold'):l.prop(p,k)
  l.label(text='Textura real procedural · reage às altas luzes',icon='INFO')

class BRUXOS_PT_technical(bpy.types.Panel):
 bl_label='Avançado';bl_idname='BRUXOS_PT_technical';bl_parent_id='BRUXOS_PT_lens';bl_space_type='VIEW_3D';bl_region_type='UI';bl_category='Bruxos';bl_options={'DEFAULT_CLOSED'}
 def draw(self,context):
  l=self.layout;p=context.scene.bruxos_lens;l.prop(p,'sensor',text=tr('Sensor · mm',p));l.prop(p,'edge_brightness',text='Clarear laterais · EV artístico');l.prop(p,'vignette',text='Vinheta criativa')
  l.operator('bruxos.build_meshes',text=tr('Build glass meshes',p))
  l.operator('bruxos.import_prescription',text=tr('Import prescription JSON',p))
  l.prop(context.scene.cycles,'shading_system',text=tr('Material OSL',p));l.operator('bruxos.use_native_materials',text=tr('Use native materials',p))
  l.operator('bruxos.use_cpu',text=tr('Use optical lens on CPU',p));l.operator('bruxos.restore_camera',text=tr('Restore original camera',p))
  for part in [p.status[j:j+44] for j in range(0,len(p.status),44)]:l.label(text=part)

class BRUXOS_PT_surfaces(bpy.types.Panel):
 bl_label='Superfícies · prescrição';bl_idname='BRUXOS_PT_surfaces';bl_parent_id='BRUXOS_PT_technical';bl_space_type='VIEW_3D';bl_region_type='UI';bl_category='Bruxos';bl_options={'DEFAULT_CLOSED'}
 def draw(self,context):
  l=self.layout;p=context.scene.bruxos_lens
  for i,s in enumerate(p.surfaces):
   box=l.box();box.label(text=f'{i+1}');row=box.row(align=True)
   row.prop(s,'radius',text='R');row.prop(s,'thickness',text='d');row.prop(s,'diameter',text='Ø')
   row=box.row(align=True);row.prop(s,'nd',text='IOR');row.prop(s,'abbe',text='Vd');row.prop(s,'stop',text='Stop')
   row=box.row(align=True);row.prop(s,'dx',text='X mm');row.prop(s,'dy',text='Y mm');row=box.row(align=True);row.prop(s,'tx',text='Tilt X');row.prop(s,'ty',text='Tilt Y')

class BRUXOS_PT_splats(bpy.types.Panel):
 bl_label='Gaussian Splats';bl_idname='BRUXOS_PT_splats';bl_parent_id='BRUXOS_PT_technical';bl_space_type='VIEW_3D';bl_region_type='UI';bl_category='Bruxos';bl_options={'DEFAULT_CLOSED'}
 def draw(self,context):
  l=self.layout;p=context.scene.bruxos_lens
  if native_splats_available():l.operator('bruxos.import_native_gaussians',text=tr('Import native Gaussian Splats',p))
  l.operator('bruxos.import_gaussians',text=tr('Import PLY · volume proxy',p));l.operator('bruxos.check_splats',text=tr('Splat compatibility',p))

@persistent
def frame_sync(scene,*args):
 if hasattr(scene,'bruxos_lens') and scene.bruxos_lens.camera and scene.bruxos_lens.shader_signature:
  try:sync_camera(scene,False)
  except Exception as exc:scene.bruxos_lens.status=str(exc)

from .gaussians import BRUXOS_OT_gaussians,BRUXOS_OT_native,native_splats_available
from .focus_tools import CLASSES as FOCUS_CLASSES,focus_depsgraph
classes=FOCUS_CLASSES+[BRUXOS_OT_character,BruxosSurface,BruxosFilter,BruxosSettings,BRUXOS_OT_create,BRUXOS_OT_native_materials,BRUXOS_OT_cpu,BRUXOS_OT_restore,BRUXOS_OT_apply,BRUXOS_OT_import,BRUXOS_OT_check,BRUXOS_OT_gaussians,BRUXOS_OT_native,BRUXOS_OT_preset,BRUXOS_OT_meshes,BRUXOS_OT_focal,BRUXOS_OT_filter,BRUXOS_PT_panel,BRUXOS_PT_filters,BRUXOS_PT_bokeh,BRUXOS_PT_flare,BRUXOS_PT_dirt,BRUXOS_PT_technical,BRUXOS_PT_surfaces,BRUXOS_PT_splats]
def register():
 for cls in classes:bpy.utils.register_class(cls)
 bpy.types.Scene.bruxos_lens=PointerProperty(type=BruxosSettings)
 bpy.app.handlers.depsgraph_update_post.append(focus_depsgraph)
 bpy.app.handlers.frame_change_post.append(frame_sync)
 bpy.app.handlers.render_pre.append(render_begin)
 bpy.app.handlers.render_post.append(render_end)
 bpy.app.handlers.render_cancel.append(render_end)
def unregister():
 global _pending
 for callback in list(_timers):
  if bpy.app.timers.is_registered(callback):bpy.app.timers.unregister(callback)
 _timers.clear();_pending=False
 _rendering.clear();cached_focus.cache_clear();cached_source.cache_clear()
 for handlers,fn in [(bpy.app.handlers.render_pre,render_begin),(bpy.app.handlers.render_post,render_end),(bpy.app.handlers.render_cancel,render_end)]:
  if fn in handlers:handlers.remove(fn)
 for scene in bpy.data.scenes:
  if hasattr(scene,'bruxos_lens') and scene.bruxos_lens.camera and 'bruxos_camera_backup' in scene.bruxos_lens.camera.data:
   try:restore_camera(scene)
   except Exception as exc:print('Bruxos restore:',exc)
 if focus_depsgraph in bpy.app.handlers.depsgraph_update_post:bpy.app.handlers.depsgraph_update_post.remove(focus_depsgraph)
 if frame_sync in bpy.app.handlers.frame_change_post:bpy.app.handlers.frame_change_post.remove(frame_sync)
 for scene in bpy.data.scenes:restore_filters(scene)
 del bpy.types.Scene.bruxos_lens
 for cls in reversed(classes):bpy.utils.unregister_class(cls)
