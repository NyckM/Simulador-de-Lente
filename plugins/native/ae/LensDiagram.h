#pragma once
#include "Engine.h"
struct LensPoint {double z,y;};
struct LensSurface {int id;double radius,thickness,diameter,index,z;bool stop;std::vector<LensPoint> outline;};
struct LensRay {int channel;bool transmitted;double energy;std::vector<LensPoint> points;};
struct LensDiagram {std::vector<LensSurface> surfaces;std::vector<LensRay> rays;double left,right,height,sensor,iris;int selected;std::string name;};
LensDiagram makeLensDiagram(OpticalSettings settings,double fstop,double focus,double filmback);
std::string lensDiagramJSON(const LensDiagram& diagram);
