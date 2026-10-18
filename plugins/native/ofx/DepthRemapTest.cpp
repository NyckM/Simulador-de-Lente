#include "DepthRemap.h"
#include <cstdio>
#include <cstdlib>
#include <cstring>
static int checks=0;
static void test(bool ok,const char* message){if(!ok){printf("FAIL %s\n",message);exit(1);}checks++;}
int main(){Config s{};s.f[NEAR]=.8f;s.f[FAR]=10;s.f[DEPTHGAIN]=1;ExtraInputs e;
 std::vector<float> d{.2f,.5f,.8f},before=d;remapRelativeDepth(s,d,e,false,false,1,false);test(!memcmp(d.data(),before.data(),d.size()*sizeof(float)),"default retains exact map");
 remapRelativeDepth(s,d,e,false,true,1,false);test(d[0]==0&&fabsf(d[1]-.5f)<1e-6&&d[2]==1,"normalize compressed map");
 d={0,.25f,1};remapRelativeDepth(s,d,e,false,false,2,false);test(d[0]==0&&fabsf(d[1]-.0625f)<1e-6&&d[2]==1,"curve preserves endpoints and moves mids");
 d={.5f,.5f};remapRelativeDepth(s,d,e,false,true,1,false);test(d[0]==.5f&&d[1]==.5f,"constant map remains constant");
 s.f[CUT]=.5f;d={0,.5f,1};remapRelativeDepth(s,d,e,false,false,1,true);float meters=1/((1-d[1])/10+d[1]/.8f);test(fabsf(meters-5.4f)<1e-5&&fabsf(d[0])<1e-6&&fabsf(d[2]-1)<1e-6,"linear middle is midpoint in meters");test(fabsf(s.f[CUT]-d[1])<1e-6,"Cut follows linear distance conversion");
 d={2,5,10};before=d;remapRelativeDepth(s,d,e,true,true,2,true);test(!memcmp(d.data(),before.data(),d.size()*sizeof(float)),"metric values unaffected");
 s.f[DEPTHGAIN]=-2;s.f[DEPTHBIAS]=1;s.invert=1;d={.2f,.5f,.8f};remapRelativeDepth(s,d,e,false,true,1,false);test(fabsf(d[0])<1e-6&&fabsf(d[1]-.5f)<1e-6&&fabsf(d[2]-1)<1e-6,"negative gain and inversion have consistent order");
 s.f[DEPTHGAIN]=1;d={NAN,INFINITY,.2f,.8f};remapRelativeDepth(s,d,e,false,true,1,false);test(d[0]==0&&d[1]==0&&d[2]==0&&d[3]==1,"invalid depths excluded from normalization");
 e.layers[0].depth={.1f,.9f};d={.2f,.8f};remapRelativeDepth(s,d,e,false,true,1,false);test(e.layers[0].depth[0]==0&&e.layers[0].depth[1]==1,"layer map normalization independent");
 printf("PASS %d depth remap checks\n",checks);
}
