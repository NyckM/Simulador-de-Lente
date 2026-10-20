#!/bin/bash
# Loads the plugin in the project's test OFX host and runs its CPU checks.
# Usage: bash run-validation.command [path to BruxosdovfxDesfoque.ofx.bundle]
cd "$(dirname "$0")"
BUNDLE=${1:-/Library/OFX/Plugins/BruxosdovfxDesfoque.ofx.bundle}
xattr -d com.apple.quarantine HostTest 2>/dev/null || true
chmod +x HostTest
./HostTest "$BUNDLE/Contents/MacOS/BruxosdovfxDesfoque.ofx" --cpu-fallback
