"""Native compositor approximations of image filters. Never edits authored nodes.

One owned group is inserted before each Composite output, keeping its input link.
The group is reconstructed only when the filter configuration changes.
"""
import bpy,math,json
KINDS=['black_mist','white_mist','detail','streak','star','veil','window','replicate','halo','kaleidoscope','split','fringing','halation','prism','directional']
LABELS=['Black Mist','White Mist','Detail','Streak','Star','Veil','Window','Replicate','Halo','Kaleidoscope','Split Diopter','Fringing','Halation','Prisma RGB','Blur direcional']
ITEMS=list(zip(KINDS,LABELS,['Native compositor image effect']*len(KINDS)))
KEYS=('kind','enabled','amount','x','y','scale','rotation','radius','shift','count','region','feather','prism_type','edge_blur','threshold')
PRISM_TYPES=[('0','Cromático · dispersão','RGB dispersion'),('1','Triangular','Three facets'),('2','Cunha','Wedge deflection'),('3','Facetado','Radial facets'),('4','Replicação linear','Linear copies'),('5','Caleidoscópio','Mirrored wedges'),('6','Split','Half-field prism'),('7','Anel radial','Radial ring')]
OPTICS=('starburst_gain','starburst_size','starburst_streaks','lens_dirt_amount','lens_dirt_seed','lens_dirt_fingerprints','lens_dirt_dust','lens_dirt_scratches','lens_dirt_fungus','lens_dirt_defocus','lens_dirt_threshold','blades','rotation','iris','actual_fstop','bokeh_type')
def config(p):return [{k:(int(getattr(f,k)) if k=='prism_type' else getattr(f,k)) for k in KEYS} for f in p.filters]
def optics_config(p):return {k:getattr(p,k) for k in OPTICS if hasattr(p,k)}
def _image(name,w,h,data):
 img=bpy.data.images.get(name)
 if img is None or tuple(img.size)!=(w,h):
  if img:bpy.data.images.remove(img)
  img=bpy.data.images.new(name,w,h,alpha=True,float_buffer=True)
 img.colorspace_settings.name='Non-Color';img.alpha_mode='CHANNEL_PACKED';img.pixels.foreach_set(data.astype('float32').ravel());img.update();img.pack();return img
def uv_image(w,h):
 """Pixel-centre UV image: lets Map UV do exact per-pixel remaps (kaleidoscope) without domain transforms."""
 import numpy as np
 w,h=max(1,int(w)),max(1,int(h));key=f'{w}x{h}';img=bpy.data.images.get('Bruxos UV')
 if img and img.get('bruxos_key')==key:return img
 y,x=np.mgrid[0:h,0:w];a=np.zeros((h,w,4),'f4');a[...,0]=(x+.5)/w;a[...,1]=(y+.5)/h;a[...,3]=1
 img=_image('Bruxos UV',w,h,a);img['bruxos_key']=key;return img
def dirt_image(seed,w,h):
 """Lens dirt texture (R fingerprints, G dust, B scratches, A fungus). The seed varies it by offset, quarter turns and mirror."""
 import os,numpy as np
 seed=int(seed);key=f'{seed}:{int(w)}x{int(h)}';img=bpy.data.images.get('Bruxos Lens Dirt')
 if img and img.get('bruxos_key')==key:return img
 src=bpy.data.images.load(os.path.join(os.path.dirname(__file__),'data','lens-dirt.png'),check_existing=False);src.colorspace_settings.name='Non-Color';src.alpha_mode='CHANNEL_PACKED'
 n,m=src.size[0],src.size[1];a=np.empty(n*m*4,'f4');src.pixels.foreach_get(a);bpy.data.images.remove(src);a=a.reshape(m,n,4)
 if seed>1:
  rng=np.random.default_rng(seed);a=np.roll(a,(int(rng.integers(n)),int(rng.integers(n))),(0,1));a=np.rot90(a,int(rng.integers(4)))
  if rng.integers(2):a=a[:,::-1]
 aspect=w/max(1,h)
 if aspect>=1:ch=max(1,int(round(n/aspect)));y0=(n-ch)//2;a=a[y0:y0+ch]
 else:cw=max(1,int(round(n*aspect)));x0=(n-cw)//2;a=a[:,x0:x0+cw]
 a=np.ascontiguousarray(a);img=_image('Bruxos Lens Dirt',a.shape[1],a.shape[0],a);img['bruxos_key']=key;return img

def scene_tree(scene,create=False):
 if hasattr(scene,'node_tree'):
  if create:scene.use_nodes=True
  return scene.node_tree
 tree=scene.compositing_node_group
 if tree is None and create:
  tree=bpy.data.node_groups.new('Bruxos Compositor','CompositorNodeTree');tree.interface.new_socket(name='Image',in_out='OUTPUT',socket_type='NodeSocketColor')
  output=tree.nodes.new('NodeGroupOutput');source=tree.nodes.new('CompositorNodeRLayers');tree.links.new(source.outputs['Image'],output.inputs[0]);scene.compositing_node_group=tree;scene['bruxos_compositor_created']=True
 return tree

def composite_outputs(tree):return [n for n in tree.nodes if n.type=='COMPOSITE' or (n.bl_idname=='NodeGroupOutput' and n.is_active_output)]

def restore(scene):
 tree=scene_tree(scene)
 if not tree:return
 for node in list(tree.nodes):
  if not node.get('bruxos_filter'):continue
  source=node.inputs[0].links[0].from_socket if node.inputs[0].links else None
  outputs=[link.to_socket for link in node.outputs[0].links]
  group=node.node_tree;tree.nodes.remove(node)
  if source:
   for socket in outputs:tree.links.new(source,socket)
  if group and group.users==0:bpy.data.node_groups.remove(group)
 if 'bruxos_compositor_use_nodes' in scene:
  scene.use_nodes=scene['bruxos_compositor_use_nodes'];del scene['bruxos_compositor_use_nodes']
 if scene.get('bruxos_compositor_created'):
  scene.compositing_node_group=None;del scene['bruxos_compositor_created']
  if tree.users==0:bpy.data.node_groups.remove(tree)

def sync(scene):
 p=scene.bruxos_lens;raw=config(p);active=[f for f in raw if f['enabled'] and f['amount']>0];extra=optics_config(p)
 star=extra.get('starburst_gain',0)>0;dirt=extra.get('lens_dirt_amount',0)>0
 tree=scene_tree(scene)
 owned=[n for n in tree.nodes if n.get('bruxos_filter')] if tree else []
 if not active and not star and not dirt:
  for n in owned:n.mute=True
  return
 signature=json.dumps([raw,extra,scene.render.resolution_x,scene.render.resolution_y,scene.render.resolution_percentage],sort_keys=True)
 if owned and all(n.get('configuration')==signature for n in owned):
  for n in owned:n.mute=False
  return
 if 'bruxos_compositor_use_nodes' not in scene:scene['bruxos_compositor_use_nodes']=scene.use_nodes
 tree=scene_tree(scene,True)
 group=bpy.data.node_groups.new('Bruxos Artistic Filters','CompositorNodeTree')
 group.interface.new_socket(name='Image',in_out='INPUT',socket_type='NodeSocketColor');group.interface.new_socket(name='Image',in_out='OUTPUT',socket_type='NodeSocketColor')
 nodes=group.nodes;links=group.links
 def node(kind):
  legacy='CompositorNode'+kind
  aliases={'Math':'ShaderNodeMath','MixRGB':'ShaderNodeMixRGB','SepRGBA':'CompositorNodeSeparateColor','CombRGBA':'CompositorNodeCombineColor'}
  return nodes.new(legacy if hasattr(bpy.types,legacy) else aliases[kind])
 def wire(n,source,slot=0):links.new(source,n.inputs[slot]);return n.outputs[0]
 def mix(a,b,factor,blend='MIX'):
  n=node('MixRGB');n.blend_type=blend
  if hasattr(factor,'node'):links.new(factor,n.inputs[0])
  else:n.inputs[0].default_value=factor
  links.new(a,n.inputs[1]);links.new(b,n.inputs[2]);return n.outputs[0]
 def multiply(a,b):
  n=node('Math');n.operation='MULTIPLY';links.new(a,n.inputs[0]);links.new(b,n.inputs[1]);return n.outputs[0]
 def invert(a):
  n=node('Math');n.operation='SUBTRACT';n.inputs[0].default_value=1;links.new(a,n.inputs[1]);return n.outputs[0]
 w=scene.render.resolution_x*scene.render.resolution_percentage/100;h=scene.render.resolution_y*scene.render.resolution_percentage/100
 def blur(a,r):
  n=node('Blur')
  if hasattr(n,'filter_type'):n.filter_type='GAUSS'
  else:n.inputs['Type'].default_value='Gaussian'
  px=max(1,int(r*min(w,h)));n.inputs['Size'].default_value=(px,px);return wire(n,a)
 def transform(a,f,dx=0,dy=0,angle=None):
  n=node('Transform');n.inputs['X'].default_value=dx*w;n.inputs['Y'].default_value=dy*h;n.inputs['Angle'].default_value=math.radians(f['rotation']) if angle is None else angle;return wire(n,a)
 def ellipse(f):
  n=node('EllipseMask');n.inputs['Position'].default_value=(f['x'],1-f['y']);n.inputs['Size'].default_value=(.55*f['scale'],.55*f['scale']*w/h);n.inputs['Rotation'].default_value=math.radians(f['rotation']);return blur(n.outputs[0],f['feather']*.04)
 def half(f):
  a=math.radians(f['rotation']);n=node('BoxMask');n.inputs['Position'].default_value=(f['x']+math.cos(a),1-f['y']+math.sin(a));n.inputs['Size'].default_value=(2,4);n.inputs['Rotation'].default_value=a;return blur(n.outputs[0],f['feather']*.06)
 def set_glare(n,kind):
  if hasattr(n,'glare_type'):n.glare_type=kind;n.quality='HIGH'
  else:n.inputs['Type'].default_value={'STREAKS':'Streaks','FOG_GLOW':'Fog Glow'}[kind];n.inputs['Quality'].default_value='High'
 def glare(a,f,kind,tint=None):
  n=node('Glare')
  if hasattr(n,'glare_type'):n.glare_type=kind;n.quality='MEDIUM'
  else:n.inputs['Type'].default_value='Fog Glow' if kind=='FOG_GLOW' else 'Streaks';n.inputs['Quality'].default_value='Medium'
  n.inputs['Threshold'].default_value=f.get('threshold',.7)
  if kind=='FOG_GLOW':n.inputs['Size'].default_value=min(1,f['radius']*8)
  if kind=='STREAKS':n.inputs['Streaks'].default_value=f['count'] if f['kind']=='star' else 1;n.inputs['Streaks Angle'].default_value=math.radians(f['rotation'])
  if tint:n.inputs['Tint'].default_value=(*tint,1)
  wire(n,a);return n.outputs['Glare']
 source=nodes.new('NodeGroupInput').outputs[0]
 def math_node(op,a,b=None,c=None):
  n=node('Math');n.operation=op
  for i,v in enumerate((a,b,c)):
   if v is None:continue
   if hasattr(v,'node'):links.new(v,n.inputs[i])
   else:n.inputs[i].default_value=v
  return n.outputs[0]
 fnum=max(.5,min(64,extra.get('actual_fstop',4) or 4))
 if star:
  # Iris diffraction (Fraunhofer): even blades -> N rays, odd -> 2N, round iris -> soft rings/glow.
  blades=0 if extra.get('bokeh_type')=='CIRCULAR' else int(extra.get('blades',0))
  rays=0 if blades<3 else (blades if blades%2==0 else 2*blades)
  size=extra.get('starburst_size',1);gain=extra['starburst_gain']*math.sqrt(max(.5,min(6,fnum/2.8)))
  n=node('Glare')
  if rays:
   set_glare(n,'STREAKS');n.inputs['Streaks'].default_value=max(2,min(16,rays));n.inputs['Streaks Angle'].default_value=math.radians(extra.get('rotation',0)+(90/blades if blades else 0))
   n.inputs['Fade'].default_value=min(.97,1-.2/(1+size));n.inputs['Iterations'].default_value=5;n.inputs['Color Modulation'].default_value=.3
  else:
   set_glare(n,'FOG_GLOW');n.inputs['Size'].default_value=min(1,.25+.15*size)
  n.inputs['Threshold'].default_value=1.0;n.inputs['Smoothness'].default_value=.2
  wire(n,source);glow=n.outputs['Glare']
  if rays and extra.get('starburst_streaks',.35)>0:
   # thin streaks from blade edges: a second, longer and fainter pass
   m=node('Glare');set_glare(m,'STREAKS');m.inputs['Threshold'].default_value=1.0;m.inputs['Streaks'].default_value=max(2,min(16,rays));m.inputs['Streaks Angle'].default_value=n.inputs['Streaks Angle'].default_value
   m.inputs['Fade'].default_value=min(.985,1-.1/(1+size));m.inputs['Iterations'].default_value=5;wire(m,source)
   glow=mix(glow,m.outputs['Glare'],min(1,extra['starburst_streaks']*.3),'ADD')
  k=gain*.08
  source=mix(source,glow,k,'ADD') if k<=1 else mix(source,mix(glow,glow,k-1,'ADD'),1,'ADD')
 if dirt:
  # Front-element dirt, lit by the scene highlights (scatter), defocused by the aperture.
  im=node('Image');im.image=dirt_image(extra.get('lens_dirt_seed',1),w,h)
  sc=node('Scale');sc.space='RENDER_SIZE';sc.frame_method='STRETCH';wire(sc,im.outputs['Image'])
  sep=node('SepRGBA');wire(sep,sc.outputs[0]);layer=None
  for ch,key in [(0,'lens_dirt_fingerprints'),(1,'lens_dirt_dust'),(2,'lens_dirt_scratches'),(3,'lens_dirt_fungus')]:
   wgt=extra.get(key,0)
   if wgt<=0:continue
   layer=math_node('MULTIPLY',sep.outputs[ch],wgt) if layer is None else math_node('MULTIPLY_ADD',sep.outputs[ch],wgt,layer)
  if layer is not None:
   defocus=extra.get('lens_dirt_defocus',.35)*max(.25,extra.get('iris',6))*.0035
   if defocus>0:layer=blur(layer,defocus)
   halo=node('Glare');set_glare(halo,'FOG_GLOW');halo.inputs['Threshold'].default_value=extra.get('lens_dirt_threshold',.8);halo.inputs['Size'].default_value=1;wire(halo,source)
   light=node('MixRGB');light.blend_type='MULTIPLY';light.inputs[0].default_value=1;links.new(halo.outputs['Glare'],light.inputs[1]);links.new(layer,light.inputs[2])
   amount=extra['lens_dirt_amount'];trans=math_node('SUBTRACT',1,math_node('MULTIPLY',layer,.12*amount))
   dark=node('MixRGB');dark.blend_type='MULTIPLY';dark.inputs[0].default_value=1;links.new(source,dark.inputs[1]);links.new(trans,dark.inputs[2])
   k=amount*4;lit=light.outputs[0] if k<=1 else mix(light.outputs[0],light.outputs[0],k-1,'ADD')
   source=mix(dark.outputs[0],lit,min(1,k),'ADD')
 for f in active:
  a=source;kind=f['kind'];radius=f['radius'];target=a;mask=None;ptype=f.get('prism_type',0) if kind=='prism' else 0
  if kind=='prism' and ptype:
   # prism types share the geometry of the matching optical effect, then add glass dispersion
   kind={1:'facets',2:'wedge',3:'facets',4:'replicate',5:'kaleidoscope',6:'split',7:'halo'}[ptype]
   f={**f,'count':3 if ptype==1 else f['count'],'feather':max(f['feather'],f.get('edge_blur',.06)*4)}
  if kind in ('black_mist','streak','star','halation'):
   glow=glare(a,f,'STREAKS' if kind in ('streak','star') else 'FOG_GLOW',(1,.2,.025) if kind=='halation' else None);target=mix(a,glow,1,'ADD')
  elif kind in ('white_mist','detail'):
   target=blur(a,radius*(.2 if kind=='detail' else 1))
   if kind=='white_mist':
    constant=node('RGB');constant.outputs[0].default_value=(.08,.08,.08,1);target=mix(target,constant.outputs[0],.25,'SCREEN')
  elif kind in ('directional','veil','split','window','halo'):
   if kind=='directional':
    n=node('DBlur');n.inputs['Samples'].default_value=16;n.inputs['Amount'].default_value=radius;n.inputs['Direction'].default_value=math.radians(f['rotation']);n.inputs['Center'].default_value=(f['x'],1-f['y']);target=wire(n,a)
   else:
    target=blur(a,radius)
    if kind in ('veil','split'):target=transform(target,f,f['shift']*f['scale'],0,0);mask=half(f)
    else:mask=invert(ellipse(f))
    if kind=='halo':
     n=node('DBlur');n.inputs['Center'].default_value=(f['x'],1-f['y']);n.inputs['Scale'].default_value=1+f['shift'];n.inputs['Samples'].default_value=16;target=wire(n,target)
  elif kind in ('prism','fringing'):
   sep=node('SepRGBA');wire(sep,a);combine=node('CombRGBA');angle=math.radians(f['rotation']);shift=f['shift']*f['scale']*(.1 if kind=='fringing' else 1)
   for i,sign in [(0,1),(1,0),(2,-1)]:links.new(transform(sep.outputs[i],f,sign*shift*math.cos(angle),sign*shift*math.sin(angle),0) if sign else sep.outputs[i],combine.inputs[i])
   links.new(sep.outputs[3],combine.inputs[3]);target=combine.outputs[0]
  elif kind=='replicate':
   copies=[transform(a,f,(i-(f['count']-1)/2)*f['shift']*f['scale']*math.cos(math.radians(f['rotation'])),(i-(f['count']-1)/2)*f['shift']*f['scale']*math.sin(math.radians(f['rotation'])),0) for i in range(f['count'])]
   target=copies[0]
   for i,b in enumerate(copies[1:],2):target=mix(target,b,1/i)
  elif kind=='kaleidoscope':
   # exact mirrored sectors (same mapping as the app): angle folded into one wedge, mirrored 6 px inside the frame.
   uvn=node('Image');uvn.image=uv_image(w,h);uvs=node('SepRGBA');wire(uvs,uvn.outputs['Image'])
   short=min(w,h);ux=w/short;uy=h/short;rot=math.radians(f['rotation']);c=math.cos(rot);sn=math.sin(rot);sector=2*math.pi/f['count']
   lx=math_node('MULTIPLY',math_node('SUBTRACT',uvs.outputs[0],f['x']),ux/f['scale']);ly=math_node('MULTIPLY',math_node('SUBTRACT',uvs.outputs[1],1-f['y']),uy/f['scale'])
   qx=math_node('MULTIPLY_ADD',lx,c,math_node('MULTIPLY',ly,sn));qy=math_node('MULTIPLY_ADD',ly,c,math_node('MULTIPLY',lx,-sn))
   r=math_node('SQRT',math_node('MULTIPLY_ADD',qx,qx,math_node('MULTIPLY',qy,qy)));th=math_node('ARCTAN2',qy,qx)
   fold=math_node('ABSOLUTE',math_node('SUBTRACT',math_node('FLOORED_MODULO',math_node('ADD',th,sector/2),sector),sector/2))
   nx=math_node('MULTIPLY',math_node('COSINE',fold),r);ny=math_node('MULTIPLY',math_node('SINE',fold),r)
   wx=math_node('MULTIPLY_ADD',nx,c,math_node('MULTIPLY',ny,-sn));wy=math_node('MULTIPLY_ADD',nx,sn,math_node('MULTIPLY',ny,c))
   ex=min(.1,6/w);ey=min(.1,6/h)
   U=math_node('ADD',math_node('PINGPONG',math_node('ADD',math_node('MULTIPLY',wx,f['scale']/ux),f['x']-ex),1-2*ex),ex)
   V=math_node('ADD',math_node('PINGPONG',math_node('ADD',math_node('MULTIPLY',wy,f['scale']/uy),1-f['y']-ey),1-2*ey),ey)
   vec=nodes.new('CompositorNodeCombineXYZ');links.new(U,vec.inputs[0]);links.new(V,vec.inputs[1]);vec.inputs[2].default_value=1
   mp=node('MapUV');links.new(a,mp.inputs['Image']);links.new(vec.outputs[0],mp.inputs['UV']);target=mp.outputs[0]
   mask=None
  elif kind=='facets':
   copies=[]
   for i in range(f['count']):
    ang=math.radians(f['rotation'])+i*2*math.pi/f['count'];copies.append(transform(a,f,f['shift']*f['scale']*math.cos(ang),f['shift']*f['scale']*math.sin(ang),0))
   target=copies[0]
   for i,b in enumerate(copies[1:],2):target=mix(target,b,1/i)
   ov=node('AlphaOver');links.new(a,ov.inputs[1]);links.new(target,ov.inputs[2]);target=ov.outputs[0]
   if f.get('edge_blur',0)>0:target=blur(target,f['edge_blur']*.1)
  elif kind=='wedge':target=transform(a,f,f['shift']*f['scale']*math.cos(math.radians(f['rotation'])),f['shift']*f['scale']*math.sin(math.radians(f['rotation'])),0)
  if ptype:
   sep=node('SepRGBA');wire(sep,target);combine=node('CombRGBA');angle=math.radians(f['rotation']);shift=f['shift']*f['scale']*.25
   for i,sign in [(0,1),(1,0),(2,-1)]:links.new(transform(sep.outputs[i],f,sign*shift*math.cos(angle),sign*shift*math.sin(angle),0) if sign else sep.outputs[i],combine.inputs[i])
   links.new(sep.outputs[3],combine.inputs[3]);target=combine.outputs[0]
  if f['region']:mask=multiply(mask,ellipse(f)) if mask else ellipse(f)
  factor=f['amount']
  if mask:
   n=node('Math');n.operation='MULTIPLY';links.new(mask,n.inputs[0]);n.inputs[1].default_value=factor;factor=n.outputs[0]
  source=mix(a,target,factor)
 original=next(n for n in nodes if n.bl_idname=='NodeGroupInput').outputs[0]
 alpha=node('SepRGBA');wire(alpha,original);preserve=node('SetAlpha')
 if hasattr(preserve,'mode'):preserve.mode='REPLACE_ALPHA'
 else:preserve.inputs['Type'].default_value='Replace Alpha'
 links.new(source,preserve.inputs[0]);links.new(alpha.outputs[3],preserve.inputs[1])
 output=nodes.new('NodeGroupOutput');links.new(preserve.outputs[0],output.inputs[0])
 if owned:
  old={n.node_tree for n in owned}
  for n in owned:n.node_tree=group;n['configuration']=signature;n.mute=False
  for previous in old:
   if previous.users==0:bpy.data.node_groups.remove(previous)
 else:
  outputs=composite_outputs(tree)
  if not outputs:outputs=[tree.nodes.new('CompositorNodeComposite')]
  for output in outputs:
   link=output.inputs[0].links[0] if output.inputs[0].links else None
   original=link.from_socket if link else tree.nodes.new('CompositorNodeRLayers').outputs['Image']
   n=tree.nodes.new('CompositorNodeGroup');n.node_tree=group;n.label='Bruxos · Artistic Filters';n['bruxos_filter']=True;n['configuration']=signature
   tree.links.new(original,n.inputs[0]);tree.links.new(n.outputs[0],output.inputs[0])
