#!/bin/bash
# Loads the plugin in the project's test OFX host: the CPU engine checks, then, when the bundle has the
# Metal kernels, the GPU checks (CPU/GPU agreement on the same frames).
# Usage: bash run-validation.command [path to BruxosdovfxDesfoque.ofx.bundle]
cd "$(dirname "$0")"
BUNDLE=${1:-/Library/OFX/Plugins/BruxosdovfxDesfoque.ofx.bundle}
PLUGIN="$BUNDLE/Contents/MacOS/BruxosdovfxDesfoque.ofx"
xattr -d com.apple.quarantine HostTest 2>/dev/null || true
chmod +x HostTest
echo "CPU engine:"
BRUXOS_DISABLE_METAL=1 ./HostTest "$PLUGIN" --cpu-fallback
cpu=$?
gpu=0
if [ -f "$BUNDLE/Contents/Resources/BruxosdovfxDesfoque.metallib" ]; then
 echo "Metal (GPU):"
 ./HostTest "$PLUGIN"
 gpu=$?
fi
exit $((cpu || gpu))
