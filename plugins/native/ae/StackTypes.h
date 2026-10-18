#pragma once
#include "Config.h"
// Separate ABI from the existing standalone/plugin renderer. All descriptors
// contain offsets into one packed allocation, never host pointers in a kernel.
struct StackPyramid {int edgeClamp=0,n=0,w[16]{},h[16]{},off[16]{};};
struct StackPlane {StackPyramid color;float distance=5;};
struct StackScene {Config config{};int start[4]{},count[4]{};int glitter=0,normalize=1,distortion=0;float glitterGain=1,glitterMean=0,distortionPixels=0;StackPyramid original,gate;};
