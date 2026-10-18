"""Explicit 3DGS PLY -> finite Gaussian emission/absorption volumes for Cycles.

This is a ray-traceable proxy, not an exact 3DGS rasterizer or SH reconstruction.
"""
import struct,math,heapq
from pathlib import Path
import bpy
from bpy.props import StringProperty,IntProperty,FloatProperty

TYPES={'char':'b','uchar':'B','int8':'b','uint8':'B','short':'h','ushort':'H','int16':'h','uint16':'H','int':'i','uint':'I','int32':'i','uint32':'I','float':'f','float32':'f','double':'d','float64':'d'}
def sigmoid(v):return 1/(1+math.exp(-max(-80,min(80,v))))
def read_splats(path,limit):
 with open(path,'rb') as f:
  if f.readline().strip()!=b'ply':raise ValueError('Arquivo não é PLY.')
  fmt=None;count=None;fields=[];vertex=False;first_element=True;size=0
  while True:
   line=f.readline();size+=len(line)
   if not line or size>65536:raise ValueError('Cabeçalho PLY inválido.')
   words=line.decode('ascii').strip().split()
   if not words:continue
   if words[0]=='end_header':break
   if words[0]=='format':fmt=words[1]
   if words[0]=='element':
    vertex=words[1]=='vertex'
    if vertex:
     if not first_element:raise ValueError('PLY: vertex deve ser o primeiro elemento.')
     count=int(words[2])
    first_element=False
   if words[0]=='property' and vertex:
    if words[1]=='list' or words[1] not in TYPES:raise ValueError('PLY vertex com tipo de propriedade não suportado.')
    fields.append((words[2],words[1]))
  names=[n for n,t in fields]
  required={'x','y','z','scale_0','scale_1','scale_2','rot_0','rot_1','rot_2','rot_3','opacity','f_dc_0','f_dc_1','f_dc_2'}
  if not required.issubset(names):raise ValueError('Use PLY 3DGS com scale/rot/opacity/f_dc, não uma nuvem de pontos comum.')
  if count is None or not 0<count<=20000000:raise ValueError('Contagem PLY inválida.')
  unpack=struct.Struct(('<' if fmt=='binary_little_endian' else '>')+''.join(TYPES[t] for n,t in fields)) if fmt in ('binary_little_endian','binary_big_endian') else None
  if fmt!='ascii' and unpack is None:raise ValueError('Formato PLY desconhecido.')
  chosen=[]
  for i in range(count):
   if unpack:
    data=f.read(unpack.size)
    if len(data)!=unpack.size:raise ValueError('PLY truncado.')
    values=unpack.unpack(data)
   else:
    values=tuple(float(x) for x in f.readline().split())
    if len(values)!=len(fields):raise ValueError('Linha PLY inválida.')
   row=dict(zip(names,values))
   if not all(math.isfinite(row[n]) for n in required):raise ValueError('PLY contém NaN/infinito.')
   if not all(-20<row[f'scale_{j}']<10 for j in range(3)):raise ValueError('Escala de Gaussian inválida.')
   if sum(row[f'rot_{j}']**2 for j in range(4))<1e-18:raise ValueError('Quaternion Gaussian inválido.')
   alpha=sigmoid(row['opacity'])
   if alpha<.001:continue
   entry=(alpha,i,{k:row[k] for k in required})
   if len(chosen)<limit:heapq.heappush(chosen,entry)
   elif entry[:2]>chosen[0][:2]:heapq.heapreplace(chosen,entry)
 return [row for alpha,i,row in sorted(chosen,reverse=True)],count

def material(row,sigmas,index):
 mat=bpy.data.materials.new(f'Bruxos Gaussian volume {index}');mat.use_nodes=True;n=mat.node_tree.nodes;n.clear();links=mat.node_tree.links
 def math_node(op,a,b=None):
  node=n.new('ShaderNodeMath');node.operation=op
  if isinstance(a,(int,float)):node.inputs[0].default_value=a
  else:links.new(a,node.inputs[0])
  if b is not None:
   if isinstance(b,(int,float)):node.inputs[1].default_value=b
   else:links.new(b,node.inputs[1])
  return node.outputs[0]
 tex=n.new('ShaderNodeTexCoord');subtract=n.new('ShaderNodeVectorMath');subtract.operation='SUBTRACT';subtract.inputs[1].default_value=(.5,.5,.5);links.new(tex.outputs['Generated'],subtract.inputs[0])
 length=n.new('ShaderNodeVectorMath');length.operation='DOT_PRODUCT';links.new(subtract.outputs[0],length.inputs[0]);links.new(subtract.outputs[0],length.inputs[1])
 exponent=math_node('MULTIPLY',length.outputs['Value'],-18)
 gaussian=math_node('EXPONENT',exponent)
 alpha=sigmoid(row['opacity']);coeff=-math.log(max(1e-6,1-alpha))/(math.sqrt(2*math.pi)*min(sigmas)*math.erf(3/math.sqrt(2)))
 density=math_node('MULTIPLY',gaussian,coeff)
 absorption=n.new('ShaderNodeVolumeAbsorption');absorption.inputs['Color'].default_value=(0,0,0,1);links.new(density,absorption.inputs['Density'])
 emission=n.new('ShaderNodeEmission')
 srgb=[max(0,min(1,.5+.28209479177387814*row[f'f_dc_{i}'])) for i in range(3)]
 color=[v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in srgb]
 emission.inputs['Color'].default_value=(*color,1);links.new(density,emission.inputs['Strength'])
 add=n.new('ShaderNodeAddShader');links.new(absorption.outputs[0],add.inputs[0]);links.new(emission.outputs[0],add.inputs[1]);out=n.new('ShaderNodeOutputMaterial');links.new(add.outputs[0],out.inputs['Volume'])
 return mat

def import_volumes(context,path,limit=2000,scale=1):
 rows,total=read_splats(path,limit)
 coll=bpy.data.collections.new('Bruxos Gaussian proxies · '+Path(path).stem);context.scene.collection.children.link(coll)
 bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,radius=1)
 base=context.object;mesh=base.data;bpy.data.objects.remove(base,do_unlink=True)
 for i,row in enumerate(rows):
  # Separate mesh material slots; exact covariance rotation and scale remain per object.
  shape=mesh.copy();sigmas=[math.exp(row[f'scale_{j}'])*scale for j in range(3)]
  obj=bpy.data.objects.new(f'Gaussian {i+1}',shape);coll.objects.link(obj)
  obj.location=tuple(row[k]*scale for k in ['x','y','z']);obj.scale=tuple(3*s for s in sigmas)
  obj.rotation_mode='QUATERNION';q=[row[f'rot_{j}'] for j in range(4)];norm=math.sqrt(sum(v*v for v in q))
  if norm<1e-9:raise ValueError('Quaternion Gaussian inválido.')
  obj.rotation_quaternion=tuple(v/norm for v in q)
  shape.materials.append(material(row,sigmas,i));obj['bruxos_gaussian_proxy']=True
 if mesh.users==0:bpy.data.meshes.remove(mesh)
 context.scene.bruxos_lens.status=f'Gaussian volume proxies: {len(rows)}/{total}. SH DC only; not exact 3DGS.'
 return len(rows),total

class BRUXOS_OT_gaussians(bpy.types.Operator):
 bl_idname='bruxos.import_gaussians';bl_label='Import 3DGS PLY as Cycles volumes';bl_options={'REGISTER','UNDO'}
 filepath:StringProperty(subtype='FILE_PATH')
 filter_glob:StringProperty(default='*.ply',options={'HIDDEN'})
 max_splats:IntProperty(name='Maximum proxies',default=2000,min=1,max=20000)
 scale:FloatProperty(name='Scene scale',default=1,min=.000001,max=10000)
 def invoke(self,context,event):context.window_manager.fileselect_add(self);return {'RUNNING_MODAL'}
 def execute(self,context):
  try:import_volumes(context,self.filepath,self.max_splats,self.scale);return {'FINISHED'}
  except Exception as exc:self.report({'ERROR'},str(exc));return {'CANCELLED'}

def native_splats_available():
 prop=bpy.types.PointCloud.bl_rna.properties.get('type')
 return bool(prop and any(item.identifier=='GAUSSIAN_SPLAT' for item in prop.enum_items))

class BRUXOS_OT_native(bpy.types.Operator):
 bl_idname='bruxos.import_native_gaussians';bl_label='Import native Gaussian Splats';bl_options={'REGISTER','UNDO'}
 filepath:StringProperty(subtype='FILE_PATH')
 filter_glob:StringProperty(default='*.ply;*.spz',options={'HIDDEN'})
 def invoke(self,context,event):context.window_manager.fileselect_add(self);return {'RUNNING_MODAL'}
 def execute(self,context):
  try:
   if not native_splats_available():raise ValueError('Este Blender não possui Gaussian Splats nativos. Use Blender 5.3+ ou o proxy Cycles.')
   suffix=Path(self.filepath).suffix.lower()
   if suffix=='.ply':bpy.ops.wm.ply_import(filepath=self.filepath,forward_axis='Y',up_axis='Z')
   elif suffix=='.spz':bpy.ops.wm.spz_import(filepath=self.filepath)
   else:raise ValueError('Use PLY ou SPZ.')
   splats=[o for o in context.selected_objects if o.type=='POINTCLOUD' and o.data.type=='GAUSSIAN_SPLAT']
   if not splats:raise ValueError('Arquivo importado não contém Gaussian Splats nativos.')
   context.scene.bruxos_lens.status='Native Gaussian Splats · Cycles OSL. Experimental Blender 5.3 path.'
   return {'FINISHED'}
  except Exception as exc:self.report({'ERROR'},str(exc));return {'CANCELLED'}
