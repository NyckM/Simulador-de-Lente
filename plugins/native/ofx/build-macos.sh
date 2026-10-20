#!/usr/bin/env bash
# Resolve OFX for macOS: one universal bundle (Apple Silicon + Intel), CPU engine.
# macOS has no CUDA, so the CPU path renders every frame. OpenMP comes from
# ../ae/OmpRuntime.cpp, not libomp (see the comment there).
#
#   On a Mac (Xcode command line tools):   ./build-macos.sh
#   On Linux (cross build):                ZIG=/path/to/zig ./build-macos.sh
#     needs zig 0.13 (compiler + libc++), ld64.lld and llvm-lipo (LD64 / LIPO to override).
#
# OFX_INCLUDE  OpenFX headers (default ../../../../work/openfx/include, as build.cmd)
# BRUXOS_LANGUAGE  0 PT-BR, 1 EN, 2 ZH-CN (default 1)
# VERSION      bundle version (default 0.4.0)
# OUT          output folder (default bin/macos); package it with package_macos.py
set -euo pipefail
cd "$(dirname "$0")"
OFX_INCLUDE=${OFX_INCLUDE:-../../../../work/openfx/include}
BRUXOS_LANGUAGE=${BRUXOS_LANGUAGE:-1}
VERSION=${VERSION:-0.4.0}
OUT=${OUT:-bin/macos}
MIN_MACOS=11.0
NAME=BruxosdovfxDesfoque
SOURCES=(Plugin.cpp NativeEngine.cpp ../ae/StackEngine.cpp ../ae/LensCore.cpp ../ae/CpuEngine.generated.cpp)
FLAGS=(-O2 -std=c++17 -fvisibility=hidden -ffp-contract=off -DBRUXOS_LANGUAGE="$BRUXOS_LANGUAGE" -I../ae -I"$OFX_INCLUDE")
[ -f "$OFX_INCLUDE/ofxImageEffect.h" ] || { echo "OpenFX headers not found in $OFX_INCLUDE (set OFX_INCLUDE)" >&2; exit 1; }
OBJ="$OUT/obj"
mkdir -p "$OBJ/arm64" "$OBJ/x86_64"
printf '_OfxGetPlugin\n_OfxGetNumberOfPlugins\n_bruxos_layer_backend\n_bruxos_lens_diagram\n' >"$OBJ/exports.txt"

if [ "$(uname)" = Darwin ]; then
 compile(){ local arch=$1;shift;clang++ -arch "$arch" -mmacosx-version-min=$MIN_MACOS "$@";}
 OMP=(-Xclang -fopenmp)
 link(){ local arch=$1 out=$2;shift 2;clang++ -arch "$arch" -mmacosx-version-min=$MIN_MACOS -bundle -dead_strip -Wl,-exported_symbols_list,"$OBJ/exports.txt" "$@" -o "$out";}
 LIPO=${LIPO:-lipo}
else
 ZIG=${ZIG:-zig};LD64=${LD64:-ld64.lld};LIPO=${LIPO:-llvm-lipo}
 target(){ if [ "$1" = arm64 ];then echo aarch64-macos.$MIN_MACOS;else echo x86_64-macos.$MIN_MACOS;fi;}
 compile(){ local arch=$1;shift;"$ZIG" c++ -target "$(target "$arch")" "$@";}
 OMP=(-fopenmp)
 # zig's own linker has no -bundle or export list: take its libc++/libc++abi/compiler_rt and link with ld64.lld.
 link(){ local arch=$1 out=$2 libs zlib;shift 2
  echo 'int bruxos_probe(){return 0;}' >"$OBJ/probe.cpp"
  libs=$("$ZIG" build-lib -dynamic -target "$(target "$arch")" -lc++ "$OBJ/probe.cpp" -femit-bin="$OBJ/$arch/probe.dylib" --verbose-link 2>&1 | tr ' ' '\n' | grep -E '/lib(c\+\+|c\+\+abi|compiler_rt)\.a$')
  zlib=$("$ZIG" env | sed -n 's/.*"lib_dir": *"\([^"]*\)".*/\1/p')
  # shellcheck disable=SC2086
  "$LD64" -arch "$arch" -platform_version macos $MIN_MACOS $MIN_MACOS -bundle -dead_strip -adhoc_codesign -exported_symbols_list "$OBJ/exports.txt" "$@" $libs "$zlib/libc/darwin/libSystem.tbd" -o "$out";}
fi

# OmpRuntime.cpp forwards at most 64 captures to a parallel region: refuse to build past that.
for src in "${SOURCES[@]}";do
 compile arm64 "${FLAGS[@]}" "${OMP[@]}" -S -emit-llvm "$src" -o "$OBJ/regions.ll"
 most=$(grep -oE '__kmpc_fork_call\([^,]+, i32 [0-9]+' "$OBJ/regions.ll" | grep -oE '[0-9]+$' | sort -n | tail -1 || true)
 if [ "${most:-0}" -gt 64 ];then echo "$src: parallel region with $most captures, OmpRuntime.cpp supports 64" >&2;exit 1;fi
done

for arch in arm64 x86_64;do
 pids=()
 for src in "${SOURCES[@]}";do compile "$arch" "${FLAGS[@]}" "${OMP[@]}" -c "$src" -o "$OBJ/$arch/$(basename "$src" .cpp).o" & pids+=($!);done
 compile "$arch" -O2 -std=c++17 -fvisibility=hidden -c ../ae/OmpRuntime.cpp -o "$OBJ/$arch/OmpRuntime.o" & pids+=($!)
 for pid in "${pids[@]}";do wait "$pid";done
 objs=();for src in "${SOURCES[@]}" OmpRuntime.cpp;do objs+=("$OBJ/$arch/$(basename "$src" .cpp).o");done
 link "$arch" "$OBJ/$arch/$NAME.ofx" "${objs[@]}"
done

BUNDLE="$OUT/$NAME.ofx.bundle"
rm -rf "$BUNDLE";mkdir -p "$BUNDLE/Contents/MacOS" "$BUNDLE/Contents/Resources"
"$LIPO" -create "$OBJ/arm64/$NAME.ofx" "$OBJ/x86_64/$NAME.ofx" -output "$BUNDLE/Contents/MacOS/$NAME.ofx"
cp ../ae/bruxos_dirt.rgba "$BUNDLE/Contents/Resources/"
cat >"$BUNDLE/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
 <key>CFBundleDevelopmentRegion</key><string>en</string>
 <key>CFBundleExecutable</key><string>$NAME.ofx</string>
 <key>CFBundleIdentifier</key><string>com.bruxosdovfx.depthlens</string>
 <key>CFBundleInfoDictionaryVersion</key><string>6.0</string>
 <key>CFBundleName</key><string>$NAME</string>
 <key>CFBundlePackageType</key><string>BNDL</string>
 <key>CFBundleShortVersionString</key><string>$VERSION</string>
 <key>CFBundleVersion</key><string>$VERSION</string>
 <key>LSMinimumSystemVersion</key><string>$MIN_MACOS</string>
</dict>
</plist>
PLIST

# Universal test host, shipped in the package so the checks can run on any Mac (package_macos.py).
for arch in arm64 x86_64;do compile "$arch" -O2 -std=c++17 -I"$OFX_INCLUDE" HostTest.cpp -o "$OBJ/$arch/HostTest";done
"$LIPO" -create "$OBJ/arm64/HostTest" "$OBJ/x86_64/HostTest" -output "$OUT/HostTest"
if [ "$(uname)" = Darwin ];then
 codesign --force --sign - "$BUNDLE"
 if [ "${SKIP_TESTS:-0}" != 1 ];then "$OUT/HostTest" "$BUNDLE/Contents/MacOS/$NAME.ofx" --cpu-fallback | tee "$OUT/host-test-CPU.txt";fi
fi
echo "Built $BUNDLE"
