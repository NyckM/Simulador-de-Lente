"""Procedural lens-dirt texture (front element), deterministic from a seed.

Channels (uint8, 0..255):
  R  fingerprints and oily smears (ridges + haze)
  G  dust: specks, larger particles and lint fibres
  B  scratches: straight/curved scratches and circular cleaning marks
  A  fungus: branching hyphae colonies with soft cores
The texture is sharp, as the dirt is on the glass; defocus is applied at render
time from the aperture. Same bytes feed the GPU preview and the CPU reference.
"""
import math
from functools import lru_cache
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import gaussian_filter, zoom

SIZE = 1024


def _noise(rng, size, cells):
    g = rng.random((cells + 3, cells + 3))
    z = zoom(g, (size + 2) / g.shape[0], order=3)[:size, :size]
    return (z - z.min()) / max(np.ptp(z), 1e-9)


def _fbm(rng, size, base=6, octaves=4):
    out = np.zeros((size, size)); amp = 1.; tot = 0.
    for o in range(octaves):
        out += amp * _noise(rng, size, base * 2 ** o); tot += amp; amp *= .5
    return out / tot


def _fingerprints(rng, n):
    s = SIZE; yy, xx = (np.mgrid[:s, :s] + .5) / s
    warp_x = _fbm(rng, s, 5, 3) - .5; warp_y = _fbm(rng, s, 5, 3) - .5
    out = np.zeros((s, s))
    for _ in range(n):
        cx, cy = rng.uniform(.08, .92, 2)
        a = rng.uniform(.07, .14); b = a * rng.uniform(.62, .8); th = rng.uniform(0, math.pi)
        c, sn = math.cos(th), math.sin(th)
        dx, dy = xx - cx + warp_x * .03, yy - cy + warp_y * .03
        u = (c * dx + sn * dy) / a; v = (-sn * dx + c * dy) / b
        r = np.sqrt(u * u + v * v)
        # loop/whorl: ridges follow distorted ellipses, with a delta drift
        flow = _fbm(rng, s, 7, 3) - .5
        phase = r * rng.uniform(26, 34) + .9 * np.arctan2(v, u + .35) * rng.choice([0, 1]) + warp_x * 6 + flow * 5.5 + (u * .8) ** 2 * 3
        ridge = (.5 + .5 * np.cos(2 * math.pi * phase)) ** 2.2
        ridge *= np.clip((_noise(rng, s, 60) - .18) * 3, 0, 1)  # ridge breaks / pores
        pressure = np.clip(1.2 - r, 0, 1) ** .8 * (.55 + .45 * _noise(rng, s, 9))
        cut = 1 / (1 + np.exp(-(u * math.cos(rng.uniform(0, 6.3)) + v * math.sin(rng.uniform(0, 6.3)) + rng.uniform(.2, .9)) * 6))
        print_ = pressure * cut * (.35 + .65 * ridge)
        # smear: the print is dragged a little along one direction
        smear = gaussian_filter(print_, (rng.uniform(1, 5), rng.uniform(4, 14)))
        out = np.maximum(out, .7 * print_ + .45 * smear)
    haze = np.clip((_fbm(rng, s, 3, 4) - .55) * 2.4, 0, 1) ** 1.5 * .35
    return np.clip(out + haze, 0, 1)


def _dust(rng):
    s = SIZE; up = 2
    img = Image.new('L', (s * up, s * up), 0); d = ImageDraw.Draw(img)
    for count, rmin, rmax, val in ((900, .5, 1.6, (110, 255)), (140, 1.6, 4.5, (90, 230)), (18, 4.5, 11, (60, 170))):
        for _ in range(count):
            x, y = rng.uniform(0, s * up, 2); r = rng.uniform(rmin, rmax) * up
            rx, ry = r * rng.uniform(.7, 1.3), r * rng.uniform(.7, 1.3)
            d.ellipse([x - rx, y - ry, x + rx, y + ry], fill=int(rng.uniform(*val)))
    for _ in range(14):  # lint fibres
        x, y = rng.uniform(0, s * up, 2); a = rng.uniform(0, 6.3); pts = [(x, y)]
        for _ in range(int(rng.uniform(20, 60))):
            a += rng.normal(0, .25); x += math.cos(a) * 3 * up; y += math.sin(a) * 3 * up; pts.append((x, y))
        d.line(pts, fill=int(rng.uniform(90, 200)), width=max(1, int(up * rng.uniform(.6, 1.4))))
    a = np.asarray(img.resize((s, s), Image.LANCZOS), dtype=np.float64) / 255
    return np.clip(gaussian_filter(a, .5), 0, 1)


def _scratches(rng):
    s = SIZE; up = 2
    img = Image.new('L', (s * up, s * up), 0); d = ImageDraw.Draw(img)
    for _ in range(int(rng.integers(5, 12))):  # straight-ish scratches
        x, y = rng.uniform(0, s * up, 2); a = rng.uniform(0, 6.3); L = rng.uniform(.1, .5) * s * up; pts = []
        for t in np.linspace(0, 1, 40):
            a += rng.normal(0, .01); pts.append((x + math.cos(a) * L * t, y + math.sin(a) * L * t))
        d.line(pts, fill=int(rng.uniform(120, 255)), width=max(1, int(up * rng.uniform(.5, 1.3))))
    cx, cy = s * up / 2 + rng.normal(0, s * up * .05, 2)  # circular cleaning marks
    for _ in range(int(rng.integers(20, 45))):
        r = rng.uniform(.08, .7) * s * up; a0 = rng.uniform(0, 6.3); span = rng.uniform(.15, 1.1)
        box = [cx - r, cy - r, cx + r, cy + r]
        d.arc(box, math.degrees(a0), math.degrees(a0 + span), fill=int(rng.uniform(40, 140)), width=1)
    a = np.asarray(img.resize((s, s), Image.LANCZOS), dtype=np.float64) / 255
    vary = .45 + .55 * _noise(rng, s, 12)  # intensity varies along the strokes
    return np.clip(a * vary, 0, 1)


def _fungus(rng):
    s = SIZE; up = 2
    img = Image.new('L', (s * up, s * up), 0); d = ImageDraw.Draw(img)
    cores = []
    for _ in range(int(rng.integers(2, 4))):
        # colonies usually start near the rim of the element
        ang = rng.uniform(0, 6.3); rad = rng.uniform(.25, .46)
        cx, cy = (.5 + math.cos(ang) * rad) * s * up, (.5 + math.sin(ang) * rad) * s * up
        cores.append((cx / up, cy / up))
        stack = [(cx, cy, rng.uniform(0, 6.3), rng.uniform(60, 120) * up, 2.2 * up) for _ in range(int(rng.integers(5, 9)))]
        steps = 0
        while stack and steps < 4000:
            x, y, a, L, w = stack.pop(); n = max(2, int(L / (3 * up))); pts = [(x, y)]
            for _ in range(n):
                a += rng.normal(0, .22); x += math.cos(a) * 3 * up; y += math.sin(a) * 3 * up; pts.append((x, y)); steps += 1
                if rng.random() < .07 and L > 12 * up:
                    stack.append((x, y, a + rng.choice([-1, 1]) * rng.uniform(.4, 1.1), L * rng.uniform(.4, .7), max(1, w * .75)))
            d.line(pts, fill=int(rng.uniform(150, 255)), width=max(1, int(w)))
    a = np.asarray(img.resize((s, s), Image.LANCZOS), dtype=np.float64) / 255
    yy, xx = np.mgrid[:s, :s]
    for cx, cy in cores:
        a = np.maximum(a, .75 * np.exp(-((xx - cx) ** 2 + (yy - cy) ** 2) / (2 * rng.uniform(6, 14) ** 2)))
    return np.clip(gaussian_filter(a, .6), 0, 1)


@lru_cache(maxsize=4)
def generate(seed=1):
    seed = int(seed) % 100000
    rng = np.random.default_rng(seed * 7919 + 17)
    r = _fingerprints(np.random.default_rng(rng.integers(1 << 30)), int(rng.integers(3, 6)))
    g = _dust(np.random.default_rng(rng.integers(1 << 30)))
    b = _scratches(np.random.default_rng(rng.integers(1 << 30)))
    a = _fungus(np.random.default_rng(rng.integers(1 << 30)))
    out = np.stack([r, g, b, a], -1)
    out = np.uint8(np.clip(out, 0, 1) * 255 + .5)
    out.setflags(write=False)
    return out
