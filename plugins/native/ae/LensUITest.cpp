#define NOMINMAX
#define _WINDOWS
#include "AEConfig.h"
#include "AE_Effect.h"
#include "AE_EffectUI.h"
#include "AE_EffectSuites.h"
#include "adobesdk/DrawbotSuite.h"
#include <windows.h>
#include <vector>
#include <string>
#include <cstdio>
#include <cmath>
using Main=PF_Err(*)(PF_Cmd,PF_InData*,PF_OutData*,PF_ParamDef*[],PF_LayerDef*,void*);
static std::vector<PF_ParamDef> params(1);static int objects=0,suites=0,strokes=0,fills=0,texts=0,states=0,registered=0,checks=0;static bool clipped=false,nonAscii=false;static DRAWBOT_PointF32 hit{};
struct Object{DRAWBOT_ColorRGBA color{};std::vector<DRAWBOT_PointF32> points;};
static void require(bool good,const char* text){if(!good){printf("FAIL: %s\n",text);exit(1);}checks++;}
static PF_Err add(PF_ProgPtr,PF_ParamIndex,PF_ParamDef* p){params.push_back(*p);return 0;}
static PF_Err registration(PF_ProgPtr,PF_CustomUIInfo* info){require(info->events==PF_CustomEFlag_EFFECT,"effect control events registered");registered++;return 0;}
static SPErr supplier(DRAWBOT_DrawRef,DRAWBOT_SupplierRef* out){*out=(DRAWBOT_SupplierRef)1;return 0;}
static SPErr canvas(DRAWBOT_DrawRef,DRAWBOT_SurfaceRef* out){*out=(DRAWBOT_SurfaceRef)1;return 0;}
static PF_Err drawRef(const PF_ContextH,DRAWBOT_DrawRef* out){*out=(DRAWBOT_DrawRef)1;return 0;}
static SPErr pen(DRAWBOT_SupplierRef,const DRAWBOT_ColorRGBA* color,float,DRAWBOT_PenRef* out){auto o=new Object;o->color=*color;*out=(DRAWBOT_PenRef)o;objects++;return 0;}
static SPErr brush(DRAWBOT_SupplierRef,const DRAWBOT_ColorRGBA* color,DRAWBOT_BrushRef* out){auto o=new Object;o->color=*color;*out=(DRAWBOT_BrushRef)o;objects++;return 0;}
static SPErr font(DRAWBOT_SupplierRef,float,DRAWBOT_FontRef* out){*out=(DRAWBOT_FontRef)new Object;objects++;return 0;}
static SPErr path(DRAWBOT_SupplierRef,DRAWBOT_PathRef* out){*out=(DRAWBOT_PathRef)new Object;objects++;return 0;}
static SPErr release(DRAWBOT_ObjectRef obj){delete (Object*)obj;objects--;return 0;}
static SPErr move(DRAWBOT_PathRef obj,float x,float y){((Object*)obj)->points.push_back({x,y});require(std::isfinite(x)&&std::isfinite(y),"finite drawing vertex");return 0;}
static SPErr close(DRAWBOT_PathRef){return 0;}
static SPErr stroke(DRAWBOT_SurfaceRef,DRAWBOT_PenRef pen,DRAWBOT_PathRef path){auto& c=((Object*)pen)->color;auto& pts=((Object*)path)->points;if(c.green>.8&&c.blue>.8&&pts.size()==65&&hit.x==0)hit=pts[32];strokes++;return 0;}
static SPErr fill(DRAWBOT_SurfaceRef,DRAWBOT_BrushRef,DRAWBOT_PathRef,DRAWBOT_FillType){fills++;return 0;}
static SPErr text(DRAWBOT_SurfaceRef,DRAWBOT_BrushRef,DRAWBOT_FontRef,const DRAWBOT_UTF16Char* str,const DRAWBOT_PointF32*,DRAWBOT_TextAlignment,DRAWBOT_TextTruncation,float){texts++;for(auto p=str;*p;p++)nonAscii|=*p>255;return 0;}
static SPErr push(DRAWBOT_SurfaceRef){states++;return 0;}static SPErr pop(DRAWBOT_SurfaceRef){states--;return 0;}
static SPErr clip(DRAWBOT_SurfaceRef,DRAWBOT_SupplierRef,const DRAWBOT_Rect32* rect){clipped=rect->left==25&&rect->top==40&&rect->width==500&&rect->height==260;return 0;}
static PF_EffectCustomUISuite2 ui{};static DRAWBOT_DrawbotSuite1 draw{};static DRAWBOT_SupplierSuite1 supply{};static DRAWBOT_SurfaceSuite1 surface{};static DRAWBOT_PathSuite1 paths{};
static SPErr acquire(const char* name,int32,const void** out){if(!strcmp(name,kPFEffectCustomUISuite))*out=&ui;else if(!strcmp(name,kDRAWBOT_DrawSuite))*out=&draw;else if(!strcmp(name,kDRAWBOT_SupplierSuite))*out=&supply;else if(!strcmp(name,kDRAWBOT_SurfaceSuite))*out=&surface;else if(!strcmp(name,kDRAWBOT_PathSuite))*out=&paths;else return -1;suites++;return 0;}
static SPErr releaseSuite(const char*,int32){suites--;return 0;}
int main(int argc,char** argv){auto module=LoadLibraryA(argv[1]);require(module!=nullptr,"load AE");auto effect=(Main)GetProcAddress(module,"EffectMain");require(effect!=nullptr,"entry");
 ui.PF_GetDrawingReference=drawRef;draw.GetSupplier=supplier;draw.GetSurface=canvas;supply.NewPen=pen;supply.NewBrush=brush;supply.NewDefaultFont=font;supply.NewPath=path;supply.ReleaseObject=release;surface.StrokePath=stroke;surface.FillPath=fill;surface.DrawString=text;surface.PushStateStack=push;surface.PopStateStack=pop;surface.Clip=clip;paths.MoveTo=move;paths.LineTo=move;paths.Close=close;
 SPBasicSuite basic{};basic.AcquireSuite=acquire;basic.ReleaseSuite=releaseSuite;PF_InData in{};PF_OutData out{};in.pica_basicP=&basic;in.inter.add_param=add;in.inter.register_ui=registration;
 require(effect(PF_Cmd_GLOBAL_SETUP,&in,&out,nullptr,nullptr,nullptr)==0&&(out.out_flags&PF_OutFlag_CUSTOM_UI),"custom UI declared");require(effect(PF_Cmd_PARAMS_SETUP,&in,&out,nullptr,nullptr,nullptr)==0&&registered==1,"register UI");int diagram=-1,edit=-1;for(int i=1;i<int(params.size());i++){if(params[i].uu.id==98)diagram=i;if(params[i].uu.id==4)edit=i;}
 require(diagram>0&&edit>0,"stable UI and edit IDs");require(params[diagram].param_type==PF_Param_NO_DATA&&params[diagram].ui_flags==PF_PUI_CONTROL,"valid no-data UI flags");
 std::vector<PF_ParamDef*> all;for(auto& p:params)all.push_back(&p);PF_EventExtra evt{};evt.e_type=PF_Event_DRAW;evt.effect_win.index=diagram;evt.effect_win.area=PF_EA_CONTROL;evt.effect_win.current_frame={25,40,525,300};
 require(effect(PF_Cmd_EVENT,&in,&out,all.data(),nullptr,&evt)==0,"draw event");require(strokes>10&&fills>1&&texts==3,"lens glass rays and labels drawn");require(clipped&&states==0,"drawing clipped and state restored");require(objects==0&&suites==0,"drawing resources released");require(hit.x>0,"surface hit target");
 evt.e_type=PF_Event_DO_CLICK;evt.u.do_click.screen_point.h=A_long(hit.x+.5);evt.u.do_click.screen_point.v=A_long(hit.y+.5);require(effect(PF_Cmd_EVENT,&in,&out,all.data(),nullptr,&evt)==0,"click event");require(params[edit].u.fs_d.value>=1&&params[edit].uu.change_flags==PF_ChangeFlag_CHANGED_VALUE,"surface click changes renderer edit control");require((out.out_flags&PF_OutFlag_REFRESH_UI)&&(evt.evt_out_flags&PF_EO_ALWAYS_UPDATE),"selection refreshes UI and render");
 if(argc>2)require(nonAscii,"Chinese drawing labels use UTF16");printf("PASS: %d UI checks; native drawing, clipping, click selection and resource cleanup\n",checks);}
