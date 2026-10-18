"""ComfyUI IMAGE -> WebGL2 -> IMAGE. Browser work runs in an isolated process."""
from pathlib import Path
import json
import os
import subprocess
import sys
import tempfile
import numpy as np
import torch

ROOT = Path(__file__).resolve().parent


class BruxosWebGLDepth:
    CATEGORY = "Bruxos/Optics"
    FUNCTION = "render"
    RETURN_TYPES = ("IMAGE", "STRING")
    RETURN_NAMES = ("image", "render_info")

    @classmethod
    def INPUT_TYPES(cls):
        from ._engine.optics.core import LENS_PROFILES
        def number(default, lo, hi, step=.01):
            return ("FLOAT", {"default": default, "min": lo, "max": hi, "step": step})
        return {"required": {
            "image": ("IMAGE",), "depth": ("IMAGE",),
            "focus_m": number(2, .3, 1000),
            "near_m": number(2, .3, 100), "far_m": number(5, .4, 1000),
            "invert_depth": ("BOOLEAN", {"default": False}),
            "iris_mm": number(8, .5, 80),
            "blades": ("INT", {"default": 7, "min": 0, "max": 32}),
            "bokeh_gain": number(1, .25, 6),
            "highlight_gain": number(0, 0, 8),
            "samples": ([64, 128, 256, 512, 1024], {"default": 256}),
            "depth_mode": (["slicing", "cut", "auto"],),
            "depth_slices": ("INT", {"default": 12, "min": 4, "max": 32}),
            "depth_cut": number(.5, 0, 1),
            "depth_feather": number(.02, 0, .2),
            "eclipse_bokeh": ("BOOLEAN", {"default": True}),
            "swirl": number(0, 0, 2),
            "astigmatism_mm": number(0, -6, 6),
            "browser": (["auto", "chromium", "edge", "chrome"],),
        }, "optional": {
            "depth_gain": number(1, -20, 20), "depth_bias": number(0, -10, 10),
            "advanced_settings": ("STRING", {"default": "{}", "multiline": True}),
            "lens_model": (list(LENS_PROFILES), {"default":"dgauss50"}),
            "edge_compensation": number(0, 0, 100),
            "focus_preservation": number(0, 0, 1),
            "focus_width": number(0.1, 0.001, 2),
            "foreground_blur": number(100, 0, 200),
            "background_blur": number(100, 0, 200),
            "bokeh_texture_rings": number(0, 0, 1),
            "bokeh_texture_grain": number(0, 0, 1),
            "bokeh_texture_scale": number(6, 0.5, 12),
            "bokeh_texture_rotation": number(0, 0, 360),
            "edge_compensation_limit": number(3, 0, 6),

            "physical_ghosts": ("BOOLEAN", {"default": False}),
            "ghost_gain": number(1, 0, 40),
            "coating_strength": number(0, 0, 1),
            "coating_nm": number(550, 400, 700),
            # 1.2.17: highlights, RealFlare-style sources, iris starburst, procedural lens dirt
            "highlight_recovery": number(0, 0, 8, .1),
            "flare_boost": number(8, 0, 20, .5),
            "flare_threshold": number(.8, 0, 100, .05),
            "flare_limit": ("INT", {"default": 4, "min": 1, "max": 32}),
            "starburst_gain": number(0, 0, 20, .05),
            "starburst_size": number(1, .1, 6, .05),
            "starburst_streaks": number(.35, 0, 1, .05),
            "lens_dirt_amount": number(0, 0, 1),
            "lens_dirt_seed": number(1, 1, 1000, 1),
            "lens_dirt_fingerprints": number(.7, 0, 2),
            "lens_dirt_dust": number(.6, 0, 2),
            "lens_dirt_scratches": number(.35, 0, 2),
            "lens_dirt_fungus": number(0, 0, 2),
            "lens_dirt_defocus": number(.35, 0, 4),
        }}

    def render(self, image, depth, browser="auto", advanced_settings="{}", **controls):
        from ._engine.optics.core import Settings
        if image.ndim != 4 or image.shape[-1] not in (3, 4):
            raise ValueError("image must be a ComfyUI IMAGE [batch,height,width,RGB/RGBA].")
        if depth.ndim != 4 or depth.shape[-1] not in (1, 3, 4):
            raise ValueError("depth must be an IMAGE; connect the image output of your depth node.")
        n, h, w, _ = image.shape
        if n < 1 or min(h, w) < 16 or h*w > 8388608 or max(h, w) > 8192:
            raise ValueError("Supported image: dimensions >=16, <=8192 per side, <=8 megapixels.")
        if depth.shape[1:3] != image.shape[1:3]:
            raise ValueError("Image and depth must have the same width and height. Resize depth first.")
        if depth.shape[0] not in (1, n):
            raise ValueError("Depth batch must contain one shared map or one map per image.")
        if not .2 <= w/h <= 5:
            raise ValueError("Supported aspect ratio: 0.2 to 5.")
        try:
            advanced = json.loads(advanced_settings)
        except Exception as exc:
            raise ValueError("advanced_settings must be a JSON object.") from exc
        if not isinstance(advanced, dict):
            raise ValueError("advanced_settings must be a JSON object.")
        extras = {"bokeh_gain", "highlight_gain", "spherical3", "spherical5", "k1", "k2", "p1", "p2", "master_blend", "apodization", "rim_gain", "ca_red", "ca_blue", "ca_axial", "drops_amount", "drops_depth", "drops_size", "drops_density", "drops_refraction", "drops_seed", "highlight_recovery", "flare_boost", "flare_threshold", "flare_limit", "starburst_gain", "starburst_size", "starburst_streaks"}
        unknown = set(advanced) - (set(Settings.__dataclass_fields__) | extras)
        if unknown:
            raise ValueError("Unknown advanced setting(s): " + ", ".join(sorted(unknown)))
        # Explicit widgets win over JSON; always trace the atlas with portable CPU code.
        settings = {**advanced, **controls, "ray_backend": "cpu", "ray_focus": True}
        Settings.parse(settings)
        limits = {"bokeh_gain": (.25,6), "highlight_gain": (0,8), "spherical3": (-6,6), "spherical5": (-6,6), "k1": (-1,1), "k2": (-1,1), "p1": (-1,1), "p2": (-1,1), "master_blend": (0,1), "apodization": (0,1), "rim_gain": (0,4), "ca_red": (-10,10), "ca_blue": (-10,10), "ca_axial": (-10,10), "drops_amount": (0,8), "drops_depth": (.3,1000), "drops_size": (1,200), "drops_density": (0,1), "drops_refraction": (0,200), "drops_seed": (1,1000), "highlight_recovery": (0,8), "flare_boost": (0,20), "flare_threshold": (0,100), "flare_limit": (1,32), "starburst_gain": (0,20), "starburst_size": (.1,6), "starburst_streaks": (0,1)}
        for key, (lo,hi) in limits.items():
            if key in settings and (isinstance(settings[key],bool) or not isinstance(settings[key],(int,float)) or not np.isfinite(settings[key]) or not lo <= settings[key] <= hi):
                raise ValueError(f"{key}: expected a finite number in [{lo},{hi}].")
        if settings.get("samples",256) not in (64,128,256,512,1024):
            raise ValueError("Unsupported sample count.")
        if browser not in ("auto","chromium","edge","chrome"):
            raise ValueError("Unknown browser.")
        rgb = image.detach().cpu().numpy().astype(np.float32)[..., :3]
        dep = depth.detach().cpu().numpy().astype(np.float32)[..., 0]
        if not np.isfinite(rgb).all() or not np.isfinite(dep).all():
            raise ValueError("Image/depth contains NaN or infinity.")
        if rgb.min() < 0 or rgb.max() > 1 or (settings.get("depth_units", "relative") != "meters" and (dep.min() < 0 or dep.max() > 1)) or (settings.get("depth_units") == "meters" and dep.min() <= 0):
            raise ValueError("Image must be in [0,1]; relative depth in [0,1]; metric depth must be positive metres.")
        with tempfile.TemporaryDirectory(prefix="bruxos-webgl-") as temp:
            folder = Path(temp)
            np.savez(folder / "input.npz", image=rgb, depth=dep)
            (folder / "settings.json").write_text(json.dumps(settings), encoding="utf-8")
            interpreter = os.environ.get("BRUXOS_WEBGL_PYTHON", sys.executable)
            args = [interpreter, str(ROOT / "worker.py"), str(folder), browser]
            worker_env = dict(os.environ)
            if os.environ.get("BRUXOS_WEBGL_PYTHON"):
                worker_env.pop("PYTHONHOME", None)
                worker_env.pop("PYTHONPATH", None)
            try:
                result = subprocess.run(args, env=worker_env, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=1800,
                    creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
            except subprocess.TimeoutExpired as exc:
                raise RuntimeError("WebGL render timed out after 30 minutes. Lower samples/image size.") from exc
            if result.returncode:
                error = (folder / "error.txt").read_text(encoding="utf-8") if (folder / "error.txt").exists() else result.stderr[-4000:]
                raise RuntimeError("Bruxos WebGL: " + error)
            pixels = np.load(folder / "output.npy", allow_pickle=False)
            if pixels.shape != (n, h, w, 3) or not np.isfinite(pixels).all():
                raise RuntimeError("Invalid browser render output.")
            info = (folder / "info.json").read_text(encoding="utf-8")
            return (torch.from_numpy(pixels.copy()), info)


class BruxosArtisticFilter:
    CATEGORY="Bruxos/Optics"
    FUNCTION="settings"
    RETURN_TYPES=("STRING",)
    RETURN_NAMES=("advanced_settings",)
    @classmethod
    def INPUT_TYPES(cls):
        from ._engine.optics.filters import KINDS
        def f(value,lo,hi):return ("FLOAT",{"default":value,"min":lo,"max":hi,"step":.01})
        return {"required":{
            "kind":(list(KINDS),),"amount":f(.35,0,1),
            "position_x":f(50,-100,200),"position_y":f(50,-100,200),
            "scale_percent":f(100,5,400),"rotation":f(0,-360,360),
            "radius":f(.04,.001,.3),"region":("BOOLEAN",{"default":False}),
            "count":("INT",{"default":4,"min":2,"max":8}),
            "shift":f(.04,-.5,.5)},
            "optional":{"prism_shift":f(.015,0,.1),"blur_radius":f(.04,0,.3),
                "prism_type":(["0 chromatic","1 triangular","2 wedge","3 faceted","4 linear replication","5 kaleidoscope","6 split","7 radial ring"],{"default":"0 chromatic"}),
                "edge_blur":f(.06,0,.3),"threshold":f(.7,0,20),"softness":f(.2,.001,5),
                "previous_settings":("STRING",{"default":"{}","multiline":True})}}
    def settings(self,kind,amount,position_x,position_y,scale_percent,rotation,radius,region,count,shift,previous_settings="{}",prism_shift=.015,blur_radius=.04,prism_type="0 chromatic",edge_blur=.06,threshold=.7,softness=.2):
        from ._engine.optics.filters import validate
        data=json.loads(previous_settings)
        if not isinstance(data,dict):raise ValueError("Settings must be an object.")
        data['filters']=validate([*data.get('filters',[]),dict(kind=kind,amount=amount,x=position_x/100,y=position_y/100,scale=scale_percent/100,rotation=rotation,radius=radius,region=region,count=count,shift=shift,prism_shift=prism_shift,blur_radius=blur_radius,prism_type=int(str(prism_type).split()[0]),edge_blur=edge_blur,threshold=threshold,softness=softness)])
        return (json.dumps(data),)
