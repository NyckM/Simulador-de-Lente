from pathlib import Path
import sys,json,os
import numpy as np
import torch
root=Path(__file__).resolve().parents[1];sys.path.insert(0,str(root/'comfyui'))
from bruxos_webgl import NODE_CLASS_MAPPINGS
node=NODE_CLASS_MAPPINGS['BruxosWebGLDepth']();builder=NODE_CLASS_MAPPINGS['BruxosArtisticFilter']()
image=torch.full((1,64,64,3),.04);image[:,22:42,24:40]=.5;image[:,25:39:2,26:38]=1;image[:,10:13,12:15]=1
depth=torch.zeros_like(image);depth[:,22:42,24:40]=1
controls=dict(focus_m=2,near_m=2,far_m=8,iris_mm=8,blades=7,bokeh_gain=2,samples=64,depth_mode='cut',depth_slices=4,depth_cut=.5,depth_feather=.02,eclipse_bokeh=False,swirl=0,astigmatism_mm=0,browser='edge')
base,info=node.render(image,depth,**controls)
rows=[]
for label,changes in [('focus',dict(focus_preservation=1,focus_width=.3)),('background',dict(background_blur=0)),('foreground',dict(focus_m=8,foreground_blur=0)),('texture',dict(bokeh_texture_rings=1,bokeh_texture_grain=1,bokeh_texture_scale=10,bokeh_texture_rotation=60)),('edges',dict(edge_compensation=100,edge_compensation_limit=1))]:
 out,_=node.render(image,depth,**{**controls,**changes});assert out.shape==image.shape and torch.isfinite(out).all();difference=float(torch.max(torch.abs(out-base)));assert difference>0,(label,difference);rows.append(dict(control=label,difference=difference))
legacy,_=node.render(image,depth,**controls,focus_preservation=0,foreground_blur=100,background_blur=100,bokeh_texture_rings=0,bokeh_texture_grain=0,edge_compensation_limit=3);assert torch.equal(legacy,base)
batch,_=node.render(torch.cat([image,image]),depth,**controls);assert torch.equal(batch[0],batch[1])
invalid=0
for field,val in [('focus_width',0),('background_blur',201),('bokeh_texture_scale',float('nan'))]:
 try:node.render(image,depth,**{**controls,field:val})
 except ValueError:invalid+=1
assert invalid==3
# Externally estimated metric depth follows the same upright mapping.
metric,_=node.render(image,torch.where(depth>0,2.,8.),**controls,advanced_settings='{"depth_units":"meters"}');assert torch.max(torch.abs(metric-base))<.02
stack=builder.settings('streak',.3,50,50,100,30,.1,False,4,.1)[0];filtered,_=node.render(image,depth,**controls,advanced_settings=stack);assert not torch.equal(filtered,base)
report=dict(passed=True,controls=rows,legacy_defaults_exact=True,batch=True,invalid_rejected=invalid,metric_depth=True,filter=True,render=json.loads(info));out=root/'research/plugins-update';out.mkdir(exist_ok=True);(out/'comfy.json').write_text(json.dumps(report,indent=2));print(json.dumps(report),flush=True)
