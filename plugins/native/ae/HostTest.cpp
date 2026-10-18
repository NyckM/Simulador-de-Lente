#define NOMINMAX
#define _WINDOWS
#include "AEConfig.h"
#include "AE_Effect.h"
#include "AE_EffectCB.h"
#include "AE_EffectUI.h"
#include "Localization.generated.h"
#include <windows.h>
#include <vector>
#include <cstdio>
#include <cmath>
#include <string>
#include <algorithm>
#include <map>
using Main=PF_Err(*)(PF_Cmd,PF_InData*,PF_OutData*,PF_ParamDef*[],PF_LayerDef*,void*);
static std::vector<PF_ParamDef> params(1);
static PF_EffectWorld input{},depth{},output{};
static int checks=0,pixelCheckouts=0,pixelCheckins=0;
static std::map<int,PF_EffectWorld*> optionalWorlds;
static void require(bool good,const char* message){if(!good){std::printf("FAIL: %s\n",message);std::exit(1);}checks++;}
static PF_Err registerUI(PF_ProgPtr,PF_CustomUIInfo*){return 0;}
static PF_Err addParam(PF_ProgPtr,PF_ParamIndex,PF_ParamDef* def){params.push_back(*def);return 0;}
static PF_Err abortRender(PF_ProgPtr){return 0;}
static PF_Err checkout(PF_ProgPtr,PF_ParamIndex index,A_long,A_long,A_u_long,PF_ParamDef* def){*def=params[index];return 0;}
static PF_Err checkin(PF_ProgPtr,PF_ParamDef*){return 0;}
static PF_Err layerPixels(PF_ProgPtr,A_long id,PF_EffectWorld** world){pixelCheckouts++;*world=id==0?&input:std::string(params[id].PF_DEF_NAME)==bruxos_i18n::paramName("Camada Depth")?&depth:optionalWorlds.count(id)?optionalWorlds[id]:nullptr;return 0;}
static PF_Err layerCheckin(PF_ProgPtr,A_long){pixelCheckins++;return 0;}
static PF_Err checkoutLayer(PF_ProgPtr,PF_ParamIndex,A_long,const PF_RenderRequest* request,A_long,A_long,A_u_long,PF_CheckoutResult* result){result->result_rect=request->rect;result->max_result_rect=request->rect;return 0;}
static PF_Err outputPixels(PF_ProgPtr,PF_EffectWorld** world){*world=&output;return 0;}
static int find(const char* name){const char* label=bruxos_i18n::paramName(name);for(int i=1;i<int(params.size());i++)if(std::string(params[i].PF_DEF_NAME)==label)return i;std::printf("missing %s\n",name);std::exit(1);}
static void number(const char* name,double x){params[find(name)].u.fs_d.value=x;}
static void popup(const char* name,int x){params[find(name)].u.pd.value=x;}
int main(int argc,char** argv){setvbuf(stdout,nullptr,_IONBF,0);auto module=LoadLibraryA(argc>1?argv[1]:"bin\\BruxosdovfxDesfoque.aex");require(module!=nullptr,"load AEX");auto effect=reinterpret_cast<Main>(GetProcAddress(module,"EffectMain"));require(effect!=nullptr,"EffectMain export");PF_InData in{};PF_OutData out{};in.width=64;in.height=40;in.time_scale=24;in.time_step=1;in.pixel_aspect_ratio={1,1};in.downsample_x={1,1};in.downsample_y={1,1};in.inter.register_ui=registerUI;in.inter.add_param=addParam;in.inter.abort=abortRender;in.inter.checkout_param=checkout;in.inter.checkin_param=checkin;
 require(effect(PF_Cmd_GLOBAL_SETUP,&in,&out,nullptr,nullptr,nullptr)==0,"global setup");require((out.out_flags2&PF_OutFlag2_FLOAT_COLOR_AWARE)!=0,"HDR declared");require(effect(PF_Cmd_PARAMS_SETUP,&in,&out,nullptr,nullptr,nullptr)==0,"parameter setup");require(out.num_params==params.size(),"parameter count");require(params[find("Perfil de lente")].u.pd.num_choices>280,"presets present");require(params[find("Cut")].uu.id==31,"stable Cut disk ID");require(params[find("Grow (px)")].uu.id==72,"stable Grow disk ID");require(find("Grow (px)")<find("Eclipsed bokeh"),"Grow belongs to depth section");require(find("Feather (px)")<find("Eclipsed bokeh"),"Feather belongs to depth section");PF_PreRenderInput preInput{};PF_PreRenderOutput preOutput{};PF_PreRenderCallbacks preCallbacks{};preCallbacks.checkout_layer=checkoutLayer;PF_PreRenderExtra preExtra{&preInput,&preOutput,&preCallbacks};require(effect(PF_Cmd_SMART_PRE_RENDER,&in,&out,nullptr,nullptr,&preExtra)==0,"full pre-render");require(preOutput.result_rect.right==64&&preOutput.result_rect.bottom==40,"full-frame bounds");in.downsample_x={1,2};in.downsample_y={1,2};require(effect(PF_Cmd_SMART_PRE_RENDER,&in,&out,nullptr,nullptr,&preExtra)==0,"half pre-render");require(preOutput.result_rect.right==32&&preOutput.result_rect.bottom==20,"downsampled bounds");in.downsample_x={1,1};in.downsample_y={1,1};
popup("Campo optico",1);popup("Qualidade",1);number("Foco (m)",5);number("Distancia sem depth (m)",5);
 std::vector<PF_PixelFloat> src(64*40),dst(src.size()),dep(src.size());for(int y=0;y<40;y++)for(int x=0;x<64;x++){auto& c=src[y*64+x];c={1,.1f,.2f,.3f};if(x==32&&y==20)c={1,8,5,2};dep[y*64+x]={1,0,0,0};}
 input.width=output.width=depth.width=64;input.height=output.height=depth.height=40;input.rowbytes=output.rowbytes=depth.rowbytes=64*sizeof(PF_PixelFloat);input.data=reinterpret_cast<PF_Pixel*>(src.data());output.data=reinterpret_cast<PF_Pixel*>(dst.data());depth.data=nullptr;
 PF_SmartRenderInput smartInput{};smartInput.bitdepth=32;PF_SmartRenderCallbacks callbacks{};callbacks.checkout_layer_pixels=layerPixels;callbacks.checkin_layer_pixels=layerCheckin;callbacks.checkout_output=outputPixels;PF_SmartRenderExtra extra{&smartInput,&callbacks};
 require(effect(PF_Cmd_SMART_RENDER,&in,&out,nullptr,nullptr,&extra)==0,"SmartFX float render");float sharp=dst[20*64+32].red;require(sharp>1,"HDR survives");number("Foco (m)",.8);require(effect(PF_Cmd_SMART_RENDER,&in,&out,nullptr,nullptr,&extra)==0,"defocus render");float wide=dst[20*64+32].red;require(wide<sharp,"focus changes blur");number("Diafragma (f/)",22);require(effect(PF_Cmd_SMART_RENDER,&in,&out,nullptr,nullptr,&extra)==0,"closed iris render");require(dst[20*64+32].red>wide,"closing diaphragm shrinks blur");number("Diafragma (f/)",2.8);
 depth.data=reinterpret_cast<PF_Pixel*>(dep.data());for(int y=10;y<30;y++)for(int x=23;x<41;x++){src[y*64+x]={1,.2f,.8f,.3f};dep[y*64+x]={1,1,1,1};}number("Foco (m)",10);require(effect(PF_Cmd_SMART_RENDER,&in,&out,nullptr,nullptr,&extra)==0,"depth render");for(auto c:dst)require(std::isfinite(c.red)&&std::isfinite(c.green)&&std::isfinite(c.blue)&&c.alpha>=0&&c.alpha<=1,"finite output");
 number("Foco (m)",.8);depth.data=nullptr;for(auto& c:src)c={0,0,0,0};for(int y=14;y<26;y++)for(int x=26;x<38;x++)src[y*64+x]={1,.5f,.8f,.2f};require(effect(PF_Cmd_SMART_RENDER,&in,&out,nullptr,nullptr,&extra)==0,"transparent render");require(dst[20*64+26].alpha>0&&dst[20*64+26].alpha<1,"defocused alpha edge");std::printf("alpha x24 %.8f x25 %.8f x26 %.8f sharp %.5f wide %.5f\n",dst[20*64+24].alpha,dst[20*64+25].alpha,dst[20*64+26].alpha,sharp,wide);require(dst[20*64+25].alpha>0,"alpha spreads outside source silhouette");
 auto cudaModule=GetModuleHandleA("optica_cuda.dll");if(cudaModule){auto device=reinterpret_cast<const char*(*)()>(GetProcAddress(cudaModule,"optica_cuda_device"));if(device)std::printf("CUDA device: %s\n",device());}auto gpu=dst;popup("Motor",2);require(effect(PF_Cmd_SMART_RENDER,&in,&out,nullptr,nullptr,&extra)==0,"CPU fallback render");float maxDiff=0;for(int i=0;i<int(dst.size());i++)maxDiff=std::max(maxDiff,std::abs(dst[i].green-gpu[i].green));require(maxDiff<.002,"CPU / CUDA agree");
 popup("Motor",1);in.pixel_aspect_ratio={2,1};require(effect(PF_Cmd_SMART_RENDER,&in,&out,nullptr,nullptr,&extra)==0,"non-square GPU render");auto anamorphic=dst;popup("Motor",2);require(effect(PF_Cmd_SMART_RENDER,&in,&out,nullptr,nullptr,&extra)==0,"non-square CPU render");float parDiff=0;for(int i=0;i<int(dst.size());i++)parDiff=std::max(parDiff,std::abs(dst[i].green-anamorphic[i].green));require(parDiff<.002,"non-square CPU / CUDA agree");in.pixel_aspect_ratio={1,1};popup("Motor",1);

 // A soft depth edge must not assign sharp foreground RGB to far blur layers.
 number("Foco (m)",.8);depth.data=reinterpret_cast<PF_Pixel*>(dep.data());
 for(int y=0;y<40;y++)for(int x=0;x<64;x++){src[y*64+x]=x<32?PF_PixelFloat{1,.8f,.15f,.03f}:PF_PixelFloat{1,.15f,.12f,.35f};float d=x<32?1.f:0.f;dep[y*64+x]={1,d,d,d};}
 require(effect(PF_Cmd_SMART_RENDER,&in,&out,nullptr,nullptr,&extra)==0,"binary depth halo reference");auto reference=dst;
 for(int y=0;y<40;y++)for(int x=0;x<64;x++){float d=.5f*std::erfc((x-31.5f)/(1.5f*std::sqrt(2.f)));dep[y*64+x]={1,d,d,d};}
 require(effect(PF_Cmd_SMART_RENDER,&in,&out,nullptr,nullptr,&extra)==0,"soft depth halo regression CUDA");auto haloGpu=dst;float haloError=0;
 for(int y=8;y<32;y++)for(int x=35;x<40;x++)haloError=std::max(haloError,std::abs(dst[y*64+x].red-reference[y*64+x].red));
 require(haloError<.005f,"soft depth does not create foreground halo");popup("Motor",2);require(effect(PF_Cmd_SMART_RENDER,&in,&out,nullptr,nullptr,&extra)==0,"soft depth halo regression CPU");float haloDiff=0;for(int i=0;i<int(dst.size());i++)haloDiff=std::max(haloDiff,std::abs(dst[i].red-haloGpu[i].red));require(haloDiff<.002f,"halo fix CPU/CUDA agree");std::printf("Halo edge max error %.8f; CPU/CUDA %.8f\n",haloError,haloDiff);popup("Motor",1);depth.data=nullptr;
 for(auto& c:src)c={0,0,0,0};for(int y=14;y<26;y++)for(int x=26;x<38;x++)src[y*64+x]={1,.5f,.8f,.2f};

 // Every auxiliary world crosses the SDK adapter in float SmartFX.
 std::vector<PF_PixelFloat> layerPixelsData(64*40),layerMap(64*40),matteData(64*40);PF_EffectWorld layerWorld=input,mapWorld=input,matteWorld=input;layerWorld.data=reinterpret_cast<PF_Pixel*>(layerPixelsData.data());mapWorld.data=reinterpret_cast<PF_Pixel*>(layerMap.data());matteWorld.data=reinterpret_cast<PF_Pixel*>(matteData.data());
 for(int y=0;y<40;y++)for(int x=0;x<64;x++){layerPixelsData[y*64+x]={1,x%8<4?.8f:.05f,.1f,.05f};layerMap[y*64+x]={1,float(x)/63,float(x)/63,float(x)/63};matteData[y*64+x]={1,1,1,1};src[y*64+x]={1,.15f,.3f,.1f};}
 optionalWorlds[find("Layer A")]=&layerWorld;number("Profundidade A",0);require(effect(PF_Cmd_SMART_RENDER,&in,&out,nullptr,nullptr,&extra)==0,"Layer A checkout/render");auto aFrame=dst;require(GetProcAddress(module,"bruxos_layer_backend")!=nullptr,"layer backend diagnostic");auto backend=reinterpret_cast<int(*)()>(GetProcAddress(module,"bruxos_layer_backend"));if(argc<=2)require(backend()==1,"layer CUDA kernel executed");
 popup("Motor",2);require(effect(PF_Cmd_SMART_RENDER,&in,&out,nullptr,nullptr,&extra)==0,"Layer A CPU");float layerDiff=0;for(int i=0;i<int(dst.size());i++)layerDiff=std::max(layerDiff,std::abs(dst[i].red-aFrame[i].red));require(layerDiff<.002,"Layer A CPU/CUDA agree");popup("Motor",1);
 optionalWorlds[find("Depth Layer A")]=&mapWorld;require(effect(PF_Cmd_SMART_RENDER,&in,&out,nullptr,nullptr,&extra)==0,"Layer A per-pixel depth");float mapChange=0;for(int i=0;i<int(dst.size());i++)mapChange+=std::abs(dst[i].red-aFrame[i].red);require(mapChange>.001,"layer depth map affects blur");optionalWorlds.erase(find("Depth Layer A"));
 params[find("Layer A is Glitter")].u.bd.value=1;optionalWorlds[find("Glitter Matte")]=&matteWorld;number("Ganho do glitter",3);require(effect(PF_Cmd_SMART_RENDER,&in,&out,nullptr,nullptr,&extra)==0,"external glitter / matte");auto glitterFrame=dst;params[find("Normalize Glitter")].u.bd.value=0;require(effect(PF_Cmd_SMART_RENDER,&in,&out,nullptr,nullptr,&extra)==0,"glitter normalization control");float addedChange=0;for(int i=0;i<int(dst.size());i++)addedChange+=std::abs(dst[i].red-glitterFrame[i].red);require(addedChange>.001,"glitter normalization changes energy");params[find("Layer A is Glitter")].u.bd.value=0;
 optionalWorlds[find("Layer B")]=&layerWorld;optionalWorlds[find("Depth Layer B")]=&mapWorld;optionalWorlds[find("Layer C")]=&layerWorld;optionalWorlds[find("Depth Layer C")]=&mapWorld;params[find("Layer C is Distortion")].u.bd.value=1;number("Distorcao do vidro (px)",10);require(effect(PF_Cmd_SMART_RENDER,&in,&out,nullptr,nullptr,&extra)==0,"A B C / all maps / distortion");if(argc<=2)require(backend()==1,"stack and glass CUDA kernel");optionalWorlds.clear();
 // Depth preprocessing and coverage through the actual AE adapter.
 require(params[find("Normalizar mapa")].uu.id==95&&params[find("Curva do depth")].uu.id==96&&params[find("Distribuicao do depth")].uu.id==97,"new controls have appended disk IDs");
 depth.data=reinterpret_cast<PF_Pixel*>(dep.data());number("Branco: proximo (m)",.3);number("Preto: distante (m)",1000);number("Foco (m)",.3);number("Fatias",30);
 for(int y=0;y<40;y++)for(int x=0;x<64;x++){src[y*64+x]=x<32?PF_PixelFloat{1,.8f,.2f,.05f}:PF_PixelFloat{1,.1f,.2f,.4f};float d=float(x)/63;dep[y*64+x]={1,d,d,d};}
 for(int engine:{1,2})for(int mode:{1,2,3}){popup("Motor",engine);popup("Composicao de profundidade",mode);require(effect(PF_Cmd_SMART_RENDER,&in,&out,nullptr,nullptr,&extra)==0,"opaque depth modes render");bool opaque=true;for(auto c:dst)opaque&=fabsf(c.alpha-1)<.00001f&&std::isfinite(c.red)&&std::isfinite(c.green)&&std::isfinite(c.blue);require(opaque,"opaque alpha survives depth split and frame edges");}
 auto fullDepth=dst;params[find("Normalizar mapa")].u.bd.value=1;
 for(int y=0;y<40;y++)for(int x=0;x<64;x++){float d=.2f+.6f*float(x)/63;dep[y*64+x]={1,d,d,d};}
 require(effect(PF_Cmd_SMART_RENDER,&in,&out,nullptr,nullptr,&extra)==0,"AE normalize compressed map");float normDiff=0;for(int i=0;i<int(dst.size());i++){normDiff=std::max(normDiff,fabsf(dst[i].red-fullDepth[i].red));normDiff=std::max(normDiff,fabsf(dst[i].green-fullDepth[i].green));normDiff=std::max(normDiff,fabsf(dst[i].blue-fullDepth[i].blue));}require(normDiff<.002f,"AE normalized compressed map matches full range");
 auto normCPU=dst;popup("Motor",1);require(effect(PF_Cmd_SMART_RENDER,&in,&out,nullptr,nullptr,&extra)==0,"AE normalized CUDA render");normDiff=0;for(int i=0;i<int(dst.size());i++)normDiff=std::max(normDiff,fabsf(dst[i].red-normCPU[i].red));require(normDiff<.002f,"AE normalized CPU CUDA agreement");
 number("Curva do depth",2);popup("Distribuicao do depth",2);require(effect(PF_Cmd_SMART_RENDER,&in,&out,nullptr,nullptr,&extra)==0,"AE curve and linear distance render");params[find("Normalizar mapa")].u.bd.value=0;number("Curva do depth",1);popup("Distribuicao do depth",1);number("Branco: proximo (m)",.8);number("Preto: distante (m)",10);number("Foco (m)",.8);
 depth.data=reinterpret_cast<PF_Pixel*>(dep.data());for(int y=0;y<40;y++)for(int x=0;x<64;x++){float d=x<32?1.f:0.f;dep[y*64+x]={1,d,d,d};src[y*64+x]=x<32?PF_PixelFloat{1,0,1,0}:PF_PixelFloat{1,.1f,.1f,.5f};}popup("Composicao de profundidade",2);number("Grow (px)",3);number("Feather (px)",1);require(effect(PF_Cmd_SMART_RENDER,&in,&out,nullptr,nullptr,&extra)==0,"pixel grow and feather");if(argc<=2)require(backend()==1,"depth cut CUDA kernel");params[find("Depth em metros (mapa / Cut)")].u.bd.value=1;number("Cut",3);number("Foco (m)",2);for(int y=0;y<40;y++)for(int x=0;x<64;x++){float m=x<32?2.f:8.f;dep[y*64+x]={1,m,m,m};}require(effect(PF_Cmd_SMART_RENDER,&in,&out,nullptr,nullptr,&extra)==0,"metric depth and Cut SDK render");if(argc<=2)require(backend()==1,"metric Cut CUDA kernel");params[find("Depth em metros (mapa / Cut)")].u.bd.value=0;number("Cut",.5);number("Foco (m)",.8);depth.data=nullptr;number("Grow (px)",0);number("Feather (px)",0);params[find("Depth da imagem se camada vazia")].u.bd.value=1;popup("Canal",4);require(effect(PF_Cmd_SMART_RENDER,&in,&out,nullptr,nullptr,&extra)==0,"source alpha depth fallback");params[find("Depth da imagem se camada vazia")].u.bd.value=0;popup("Canal",1);
 require(pixelCheckouts==pixelCheckins,"all SmartFX layer pixels checked in");
 popup("Composicao de profundidade",1);for(auto& c:src)c={0,0,0,0};for(int y=14;y<26;y++)for(int x=26;x<38;x++)src[y*64+x]={1,.5f,.8f,.2f};
 for(int bits: {8,16}){
  smartInput.bitdepth=bits;
  std::vector<PF_Pixel8> src8(64*40),dst8(src8.size());std::vector<PF_Pixel16> src16(64*40),dst16(src16.size());
  for(int i=0;i<64*40;i++){auto c=src[i];src8[i]={A_u_char(c.alpha*255),A_u_char(c.red*255),A_u_char(c.green*255),A_u_char(c.blue*255)};src16[i]={A_u_short(c.alpha*32768),A_u_short(c.red*32768),A_u_short(c.green*32768),A_u_short(c.blue*32768)};}
  input.data=bits==8?reinterpret_cast<PF_Pixel*>(src8.data()):reinterpret_cast<PF_Pixel*>(src16.data());output.data=bits==8?reinterpret_cast<PF_Pixel*>(dst8.data()):reinterpret_cast<PF_Pixel*>(dst16.data());input.rowbytes=output.rowbytes=64*(bits==8?sizeof(PF_Pixel8):sizeof(PF_Pixel16));input.world_flags=output.world_flags=bits==16?PF_WorldFlag_DEEP:0;
  require(effect(PF_Cmd_SMART_RENDER,&in,&out,nullptr,nullptr,&extra)==0,"8/16-bit SmartFX render");
  double alpha=bits==8?dst8[20*64+26].alpha/255.:dst16[20*64+26].alpha/32768.;require(alpha>0&&alpha<1,"integer alpha blurs");
  params[0].u.ld=input;params[find("Camada Depth")].u.ld=depth;std::vector<PF_ParamDef*> all;for(auto& param:params)all.push_back(&param);
  require(effect(PF_Cmd_RENDER,&in,&out,all.data(),&output,nullptr)==0,"8/16-bit classic render");
 }
 if(argc>2)require(!GetModuleHandleA("optica_cuda.dll"),"CPU fallback without CUDA library");
 std::printf("PASS: %d assertions; %zu parameters; CPU/CUDA max diff %.8f\n",checks,params.size(),maxDiff);return 0;}


