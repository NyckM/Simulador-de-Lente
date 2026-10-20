#define NOMINMAX
#ifndef BRUXOS_PLUGIN_ID
#define BRUXOS_PLUGIN_ID "com.bruxosdovfx.depthlens"
#endif
#ifndef BRUXOS_PLUGIN_LABEL
#define BRUXOS_PLUGIN_LABEL "Bruxosdovfx Desfoque"
#endif
#include "ofxImageEffect.h"
#include "ofxParam.h"
#include "ofxMessage.h"
#include "Engine.h"
#include "Stack.h"
#include "DepthUnits.h"
#include "DepthRemap.h"
#include "Localization.generated.h"
#ifndef BRUXOS_EXTRA_LAYERS
#define BRUXOS_EXTRA_LAYERS 0
#endif
#include "Prescriptions.generated.h"
#include <algorithm>
#include <cmath>
#include <cstring>
#include <string>
#include <vector>
#include <stdexcept>
static OfxHost* host=nullptr;
static OfxPropertySuiteV1* prop=nullptr;
static OfxImageEffectSuiteV1* effect=nullptr;
static OfxParameterSuiteV1* param=nullptr;
static OfxMessageSuiteV1* messages=nullptr;
static void check(OfxStatus s){if(s!=kOfxStatOK)throw s;}
static void str(OfxPropertySetHandle p,const char* key,const char* v,int n=0){check(prop->propSetString(p,key,n,v));}
static void integer(OfxPropertySetHandle p,const char* key,int v,int n=0){check(prop->propSetInt(p,key,n,v));}
static void real(OfxPropertySetHandle p,const char* key,double v,int n=0){check(prop->propSetDouble(p,key,n,v));}
static std::string text(OfxPropertySetHandle p,const char* key,const char* fallback=""){char* v=nullptr;return prop->propGetString(p,key,0,&v)==kOfxStatOK&&v?v:fallback;}
static double getReal(OfxPropertySetHandle p,const char* key,double fallback=0,int i=0){double v;return prop->propGetDouble(p,key,i,&v)==kOfxStatOK?v:fallback;}
static int getInt(OfxPropertySetHandle p,const char* key,int fallback=0){int v;return prop->propGetInt(p,key,0,&v)==kOfxStatOK?v:fallback;}
static double value(const std::vector<double>& p,int id){return p[id];}
static int choice(const std::vector<double>& p,int id){return int(p[id])+1;}
static bool checked(const std::vector<double>& p,int id){return p[id]!=0;}
#include "RenderConfig.generated.h"
#include "PostBindings.h"
static OfxPropertySetHandle newParam(OfxParamSetHandle set,const char* type,const char* name,const char* label,const char* parent){OfxPropertySetHandle p;check(param->paramDefine(set,type,name,&p));str(p,kOfxPropLabel,bruxos_i18n::tr(label));if(parent&&*parent)str(p,kOfxParamPropParent,parent);return p;}
static void groupParam(OfxParamSetHandle set,const char* name,const char* label,const char* parent=""){auto p=newParam(set,kOfxParamTypeGroup,name,label,parent);integer(p,kOfxParamPropGroupOpen,strcmp(name,"LENS_GROUP")==0||strcmp(name,"FOCUS_GROUP")==0);}
static void doubleParam(OfxParamSetHandle set,const char* name,const char* label,double lo,double hi,double d,const char* parent){auto p=newParam(set,kOfxParamTypeDouble,name,label,parent);real(p,kOfxParamPropDefault,d);real(p,kOfxParamPropMin,lo);real(p,kOfxParamPropMax,hi);real(p,kOfxParamPropDisplayMin,lo);real(p,kOfxParamPropDisplayMax,hi);if(strcmp(name,"FOCUS")==0)real(p,kOfxParamPropDisplayMax,20);if(strcmp(name,"SOURCE_DISTANCE")==0)real(p,kOfxParamPropDisplayMax,30);}
static void intParam(OfxParamSetHandle set,const char* type,const char* name,const char* label,int d,const char* labels,const char* parent,bool animate){auto p=newParam(set,type,name,label,parent);integer(p,kOfxParamPropDefault,d);integer(p,kOfxParamPropAnimates,animate);if(labels){std::string options=bruxos_i18n::options(labels);size_t start=0;int n=0;for(;;){auto end=options.find('|',start);str(p,kOfxParamPropChoiceOption,options.substr(start,end-start).c_str(),n++);if(end==std::string::npos)break;start=end+1;}}}
static void buttonParam(OfxParamSetHandle set,const char* name,const char* label,const char* parent){newParam(set,kOfxParamTypePushButton,name,label,parent);}
#include "Params.generated.h"
struct Instance{OfxImageClipHandle source=nullptr,depth=nullptr,output=nullptr;OfxImageClipHandle extraClips[7]{};OfxParamHandle params[NUM_PARAMS]{};bool integral[NUM_PARAMS]{};};
static Instance* instance(OfxImageEffectHandle h){OfxPropertySetHandle p;check(effect->getPropertySet(h,&p));void* v=nullptr;check(prop->propGetPointer(p,kOfxPropInstanceData,0,&v));if(!v)throw std::runtime_error("Instancia OFX ausente");return static_cast<Instance*>(v);}
static std::vector<double> values(Instance& i,double time){std::vector<double> result(NUM_PARAMS);for(int n=0;n<NUM_PARAMS;n++)if(i.params[n]&&n!=RESET_PROFILE){if(i.integral[n]){int v=0;check(param->paramGetValueAtTime(i.params[n],time,&v));result[n]=v;}else{double v=0;check(param->paramGetValueAtTime(i.params[n],time,&v));result[n]=std::isfinite(v)?v:0;}}return result;}
static void setValue(Instance& i,int n,double v){if(i.integral[n])check(param->paramSetValue(i.params[n],int(v)));else check(param->paramSetValue(i.params[n],v));}
static void resetProfile(Instance& i,double t){auto p=values(i,t);auto spec=prescriptions[std::clamp(choice(p,PRESET)-1,0,presetCount-1)];setValue(i,SWIRL_PARAM,spec.swirl);setValue(i,COMA_PARAM,spec.coma);setValue(i,SPHERICAL3,spec.spherical);setValue(i,DISPERSION,spec.dispersion);double a=1,b=0,c=0,d=1,n=1;for(int k=0;k<spec.count;k++){auto s=surfaces[spec.offset+k];if(s.stop)break;double power=s.radius?(s.nd-n)/s.radius:0,cc=c-power*a,dd=d-power*b;a+=s.thickness/s.nd*cc;b+=s.thickness/s.nd*dd;c=cc;d=dd;n=s.nd;}setValue(i,FSTOP,std::max(.7,std::abs(spec.focal*a)/(2*spec.maxIris)));for(int k:{EDIT,INDEX_OFFSET,SPHERICAL5,IMPRESSION_PARAM,APOD_PARAM,RIM_PARAM,CA_RED,CA_BLUE,CA_AXIAL,DISTORTION1,DISTORTION2,HIGHLIGHT_GAIN,EXPOSURE_PARAM,SHIMMER_PARAM})setValue(i,k,0);for(int k:{CURVATURE,SPACING,DIAMETER,BOKEH_GAIN,BLEND_PARAM,SQUEEZE_PARAM})setValue(i,k,1);int blades[]={0,3,4,5,6,7,8,9,10,11,12,14,16,32};for(int k=0;k<14;k++)if(blades[k]==spec.blades)setValue(i,BLADES,k);}
struct Image{OfxPropertySetHandle handle=nullptr;char* data=nullptr;OfxRectI bounds{};int width=0,height=0,rowBytes=0,bits=0,components=4;bool premult=true;
 Image(OfxImageClipHandle clip,double t){check(effect->clipGetImage(clip,t,nullptr,&handle));try{void* v;check(prop->propGetPointer(handle,kOfxImagePropData,0,&v));data=static_cast<char*>(v);check(prop->propGetIntN(handle,kOfxImagePropBounds,4,&bounds.x1));rowBytes=getInt(handle,kOfxImagePropRowBytes);width=bounds.x2-bounds.x1;height=bounds.y2-bounds.y1;auto depth=text(handle,kOfxImageEffectPropPixelDepth);bits=depth==kOfxBitDepthFloat?32:depth==kOfxBitDepthShort?16:depth==kOfxBitDepthByte?8:0;if(!bits||!data||width<=0||height<=0)throw std::runtime_error("Formato de imagem OFX invalido");auto c=text(handle,kOfxImageEffectPropComponents);components=c==kOfxImageComponentAlpha?1:c==kOfxImageComponentRGBA?4:0;if(!components)throw std::runtime_error("OFX requer RGBA ou Alpha");premult=text(handle,kOfxImageEffectPropPreMultiplication,kOfxImagePreMultiplied)==kOfxImagePreMultiplied;}catch(...){effect->clipReleaseImage(handle);handle=nullptr;throw;}}
 ~Image(){if(handle)effect->clipReleaseImage(handle);}Image(const Image&)=delete;
 float4 read(int x,int y)const{if(x<bounds.x1||x>=bounds.x2||y<bounds.y1||y>=bounds.y2)return{};auto row=data+ptrdiff_t(y-bounds.y1)*rowBytes;int off=(x-bounds.x1)*components;float c[4]={0,0,0,1};for(int n=0;n<components;n++)c[n]=bits==32?reinterpret_cast<float*>(row)[off+n]:bits==16?reinterpret_cast<unsigned short*>(row)[off+n]/65535.f:reinterpret_cast<unsigned char*>(row)[off+n]/255.f;if(components==1)return{c[0],c[0],c[0],c[0]};return{c[0],c[1],c[2],c[3]};}
 void write(int x,int y,float4 v){auto row=data+ptrdiff_t(y-bounds.y1)*rowBytes;int off=(x-bounds.x1)*components;float c[]={v.x,v.y,v.z,v.w};for(int n=0;n<components;n++){float f=c[n];if(!std::isfinite(f))f=0;if(n==3)f=std::clamp(f,0.f,1.f);if(bits==32)reinterpret_cast<float*>(row)[off+n]=f;else if(bits==16)reinterpret_cast<unsigned short*>(row)[off+n]=static_cast<unsigned short>(std::clamp(f,0.f,1.f)*65535+.5f);else reinterpret_cast<unsigned char*>(row)[off+n]=static_cast<unsigned char>(std::clamp(f,0.f,1.f)*255+.5f);}}
};
static OfxStatus render(OfxImageEffectHandle h,OfxPropertySetHandle args){auto& i=*instance(h);double time=getReal(args,kOfxPropTime);if(effect->abort(h))return kOfxStatOK;Image input(i.source,time),output(i.output,time);if(input.width>8192||input.height>8192||size_t(input.width)*input.height>17000000)throw std::runtime_error("Limite: 8192 pixels por eixo / 17 megapixels");if(output.components!=4)throw std::runtime_error("Saida requer RGBA");OfxPropertySetHandle dp;check(effect->clipGetPropertySet(i.depth,&dp));std::unique_ptr<Image> depth;auto p=values(i,time);if(checked(p,USE_DEPTH)&&getInt(dp,kOfxImageClipPropConnected))depth=std::make_unique<Image>(i.depth,time);OfxPropertySetHandle sp;check(effect->clipGetPropertySet(i.source,&sp));double par=getReal(sp,kOfxImagePropPixelAspectRatio,1)*getReal(args,kOfxImageEffectPropRenderScale,1,1)/getReal(args,kOfxImageEffectPropRenderScale,1,0);auto prepared=prepare(p,{input.width,input.height},par,bool(depth)||(checked(p,USE_DEPTH)&&checked(p,DEPTH_FROM_SOURCE)));auto s=prepared.config;
 std::vector<float4> raw(size_t(s.w)*s.h),result;std::vector<float> map(raw.size());for(int y=0;y<s.h;y++){if(!(y%64)&&effect->abort(h))return kOfxStatOK;for(int x=0;x<s.w;x++){size_t n=size_t(y)*s.w+x;auto c=input.read(x+input.bounds.x1,y+input.bounds.y1);c.w=std::max(c.w,0.f);if(input.premult&&c.w>1e-7f){c.x/=c.w;c.y/=c.w;c.z/=c.w;}if(c.w<=1e-7f)c={};raw[n]=c;if(depth){int dx=depth->bounds.x1+int((x+.5)*depth->width/s.w),dy=depth->bounds.y1+int((y+.5)*depth->height/s.h);auto d=depth->read(dx,dy);if(depth->premult&&depth->components==4&&d.w>1e-7f){d.x/=d.w;d.y/=d.w;d.z/=d.w;}int ch=choice(p,CHANNEL);map[n]=ch==1?d.x:ch==2?d.y:ch==3?d.z:ch==4?d.w:d.x*.2126f+d.y*.7152f+d.z*.0722f;}}}

 auto scalar=[&](float4 d,bool premult){if(premult&&d.w>1e-7f){d.x/=d.w;d.y/=d.w;d.z/=d.w;}int ch=choice(p,CHANNEL);return ch==1?d.x:ch==2?d.y:ch==3?d.z:ch==4?d.w:d.x*.2126f+d.y*.7152f+d.z*.0722f;};
 if(s.depth&&!depth)for(size_t n=0;n<raw.size();n++)map[n]=scalar(raw[n],false);
 ExtraInputs extra;
 extra.depthEdgeSafe=true;extra.cutActualDepth=true;
 extra.focus=float(value(p,FOCUS));float resolution=float(getReal(args,kOfxImageEffectPropRenderScale,1,0));extra.cutGrow=float(value(p,CUT_GROW_PIXELS))*resolution;extra.cutFeather=float(value(p,CUT_FEATHER_PIXELS))*resolution;
#if BRUXOS_EXTRA_LAYERS
 extra.meters=checked(p,LAYER_UNITS);extra.glitter=checked(p,LAYER_A_GLITTER);extra.normalize=checked(p,GLITTER_NORMALIZE);extra.glitterGain=float(value(p,GLITTER_GAIN));extra.distortion=checked(p,LAYER_C_DISTORTION);extra.distortionPixels=float(value(p,LAYER_DISTORTION))*resolution;
 std::unique_ptr<Image> images[7];for(int n=0;n<7;n++){OfxPropertySetHandle props;check(effect->clipGetPropertySet(i.extraClips[n],&props));if(getInt(props,kOfxImageClipPropConnected))images[n]=std::make_unique<Image>(i.extraClips[n],time);}
 int distances[]={LAYER_A_DISTANCE,LAYER_B_DISTANCE,LAYER_C_DISTANCE};for(int j=0;j<3;j++){extra.layers[j].distance=float(value(p,distances[j]));if(!images[j*2])continue;extra.layers[j].image.resize(raw.size());if(images[j*2+1])extra.layers[j].depth.resize(raw.size());for(int y=0;y<s.h;y++)for(int x=0;x<s.w;x++){int n=y*s.w+x;auto& image=*images[j*2];auto c=image.read(x+input.bounds.x1,y+input.bounds.y1);c.w=std::max(0.f,c.w);if(image.premult&&c.w>1e-7f){c.x/=c.w;c.y/=c.w;c.z/=c.w;}if(c.w<=1e-7f)c={};extra.layers[j].image[n]=c;if(images[j*2+1]){auto& mapImage=*images[j*2+1];extra.layers[j].depth[n]=scalar(mapImage.read(x+input.bounds.x1,y+input.bounds.y1),mapImage.premult&&mapImage.components==4);}}}
 if(images[6]){extra.glitterMatte.resize(raw.size());auto& matte=*images[6];for(int y=0;y<s.h;y++)for(int x=0;x<s.w;x++){auto c=matte.read(x+input.bounds.x1,y+input.bounds.y1);extra.glitterMatte[y*s.w+x]=c.x*.2126f+c.y*.7152f+c.z*.0722f;}}
#endif
 if(extra.depthEdgeSafe&&s.cut)s.slices=std::clamp(int(value(p,SLICES)),4,32);
 remapRelativeDepth(s,map,extra,checked(p,DEPTH_METERS),checked(p,DEPTH_NORMALIZE),float(value(p,DEPTH_CURVE)),choice(p,DEPTH_DISTRIBUTION)==2);
 applyDepthUnits(s,map,extra,checked(p,DEPTH_METERS),int(value(p,SLICES)));
 auto post=postSettings(p);postRecover(post,raw);stackRender(s,raw,map,*prepared.atlas,extra,result,choice(p,ENGINE)==2);nativeFlare(post,s,*prepared.atlas,raw,map,result);postLook(post,s,*prepared.atlas,raw,map,result);postRender(post,s,*prepared.atlas,result);if(effect->abort(h))return kOfxStatOK;OfxRectI window=output.bounds;prop->propGetIntN(args,kOfxImageEffectPropRenderWindow,4,&window.x1);window.x1=std::max(window.x1,output.bounds.x1);window.y1=std::max(window.y1,output.bounds.y1);window.x2=std::min(window.x2,output.bounds.x2);window.y2=std::min(window.y2,output.bounds.y2);for(int y=window.y1;y<window.y2;y++)for(int x=window.x1;x<window.x2;x++){int sx=x-input.bounds.x1,sy=y-input.bounds.y1;float4 v{};if(sx>=0&&sx<s.w&&sy>=0&&sy<s.h)v=result[size_t(sy)*s.w+sx];output.write(x,y,v);}return kOfxStatOK;
}
static OfxStatus mainEntry(const char* action,const void* handle,OfxPropertySetHandle in,OfxPropertySetHandle out){auto h=(OfxImageEffectHandle)handle;try{
 if(!strcmp(action,kOfxActionLoad)){if(!host)return kOfxStatErrMissingHostFeature;prop=(OfxPropertySuiteV1*)host->fetchSuite(host->host,kOfxPropertySuite,1);effect=(OfxImageEffectSuiteV1*)host->fetchSuite(host->host,kOfxImageEffectSuite,1);param=(OfxParameterSuiteV1*)host->fetchSuite(host->host,kOfxParameterSuite,1);messages=(OfxMessageSuiteV1*)host->fetchSuite(host->host,kOfxMessageSuite,1);return prop&&effect&&param?kOfxStatOK:kOfxStatErrMissingHostFeature;}
 if(!strcmp(action,kOfxActionUnload))return kOfxStatOK;
 if(!strcmp(action,kOfxActionDescribe)){OfxPropertySetHandle p;check(effect->getPropertySet(h,&p));str(p,kOfxPropLabel,bruxos_i18n::tr(BRUXOS_PLUGIN_LABEL));str(p,kOfxImageEffectPluginPropGrouping,"Bruxosdovfx");str(p,kOfxImageEffectPropSupportedContexts,kOfxImageEffectContextFilter);str(p,kOfxImageEffectPropSupportedContexts,kOfxImageEffectContextGeneral,1);str(p,kOfxImageEffectPropSupportedPixelDepths,kOfxBitDepthFloat);str(p,kOfxImageEffectPropSupportedPixelDepths,kOfxBitDepthShort,1);str(p,kOfxImageEffectPropSupportedPixelDepths,kOfxBitDepthByte,2);integer(p,kOfxImageEffectPropSupportsTiles,0);integer(p,kOfxImageEffectPropSupportsMultiResolution,1);integer(p,kOfxImageEffectPropSupportsMultipleClipDepths,1);integer(p,kOfxImageEffectPropSupportsMultipleClipPARs,0);integer(p,kOfxImageEffectPropTemporalClipAccess,0);str(p,kOfxImageEffectPluginRenderThreadSafety,kOfxImageEffectRenderInstanceSafe);return kOfxStatOK;}
 if(!strcmp(action,kOfxImageEffectActionDescribeInContext)){for(const char* name:{"Source","Depth","Output"}){OfxPropertySetHandle p;check(effect->clipDefine(h,name,&p));str(p,kOfxImageEffectPropSupportedComponents,kOfxImageComponentRGBA);if(!strcmp(name,"Depth")){str(p,kOfxImageEffectPropSupportedComponents,kOfxImageComponentAlpha,1);integer(p,kOfxImageClipPropOptional,1);str(p,kOfxPropLabel,bruxos_i18n::tr("Depth externo"));}integer(p,kOfxImageEffectPropSupportsTiles,0);}
#if BRUXOS_EXTRA_LAYERS
for(const char* name:{"LayerA","LayerADepth","LayerB","LayerBDepth","LayerC","LayerCDepth","GlitterMatte"}){OfxPropertySetHandle p;check(effect->clipDefine(h,name,&p));str(p,kOfxImageEffectPropSupportedComponents,kOfxImageComponentRGBA);if(strstr(name,"Depth")||!strcmp(name,"GlitterMatte"))str(p,kOfxImageEffectPropSupportedComponents,kOfxImageComponentAlpha,1);integer(p,kOfxImageClipPropOptional,1);integer(p,kOfxImageEffectPropSupportsTiles,0);str(p,kOfxPropLabel,bruxos_i18n::tr(name));}
#endif
OfxParamSetHandle set;check(effect->getParamSet(h,&set));describeParams(set);return kOfxStatOK;}
 if(!strcmp(action,kOfxActionCreateInstance)){auto i=std::make_unique<Instance>();check(effect->clipGetHandle(h,"Source",&i->source,nullptr));check(effect->clipGetHandle(h,"Depth",&i->depth,nullptr));check(effect->clipGetHandle(h,"Output",&i->output,nullptr));OfxParamSetHandle set;check(effect->getParamSet(h,&set));
#if BRUXOS_EXTRA_LAYERS
const char* names[]={"LayerA","LayerADepth","LayerB","LayerBDepth","LayerC","LayerCDepth","GlitterMatte"};for(int n=0;n<7;n++)check(effect->clipGetHandle(h,names[n],&i->extraClips[n],nullptr));
#endif
for(int n=0;n<NUM_PARAMS;n++)if(paramNames[n]){OfxPropertySetHandle p;check(param->paramGetHandle(set,paramNames[n],&i->params[n],&p));i->integral[n]=text(p,kOfxParamPropType)!=kOfxParamTypeDouble;}OfxPropertySetHandle p;check(effect->getPropertySet(h,&p));check(prop->propSetPointer(p,kOfxPropInstanceData,0,i.get()));i.release();return kOfxStatOK;}
 if(!strcmp(action,kOfxActionDestroyInstance)){auto i=instance(h);OfxPropertySetHandle p;check(effect->getPropertySet(h,&p));check(prop->propSetPointer(p,kOfxPropInstanceData,0,nullptr));delete i;return kOfxStatOK;}
 if(!strcmp(action,kOfxImageEffectActionRender))return render(h,in);
 if(!strcmp(action,kOfxImageEffectActionGetRegionOfDefinition)){auto i=instance(h);OfxRectD r;check(effect->clipGetRegionOfDefinition(i->source,getReal(in,kOfxPropTime),&r));check(prop->propSetDoubleN(out,kOfxImageEffectPropRegionOfDefinition,4,&r.x1));return kOfxStatOK;}
 if(!strcmp(action,kOfxImageEffectActionGetRegionsOfInterest)){auto i=instance(h);
#if BRUXOS_EXTRA_LAYERS
const char* names[]={"LayerA","LayerADepth","LayerB","LayerBDepth","LayerC","LayerCDepth","GlitterMatte"};for(int n=0;n<7;n++){OfxPropertySetHandle cp;check(effect->clipGetPropertySet(i->extraClips[n],&cp));if(getInt(cp,kOfxImageClipPropConnected)){OfxRectD r;check(effect->clipGetRegionOfDefinition(i->extraClips[n],getReal(in,kOfxPropTime),&r));check(prop->propSetDoubleN(out,(std::string("OfxImageClipPropRoI_")+names[n]).c_str(),4,&r.x1));}}
#endif
for(auto pair:{std::make_pair(i->source,"Source"),std::make_pair(i->depth,"Depth")}){OfxPropertySetHandle cp;check(effect->clipGetPropertySet(pair.first,&cp));if(getInt(cp,kOfxImageClipPropConnected,1)){OfxRectD r;check(effect->clipGetRegionOfDefinition(pair.first,getReal(in,kOfxPropTime),&r));check(prop->propSetDoubleN(out,(std::string("OfxImageClipPropRoI_")+pair.second).c_str(),4,&r.x1));}}return kOfxStatOK;}
 if(!strcmp(action,kOfxImageEffectActionGetClipPreferences)){str(out,kOfxImageEffectPropPreMultiplication,kOfxImagePreMultiplied);return kOfxStatOK;}
 if(!strcmp(action,kOfxActionInstanceChanged)){auto name=text(in,kOfxPropName);if(text(in,kOfxPropChangeReason)==kOfxChangeUserEdited&&(name=="PRESET"||name=="RESET_PROFILE"))resetProfile(*instance(h),getReal(in,kOfxPropTime));return kOfxStatOK;}
 return kOfxStatReplyDefault;
 }catch(OfxStatus s){return s;}catch(const std::bad_alloc&){return kOfxStatErrMemory;}catch(const std::exception& e){if(messages)messages->message((void*)handle,kOfxMessageError,"Bruxosdovfx","%s",bruxos_i18n::tr(e.what()));return kOfxStatFailed;}catch(...){return kOfxStatFailed;}}
static void setHost(OfxHost* h){host=h;}
static OfxPlugin plugin={kOfxImageEffectPluginApi,1,BRUXOS_PLUGIN_ID,0,10,setHost,mainEntry};
#ifdef _WIN32
#define PLUGIN_EXPORT extern "C" __declspec(dllexport)
#else
#define PLUGIN_EXPORT extern "C" __attribute__((visibility("default")))
#endif
PLUGIN_EXPORT int OfxGetNumberOfPlugins(){return 1;}
PLUGIN_EXPORT OfxPlugin* OfxGetPlugin(int i){return i==0?&plugin:nullptr;}
