#pragma once
#include "AE_EffectUI.h"
#include "AE_EffectSuites.h"
#include "adobesdk/DrawbotSuite.h"
#include "LensDiagram.h"
struct LensViewport {
 double x,y,w,h,scale,cx,cy;
 LensViewport(const LensDiagram& d,PF_UnionableRect r){x=r.left;y=r.top;w=r.right-r.left;h=r.bottom-r.top;scale=std::max(.001,std::min((w-32)/(d.right-d.left),(h-74)/(2*d.height)));cx=x+w/2-(d.left+d.right)/2*scale;cy=y+(h+10)/2;}
 LensPoint pixel(LensPoint p)const{return{cx+p.z*scale,cy-p.y*scale};}
};
struct LensDraw {
 SPBasicSuite* basic;const PF_EffectCustomUISuite2* ui=nullptr;const DRAWBOT_DrawbotSuite1* draw=nullptr;const DRAWBOT_SupplierSuite1* supply=nullptr;const DRAWBOT_SurfaceSuite1* surface=nullptr;const DRAWBOT_PathSuite1* path=nullptr;DRAWBOT_SurfaceRef canvas=nullptr;DRAWBOT_SupplierRef supplier=nullptr;DRAWBOT_FontRef font=nullptr;bool pushed=false;
 template<class T> void acquire(const char* name,int version,const T*& suite){if(!basic||basic->AcquireSuite(name,version,reinterpret_cast<const void**>(&suite)))throw std::runtime_error("Custom drawing suite unavailable");}
 LensDraw(SPBasicSuite* b,PF_ContextH context):basic(b){try{acquire(kPFEffectCustomUISuite,2,ui);acquire(kDRAWBOT_DrawSuite,1,draw);acquire(kDRAWBOT_SupplierSuite,1,supply);acquire(kDRAWBOT_SurfaceSuite,1,surface);acquire(kDRAWBOT_PathSuite,1,path);DRAWBOT_DrawRef ref;ui->PF_GetDrawingReference(context,&ref);draw->GetSupplier(ref,&supplier);draw->GetSurface(ref,&canvas);supply->NewDefaultFont(supplier,11,&font);}catch(...){release();throw;}}
 void release(){if(pushed&&surface){surface->PopStateStack(canvas);pushed=false;}if(font)supply->ReleaseObject((DRAWBOT_ObjectRef)font);if(path)basic->ReleaseSuite(kDRAWBOT_PathSuite,1);if(surface)basic->ReleaseSuite(kDRAWBOT_SurfaceSuite,1);if(supply)basic->ReleaseSuite(kDRAWBOT_SupplierSuite,1);if(draw)basic->ReleaseSuite(kDRAWBOT_DrawSuite,1);if(ui)basic->ReleaseSuite(kPFEffectCustomUISuite,2);font=nullptr;path=nullptr;surface=nullptr;supply=nullptr;draw=nullptr;ui=nullptr;}
 ~LensDraw(){release();}
 void line(const std::vector<LensPoint>& points,DRAWBOT_ColorRGBA color,float width=1,bool fill=false){if(points.empty())return;DRAWBOT_PathRef obj;supply->NewPath(supplier,&obj);path->MoveTo(obj,float(points[0].z),float(points[0].y));for(size_t i=1;i<points.size();i++)path->LineTo(obj,float(points[i].z),float(points[i].y));if(fill){path->Close(obj);DRAWBOT_BrushRef brush;supply->NewBrush(supplier,&color,&brush);surface->FillPath(canvas,brush,obj,kDRAWBOT_FillType_EvenOdd);supply->ReleaseObject((DRAWBOT_ObjectRef)brush);}else{DRAWBOT_PenRef pen;supply->NewPen(supplier,&color,width,&pen);surface->StrokePath(canvas,pen,obj);supply->ReleaseObject((DRAWBOT_ObjectRef)pen);}supply->ReleaseObject((DRAWBOT_ObjectRef)obj);}
 void text(double x,double y,const std::string& text,DRAWBOT_ColorRGBA color){if(!font)return;std::vector<DRAWBOT_UTF16Char> utf;for(size_t i=0;i<text.size();){unsigned c=(unsigned char)text[i++];int rest=0;if(c>=240){c&=7;rest=3;}else if(c>=224){c&=15;rest=2;}else if(c>=192){c&=31;rest=1;}while(rest--&&i<text.size())c=(c<<6)|((unsigned char)text[i++]&63);if(c>65535){c-=65536;utf.push_back(DRAWBOT_UTF16Char(0xd800+(c>>10)));utf.push_back(DRAWBOT_UTF16Char(0xdc00+(c&1023)));}else utf.push_back(DRAWBOT_UTF16Char(c));}utf.push_back(0);DRAWBOT_BrushRef brush;supply->NewBrush(supplier,&color,&brush);DRAWBOT_PointF32 origin{float(x),float(y)};surface->DrawString(canvas,brush,font,reinterpret_cast<const DRAWBOT_UTF16Char*>(utf.data()),&origin,kDRAWBOT_TextAlignment_Left,kDRAWBOT_TextTruncation_None,0);supply->ReleaseObject((DRAWBOT_ObjectRef)brush);}
};
static LensDiagram parameterDiagram(PF_ParamDef* p[]){OpticalSettings s;s.preset=std::clamp(choice(p,PRESET)-1,0,presetCount-1);s.edit=int(value(p,EDIT));s.curvature=value(p,CURVATURE);s.spacing=value(p,SPACING);s.diameter=value(p,DIAMETER);s.indexOffset=value(p,INDEX_OFFSET);s.source=value(p,SOURCE_DISTANCE);s.sensor=value(p,SENSOR);s.rotation=value(p,IRIS_ROTATION);s.dispersion=value(p,DISPERSION);int blades[]={0,3,4,5,6,7,8,9,10,11,12,14,16,32};s.blades=blades[std::clamp(choice(p,BLADES)-1,0,13)];return makeLensDiagram(s,value(p,FSTOP),value(p,FOCUS),value(p,FILMBACK));}
static PF_Err lensEvent(PF_InData* in,PF_OutData* out,PF_ParamDef* p[],PF_EventExtra* event){
 if(!event||!p||(event->e_type!=PF_Event_DRAW&&event->e_type!=PF_Event_DO_CLICK)||event->effect_win.index!=DIAGRAM||event->effect_win.area!=PF_EA_CONTROL)return PF_Err_NONE;
 auto d=parameterDiagram(p);LensViewport view(d,event->effect_win.current_frame);
 if(event->e_type==PF_Event_DO_CLICK){double best=14;int selected=0;auto point=event->u.do_click.screen_point;for(auto& s:d.surfaces)for(auto q:s.outline){auto px=view.pixel(q);double dist=std::hypot(px.z-point.h,px.y-point.v);if(dist<best){best=dist;selected=s.id;}}
 if(selected){p[EDIT]->u.fs_d.value=selected;p[EDIT]->uu.change_flags=PF_ChangeFlag_CHANGED_VALUE;out->out_flags|=PF_OutFlag_REFRESH_UI;event->evt_out_flags|=PF_EO_HANDLED_EVENT|PF_EO_ALWAYS_UPDATE;}return PF_Err_NONE;}
 if(event->e_type!=PF_Event_DRAW)return PF_Err_NONE;
 LensDraw draw(in->pica_basicP,event->contextH);draw.surface->PushStateStack(draw.canvas);draw.pushed=true;DRAWBOT_Rect32 clip{int(view.x),int(view.y),int(view.w),int(view.h)};draw.surface->Clip(draw.canvas,draw.supplier,&clip);DRAWBOT_ColorRGBA bg{.055f,.075f,.09f,1},glass{.12f,.54f,.65f,.3f},edge{.35f,.82f,.88f,1},selected{1,.77f,.25f,1},axis{.25f,.3f,.34f,1},white{.8f,.86f,.88f,1};
 draw.line({{view.x,view.y},{view.x+view.w,view.y},{view.x+view.w,view.y+view.h},{view.x,view.y+view.h}},bg,1,true);
 auto project=[&](const std::vector<LensPoint>& points){std::vector<LensPoint> result;for(auto p:points)result.push_back(view.pixel(p));return result;};
 draw.line({view.pixel({d.left,0}),view.pixel({d.right,0})},axis);
 for(size_t i=0;i+1<d.surfaces.size();i++){auto& s=d.surfaces[i];if(s.index<=1||s.stop)continue;auto polygon=s.outline;auto& next=d.surfaces[i+1].outline;polygon.insert(polygon.end(),next.rbegin(),next.rend());draw.line(project(polygon),glass,1,true);}
 DRAWBOT_ColorRGBA colors[]={{1,.38f,.24f,.4f},{.42f,1,.57f,.4f},{.35f,.62f,1,.4f}};
 for(auto& r:d.rays)if(r.transmitted)draw.line(project(r.points),colors[r.channel]);
 for(auto& s:d.surfaces){if(s.stop){double half=s.diameter/2;draw.line({view.pixel({s.z,-half}),view.pixel({s.z,-d.iris})},white,3);draw.line({view.pixel({s.z,d.iris}),view.pixel({s.z,half})},white,3);}else draw.line(project(s.outline),s.id==d.selected?selected:edge,s.id==d.selected?2.5f:1.2f);
 auto pos=view.pixel({s.z,-s.diameter/2});if(s.id==d.selected)draw.text(pos.z-6,pos.y+15,std::to_string(s.id),selected);}
 draw.line({view.pixel({d.sensor,-value(p,SENSOR)/2}),view.pixel({d.sensor,value(p,SENSOR)/2})},selected,2);
 draw.text(view.x+10,view.y+17,d.name,white);draw.text(view.x+10,view.y+view.h-12,bruxos_i18n::tr("Clique no vidro; ajuste a superficie abaixo."),white);
 draw.text(view.x+10,view.y+34,bruxos_i18n::tr("Luz > vidros > diafragma > sensor"),edge);
 event->evt_out_flags|=PF_EO_HANDLED_EVENT;return PF_Err_NONE;
}
