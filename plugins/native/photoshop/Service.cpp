#define NOMINMAX
#include "Engine.h"
#include "Prescriptions.generated.h"
#include <algorithm>
#include <cmath>
#include <cstring>
#include <stdexcept>
static double value(const std::vector<double>& p,int id){return p[id];}
static int choice(const std::vector<double>& p,int id){return int(p[id])+1;}
static bool checked(const std::vector<double>& p,int id){return p[id]!=0;}
#include "RenderConfig.generated.h"
#include "PostBindings.h"
#include "Limits.generated.h"
#include <winsock2.h>
#include <windows.h>
#include <sstream>
#include <chrono>
#pragma comment(lib,"ws2_32.lib")
constexpr size_t MAX_PIXELS=8388608,MAX_BODY=MAX_PIXELS*20+NUM_PARAMS*8+28;
static bool sendAll(SOCKET s,const char* p,size_t n){while(n){int k=send(s,p,int(std::min(n,size_t(1048576))),0);if(k<=0)return false;p+=k;n-=k;}return true;}
static void reply(SOCKET s,int status,const char* mime,const char* p,size_t n){std::ostringstream h;h<<"HTTP/1.1 "<<status<<(status==200?" OK":" Error")<<"\r\nContent-Type: "<<mime<<"\r\nContent-Length: "<<n<<"\r\nConnection: close\r\nCache-Control: no-store\r\nX-Content-Type-Options: nosniff\r\n\r\n";auto a=h.str();if(sendAll(s,a.data(),a.size()))sendAll(s,p,n);}
static void replyText(SOCKET s,int status,const std::string& str){reply(s,status,"text/plain; charset=utf-8",str.data(),str.size());}
static uint32_t u32(const char* p){uint32_t v;memcpy(&v,p,4);return v;}
static std::vector<float4> render(const std::vector<char>& b){
 if(b.size()<28||memcmp(b.data(),"BXPS",4)||u32(b.data()+4)!=1)throw std::runtime_error("Protocolo incompativel.");
 auto w=u32(b.data()+8),h=u32(b.data()+12),count=u32(b.data()+16),hasDepth=u32(b.data()+20);
 size_t pixels=size_t(w)*h; if(!w||!h||w>8192||h>8192||pixels>MAX_PIXELS||count!=NUM_PARAMS||hasDepth>1||u32(b.data()+24))throw std::runtime_error("Dimensoes ou parametros invalidos. Limite: 8 megapixels / 8192 por lado.");
 size_t offset=28+NUM_PARAMS*8,expected=offset+pixels*(hasDepth?20:16);if(b.size()!=expected)throw std::runtime_error("Buffer incompleto.");
 std::vector<double> p(NUM_PARAMS);memcpy(p.data(),b.data()+28,NUM_PARAMS*8);for(double v:p)if(!std::isfinite(v))throw std::runtime_error("Parametro nao finito.");
 for(auto a:limits){if(p[a.index]<a.lo||p[a.index]>a.hi||(a.integer&&p[a.index]!=std::floor(p[a.index])))throw std::runtime_error("Parametro fora do intervalo.");}
 std::vector<float4> input(pixels),out;std::vector<float> depth(pixels,0);memcpy(input.data(),b.data()+offset,pixels*16);if(hasDepth)memcpy(depth.data(),b.data()+offset+pixels*16,pixels*4);
 for(auto& c:input){if(!std::isfinite(c.x)||!std::isfinite(c.y)||!std::isfinite(c.z)||!std::isfinite(c.w))throw std::runtime_error("Pixels nao finitos.");c.w=std::clamp(c.w,0.f,1.f);}
 for(float& d:depth){if(!std::isfinite(d))throw std::runtime_error("Depth nao finito.");d=std::clamp(d,0.f,1.f);}
 auto prepared=prepare(p,{int(w),int(h)},1,hasDepth!=0);nativeRender(prepared.config,input,depth,*prepared.atlas,out,checked(p,ENGINE));nativeFlare(postSettings(p),prepared.config,*prepared.atlas,input,depth,out);postRender(postSettings(p),prepared.config,*prepared.atlas,out);
 // Engine outputs premultiplied RGBA; Photoshop Imaging uses straight RGBA.
 for(auto& c:out){if(c.w>1e-7f){c.x/=c.w;c.y/=c.w;c.z/=c.w;}else c={0,0,0,0};}
 return out;
}
static bool handle(SOCKET s){
 std::vector<char> data;data.reserve(16384);size_t end=std::string::npos;char chunk[16384];
 while(end==std::string::npos){int n=recv(s,chunk,sizeof(chunk),0);if(n<=0)return true;data.insert(data.end(),chunk,chunk+n);std::string headers(data.begin(),data.end());end=headers.find("\r\n\r\n");if(data.size()>32768&&end==std::string::npos){replyText(s,431,"Cabecalho grande demais.");return true;}}
 std::string headers(data.begin(),data.begin()+end);std::istringstream lines(headers);std::string line;std::getline(lines,line);if(!line.empty()&&line.back()=='\r')line.pop_back();std::istringstream first(line);std::string method,path,version;first>>method>>path>>version;
 size_t length=0;bool authorized=false,hasLength=false,origin=false,transfer=false;
 while(std::getline(lines,line)){if(!line.empty()&&line.back()=='\r')line.pop_back();auto colon=line.find(':');if(colon==std::string::npos)continue;std::string key=line.substr(0,colon),val=line.substr(colon+1);for(char& c:key)c=char(std::tolower(static_cast<unsigned char>(c)));val.erase(0,val.find_first_not_of(" \t"));
  if(key=="x-bruxos-plugin")authorized=val=="Photoshop-1";
  if(key=="content-length"){if(hasLength||val.empty()||val.find_first_not_of("0123456789")!=std::string::npos){replyText(s,400,"Content-Length invalido.");return true;}try{length=std::stoull(val);hasLength=true;}catch(...){replyText(s,400,"Content-Length invalido.");return true;}}
  if(key=="origin")origin=!(val.rfind("uxp://",0)==0||val.rfind("plugin://",0)==0);
  if(key=="transfer-encoding")transfer=true;
 }
 if(!authorized||origin){replyText(s,403,"Acesso permitido apenas ao painel Photoshop.");return true;}
 if(transfer||length>MAX_BODY){replyText(s,413,"Corpo nao suportado ou grande demais.");return true;}
 if(method=="GET"&&path=="/api/info"){std::string info="{\"plugin\":\"BruxosdovfxPhotoshop\",\"version\":\"0.2.1\",\"protocol\":1,\"presets\":295,\"parameterCount\":105,\"maxPixels\":8388608}";reply(s,200,"application/json",info.data(),info.size());return true;}
 if(method=="POST"&&path=="/api/quit"){replyText(s,200,"Motor encerrado.");return false;}
 if(method!="POST"||path!="/api/render"){replyText(s,404,"Rota inexistente.");return true;}
 if(!hasLength){replyText(s,411,"Content-Length obrigatorio.");return true;}
 size_t begin=end+4;if(data.size()-begin>length){replyText(s,400,"Corpo invalido.");return true;}
 std::vector<char> body(data.begin()+begin,data.end());body.reserve(length);while(body.size()<length){int n=recv(s,chunk,int(std::min(sizeof(chunk),length-body.size())),0);if(n<=0)return true;body.insert(body.end(),chunk,chunk+n);}
 try{auto out=render(body);reply(s,200,"application/octet-stream",reinterpret_cast<const char*>(out.data()),out.size()*sizeof(float4));}catch(const std::exception& e){replyText(s,400,e.what());}catch(...){replyText(s,500,"Erro interno no motor optico.");}
 return true;
}
int WINAPI WinMain(HINSTANCE,HINSTANCE,LPSTR,int){
 WSADATA wsa;if(WSAStartup(MAKEWORD(2,2),&wsa))return 1;SOCKET listener=socket(AF_INET,SOCK_STREAM,IPPROTO_TCP);if(listener==INVALID_SOCKET){WSACleanup();return 2;}
 BOOL exclusive=TRUE;setsockopt(listener,SOL_SOCKET,SO_EXCLUSIVEADDRUSE,reinterpret_cast<const char*>(&exclusive),sizeof(exclusive));sockaddr_in address{};address.sin_family=AF_INET;address.sin_port=htons(8769);address.sin_addr.s_addr=htonl(INADDR_LOOPBACK);
 if(bind(listener,reinterpret_cast<sockaddr*>(&address),sizeof(address))||listen(listener,4)){closesocket(listener);WSACleanup();return 3;}
 bool running=true;auto active=std::chrono::steady_clock::now();while(running){fd_set set;FD_ZERO(&set);FD_SET(listener,&set);timeval timeout{30,0};int ready=select(0,&set,nullptr,nullptr,&timeout);if(ready<0)break;if(!ready){if(std::chrono::steady_clock::now()-active>std::chrono::minutes(30))break;continue;}SOCKET client=accept(listener,nullptr,nullptr);if(client==INVALID_SOCKET)continue;DWORD receive=30000,sendTimeout=120000;setsockopt(client,SOL_SOCKET,SO_RCVTIMEO,reinterpret_cast<char*>(&receive),sizeof(receive));setsockopt(client,SOL_SOCKET,SO_SNDTIMEO,reinterpret_cast<char*>(&sendTimeout),sizeof(sendTimeout));try{running=handle(client);}catch(...){replyText(client,500,"Erro no protocolo.");}closesocket(client);active=std::chrono::steady_clock::now();}
 closesocket(listener);WSACleanup();return 0;
}
