"""Surface-point focus in scene units, measured along the optical axis."""
import json,sys
import bpy
from mathutils import Vector
from bpy_extras import view3d_utils
from bpy.app.handlers import persistent

_updating=False

def target_focus(scene,p):
    if not p.track_focus or not p.focus_target or not p.camera or not p.surfaces:return None
    from . import cached_focus
    from .optics import rows_from_props,effective_iris
    graph=bpy.context.evaluated_depsgraph_get();camera=p.camera.evaluated_get(graph);target=p.focus_target.evaluated_get(graph)
    forward=camera.matrix_world.to_quaternion() @ Vector((0,0,-1))
    axial=(target.matrix_world.translation-camera.matrix_world.translation).dot(forward)*(scene.unit_settings.scale_length or 1)
    rows=rows_from_props(p);iris,_=effective_iris(p,rows);serialized=json.dumps(rows,sort_keys=True)
    # The custom ray origin is the sensor, while focus_m is measured from the front vertex.
    distance=axial
    for _ in range(4):
        if not .3<=distance<=1000:raise ValueError('Alvo fora da faixa de foco da lente (0,3–1000 m).')
        sensor,_=cached_focus(serialized,distance,iris);new=axial-sensor*.001
        if abs(new-distance)<1e-7:break
        distance=new
    if not .3<=distance<=1000:raise ValueError('Alvo fora da faixa de foco da lente.')
    return distance

def update_target(scene,p):
    value=target_focus(scene,p)
    if value is None or abs(p.focus_m-value)<1e-5:return False
    state=sys.modules[__package__].__dict__
    previous=state['_busy'];state['_busy']=True
    try:p.focus_m=value
    finally:state['_busy']=previous
    return True

@persistent
def focus_depsgraph(scene,*args):
    global _updating
    if _updating or not hasattr(scene,'bruxos_lens'):return
    p=scene.bruxos_lens
    if not p.track_focus or not p.focus_target:return
    _updating=True
    try:
        if update_target(scene,p):
            from . import sync_camera
            sync_camera(scene,False)
    except Exception as exc:p.status=str(exc)
    finally:_updating=False

class BRUXOS_OT_focus_clear(bpy.types.Operator):
    bl_idname='bruxos.clear_focus_target';bl_label='Liberar alvo de foco';bl_options={'REGISTER','UNDO'}
    def execute(self,context):
        p=context.scene.bruxos_lens;p.track_focus=False;p.focus_target=None
        return {'FINISHED'}

class BRUXOS_OT_focus_pick(bpy.types.Operator):
    bl_idname='bruxos.pick_focus_surface';bl_label='Focar ponto na superfície';bl_options={'REGISTER','UNDO'}
    def invoke(self,context,event):
        if not context.scene.bruxos_lens.camera or not context.scene.bruxos_lens.surfaces or context.area.type!='VIEW_3D':
            self.report({'ERROR'},'Selecione a câmera da lente.');return {'CANCELLED'}
        context.window_manager.modal_handler_add(self);context.window.cursor_modal_set('CROSSHAIR');return {'RUNNING_MODAL'}
    def modal(self,context,event):
        if event.type in {'ESC','RIGHTMOUSE'}:context.window.cursor_modal_restore();return {'CANCELLED'}
        if event.type!='LEFTMOUSE' or event.value!='PRESS':return {'RUNNING_MODAL'}
        region=next((r for r in context.area.regions if r.type=='WINDOW' and r.x<=event.mouse_x<r.x+r.width and r.y<=event.mouse_y<r.y+r.height),None)
        if region is None:return {'RUNNING_MODAL'}
        xy=(event.mouse_x-region.x,event.mouse_y-region.y);view=context.space_data.region_3d
        origin=view3d_utils.region_2d_to_origin_3d(region,view,xy);direction=view3d_utils.region_2d_to_vector_3d(region,view,xy)
        hit,point,normal,index,obj,matrix=context.scene.ray_cast(context.evaluated_depsgraph_get(),origin,direction)
        if not hit:self.report({'INFO'},'Clique numa superfície visível da cena.');return {'RUNNING_MODAL'}
        p=context.scene.bruxos_lens;marker=bpy.data.objects.new('Bruxos · ponto de foco',None);context.scene.collection.objects.link(marker)
        marker['bruxos_focus_marker']=True;marker.empty_display_type='SPHERE';marker.empty_display_size=.025;marker.hide_render=True;marker.show_in_front=True
        marker.parent=obj.original;marker.matrix_parent_inverse=obj.original.matrix_world.inverted_safe();marker.matrix_world.translation=point
        previous=(p.focus_target,p.track_focus)
        try:
            p.focus_target=marker;p.track_focus=True;update_target(context.scene,p)
            from . import sync_camera
            sync_camera(context.scene,False)
        except Exception as exc:
            p.focus_target,p.track_focus=previous;bpy.data.objects.remove(marker,do_unlink=True);self.report({'ERROR'},str(exc));context.window.cursor_modal_restore();return {'CANCELLED'}
        context.window.cursor_modal_restore();return {'FINISHED'}

CLASSES=[BRUXOS_OT_focus_clear,BRUXOS_OT_focus_pick]
