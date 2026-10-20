#!/bin/bash
# Installs the Bruxosdovfx Resolve plugin in /Library/OFX/Plugins (asks for your password),
# then runs the OFX host checks against the installed copy.
set -euo pipefail
cd "$(dirname "$0")"
DEST=/Library/OFX/Plugins
BUNDLE=BruxosdovfxDesfoque.ofx.bundle
if pgrep -xq Resolve; then echo "Quit DaVinci Resolve first, then run this again."; exit 1; fi
echo "Installing $BUNDLE in $DEST"
sudo mkdir -p "$DEST"
sudo rm -rf "${DEST:?}/$BUNDLE"
sudo cp -R "$BUNDLE" "$DEST/"
sudo xattr -dr com.apple.quarantine "$DEST/$BUNDLE" 2>/dev/null || true
echo "Installed. Running the host checks..."
bash validation/run-validation.command "$DEST/$BUNDLE"
echo "Start DaVinci Resolve: Effects > OpenFX > Bruxosdovfx."
