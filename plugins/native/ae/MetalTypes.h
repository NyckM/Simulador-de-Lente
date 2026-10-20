#pragma once
// Shared by the Metal kernels (MetalEngine.metal) and their hosts (MetalEngine.mm, MetalEmulation.cpp).
// A pyramid is one buffer holding every level; Levels describes it, like the CUDA Pyramid minus its pointer.
struct Levels {int n,w[16],h[16],off[16];};
// Pixel range of one dispatch: gather and the layer stack run in bands so no command buffer runs too long.
struct Span {int start,end;};
