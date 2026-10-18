"""Private command-line renderer; no HTTP server, remote URL or Comfy frontend dependency."""
from pathlib import Path
import base64
from dataclasses import asdict
import json
import os
import sys
import time
import traceback
import numpy as np

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "_engine"))


def launch(playwright, choice):
    args = ["--enable-webgl", "--ignore-gpu-blocklist"]
    choices = ["msedge", "chrome", None] if choice == "auto" else [{"edge": "msedge", "chrome": "chrome", "chromium": None}[choice]]
    errors = []
    for channel in choices:
        try:
            return playwright.chromium.launch(channel=channel, headless=True, args=args), channel or "chromium"
        except Exception as exc:
            errors.append(str(exc))
    raise RuntimeError("No working browser. Install Chromium with your ComfyUI Python: python -m playwright install chromium. " + "\n".join(errors)[-1800:])


def main(folder, browser_choice):
    from playwright.sync_api import sync_playwright
    from optics.core import Settings
    from optics.preview import kernel
    loaded = np.load(folder / "input.npz", allow_pickle=False)
    images, depth = loaded["image"], loaded["depth"]
    n, h, w, _ = images.shape
    raw = json.loads((folder / "settings.json").read_text(encoding="utf-8"))
    raw.pop("samples", None)
    samples = json.loads((folder / "settings.json").read_text(encoding="utf-8")).get("samples", 256)
    settings = Settings.parse(raw)
    atlas = kernel(settings, w/h, int(samples), 4096)
    extra_defaults = {"bokeh_gain": 1, "highlight_gain": 0, "spherical3": 0, "spherical5": 0, "k1": 0, "k2": 0, "p1": 0, "p2": 0, "master_blend": 1, "apodization": 0, "rim_gain": 0, "ca_red": 0, "ca_blue": 0, "ca_axial": 0}
    uniforms = {**extra_defaults, **asdict(settings), **raw}
    errors = []
    started = time.monotonic()
    with sync_playwright() as p:
        browser, channel = launch(p, browser_choice)
        try:
            page = browser.new_page()
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.set_content('<html><body><canvas id="output"></canvas></body></html>')
            for script in ["quality.js", "depth-utils.js", "physical-distortion.js", "reflected-ghosts.js", "filter-stack.js", "gpu.js", "bridge.js"]:
                page.add_script_tag(path=str(ROOT / "renderer" / script))
            hardware = page.evaluate("setupRenderer", atlas)
            if any(x in hardware["renderer"].lower() for x in ["swiftshader", "llvmpipe", "software"]) and not os.environ.get("BRUXOS_WEBGL_ALLOW_SOFTWARE"):
                raise RuntimeError("Browser is using software WebGL: " + hardware["renderer"] + ". Enable hardware acceleration or choose edge/chrome.")
            output = []
            for i in range(n):
                payload = {"w": w, "h": h, "image": base64.b64encode(images[i].astype('<f4').tobytes()).decode('ascii'),
                    "depth": base64.b64encode(depth[0 if len(depth)==1 else i].astype('<f4').tobytes()).decode('ascii'),
                    "settings": uniforms, "samples": int(samples)}
                if (settings.physical_ghosts and settings.ghost_gain > 0) or uniforms.get("starburst_gain", 0) > 0:
                    from optics.ghosts import analyze
                    sources = page.evaluate("prepareFlare", payload)
                    families=[]; keys=[]
                    for source in (sources if settings.physical_ghosts and settings.ghost_gain > 0 else []):
                        uv=source['uv']
                        half=settings.sensor_mm*.4995
                        data=analyze(settings,field=(max(-half,min(half,(uv[0]-.5)*settings.sensor_mm)),max(-half,min(half,(.5-uv[1])*settings.sensor_mm*h/w))),distance_m=source['distance_m'],samples=1024,pair_limit=16)
                        keys.append(data['ghost_id'])
                        families.extend({**f,'flux_rgb':source['flux'],'source_uv':uv} for f in data['families'])
                    payload['ghosts']={'ghost_id':json.dumps([keys,sources]),'families':families,'samples':1024,'sources':sources}
                rendered = page.evaluate("renderImage", payload)
                rgba = np.frombuffer(base64.b64decode(rendered), dtype=np.uint8).reshape(h,w,4)
                output.append(rgba[..., :3].astype(np.float32) / 255)
            if errors:
                raise RuntimeError("; ".join(errors))
            np.save(folder / "output.npy", np.stack(output))
            info = {"engine": "Bruxos WebGL2 0.4.0 (desktop 1.2.17)", **hardware, "browser": channel, "batch": n, "width": w, "height": h,
                "samples": samples, "seconds": round(time.monotonic()-started,3), "depth": "red channel; relative or metric; current desktop depth mapping",
                "input": "sRGB float [0,1]", "output": "sRGB RGB float [0,1], 8-bit browser resolve", "atlas_trace": "CPU", "image_render": "WebGL2 GPU"}
            (folder / "info.json").write_text(json.dumps(info, ensure_ascii=False, indent=2), encoding="utf-8")
        finally:
            browser.close()


if __name__ == "__main__":
    folder = Path(sys.argv[1])
    try:
        main(folder, sys.argv[2])
    except Exception as exc:
        (folder / "error.txt").write_text(str(exc), encoding="utf-8")
        traceback.print_exc()
        sys.exit(1)
