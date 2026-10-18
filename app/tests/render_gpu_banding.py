"""Offscreen GPU regression using the app's actual GLSL, not a mock image.

Development-only: pip install moderngl. The scratch read/write reproduces the
WebGL pyramid numerically; this does not benchmark its GPU copy path or video.
"""
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import json
import re
import numpy as np
import moderngl
from PIL import Image, ImageDraw, ImageFont
from optics.core import Settings,get_lens
from optics.preview import kernel, focus_plane

ROOT = Path(__file__).resolve().parents[1]
SHADERS = (ROOT/'web/gpu.js').read_text(encoding='utf-8')
W, H = 640, 400


def shader(name):
    return re.search('const '+name+r'=`(.*?)`;', SHADERS, re.S).group(1)


def build_pyramid(ctx, light, gaussian):
    light.build_mipmaps(); light.filter = (moderngl.LINEAR_MIPMAP_LINEAR, moderngl.LINEAR)
    light.repeat_x = light.repeat_y = False
    if gaussian:
        p = ctx.program(vertex_shader=shader('VERT'), fragment_shader=shader('PYRAMID'))
        p['previous'].value = 4
        vao = ctx.vertex_array(p, [])
        w, h, level = W, H, 0
        light.use(4)
        while w > 1 or h > 1:
            nw, nh = max(1, w//2), max(1, h//2)
            scratch = ctx.texture((nw, nh), 4, dtype='f2')
            target = ctx.framebuffer([scratch]); target.use(); ctx.viewport = (0, 0, nw, nh)
            p['previousLevel'].value = level; p['previousTexel'].value = (1/w, 1/h)
            vao.render(vertices=3)
            light.write(target.read(components=4, dtype='f2'), level=level+1)
            target.release(); scratch.release()
            w, h, level = nw, nh, level+1


def render(ctx, taps, gaussian, settings, raw, depthmap=None, creative=True, gain=1., part=0, samples=None, return_rgba=False, probe=False,atlas_settings=None,channel_coverage=True):
    texture = ctx.texture((W, H), 4, raw.tobytes(), dtype='f4')
    light, base, high, low = [ctx.texture((W, H), 4, dtype='f2') for _ in range(4)]
    base_count=min(taps,samples or taps);source_unit=11 if part==1 else 10 if part==2 else 4
    source_texture=low if part==1 else high if part==2 else light
    fbo = ctx.framebuffer([light, base, high, low]); fbo.use(); ctx.viewport = (0, 0, W, H)
    pre = ctx.program(vertex_shader=shader('VERT'), fragment_shader=shader('PREFILTER'))
    pre['rawImage'].value = 0; pre['linearInput'].value = True; pre['highlightGain'].value = 0;pre['highlightThreshold'].value=settings.highlight_threshold;pre['shimmerThreshold'].value=settings.shimmer_threshold
    texture.use(0); ctx.vertex_array(pre, []).render(vertices=3)
    for item in (light, base):
        item.build_mipmaps(); item.filter = (moderngl.LINEAR_MIPMAP_LINEAR, moderngl.LINEAR)
        item.repeat_x = item.repeat_y = False
    build_pyramid(ctx, light, gaussian)
    for item in (high,low):build_pyramid(ctx,item,gaussian)
    high.use(10);low.use(11)
    data = kernel(atlas_settings or settings, aspect=W/H, taps=taps)
    atlas = ctx.texture_array((data['grid']*3, data['grid'], taps), 4,
                              np.asarray(data['atlas'], dtype='f4').reshape(3,taps,data['grid'],data['grid'],4).transpose(1,2,0,3,4).copy().tobytes(), dtype='f4')
    pupils = ctx.texture_array((data['grid']*3, data['grid'], taps), 4,
                               np.asarray(data['pupils'], dtype='f4').reshape(3,taps,data['grid'],data['grid'],4).transpose(1,2,0,3,4).copy().tobytes(), dtype='f4')
    for item in (atlas, pupils):
        item.filter = (moderngl.LINEAR, moderngl.LINEAR); item.repeat_x = item.repeat_y = False
    atlas.use(2); pupils.use(3); light.use(4); base.use(5)
    depth = ctx.texture((W, H), 1, (np.zeros((H, W), 'f4') if depthmap is None else np.asarray(depthmap,'f4')).tobytes(), dtype='f4'); depth.repeat_x=depth.repeat_y=False;depth.filter=(moderngl.LINEAR,moderngl.LINEAR);depth.use(1)
    program = ctx.program(vertex_shader=shader('VERT'), fragment_shader=shader('FRAG'))
    values = dict(sourceImage=source_unit, depthImage=1, originalImage=5, rayAtlas=2, pupilAtlas=3,
                  imageSize=(W, H), matrix=tuple(data['matrix']), lastZ=data['last_z'],
                  referenceZ=data['reference_z'], sourceM=settings.source_m,
                  focusShift=data['focus_calibration']['shift_mm'] if settings.ray_focus else 0,sourceFocus=focus_plane(settings.source_m,get_lens(settings)), sensorZ=focus_plane(settings.focus_m,get_lens(settings))+settings.filmback_mm+(data['focus_calibration']['shift_mm'] if settings.ray_focus else 0),
                  sensorMM=settings.sensor_mm, bokehGain=2., highlightGain=0., exposure=0.,
                  bokehDistortion=settings.bokeh_distortion,bokehDistortionColor=settings.bokeh_distortion_color,impression=settings.impression, astigmatismMM=settings.astigmatism_mm, swirl=.5, coma=.05, squeeze=1., diffusion=0., spherical3=.8, spherical5=-.1,
                  nearM=settings.near_m, farM=settings.far_m, k1=0., k2=0., p1=0., p2=0.,
                  footprint=2*W/settings.sensor_mm*2.2/np.sqrt(base_count), masterBlend=1.,
                  apodization=0., rimGain=0., irisMM=settings.iris_mm, atlasIrisMM=data['iris_mm'], irisMaxMM=data['max_iris_mm'], caRed=getattr(settings,"ca_red",0.), caBlue=getattr(settings,"ca_blue",0.),
                  caAxial=getattr(settings,"ca_axial",0.), shimmerAmount=settings.shimmer_amount,shimmerDepth=settings.shimmer_depth,shimmerSize=settings.shimmer_size,shimmerDensity=settings.shimmer_density,shimmerSeed=settings.shimmer_seed,shimmerThreshold=settings.shimmer_threshold,gridSize=data['grid'], ghostGain=0., diffractionGain=0.,
                  diffractionScale=1., irisRotation=0., airyRadius=0., irisBlades=7,
                  sampleCount=base_count, tapCount=taps,
                  highlightCount=min(taps,max(base_count,settings.highlight_quality)) if settings.highlight_detail else base_count,
                  partMode=part,coverageProbe=probe,highlightImage=10,fullLightImage=4,highlightThreshold=settings.highlight_threshold,
                  globalRayRadius=data['radius_mm'],globalRaySlope=data['max_slope'],
                  bokehDither=settings.bokeh_dither,ditherAmount=settings.dither_amount, hasDepth=depthmap is not None, invertDepth=settings.invert_depth,
                  depthGain=settings.depth_gain,depthBias=settings.depth_bias,depthChannel=0,scalarDepth=True,
                  sliceChannel=-1,sliceMode=False,compositeMode=False,compositeImage=5,
                  shimmerPrism=settings.shimmer_prism,shimmerNormalize=settings.shimmer_normalize,softenInternalCutoff=True)
    if not creative:
        values.update(bokehGain=gain,swirl=0.,coma=0.,spherical3=0.,spherical5=0.,footprint=gain*W/settings.sensor_mm*2.2/np.sqrt(base_count))
    if creative=="settings":
        values.update(bokehGain=gain,swirl=settings.swirl,coma=settings.coma,squeeze=settings.squeeze,diffusion=settings.diffusion,spherical3=getattr(settings,"spherical3",0.),spherical5=getattr(settings,"spherical5",0.),footprint=gain*W/settings.sensor_mm*2.2/np.sqrt(base_count))
    for name, value in values.items():
        if name in program:
            program[name].value = value
    output = ctx.texture((W, H), 4, dtype='f2'); target = ctx.framebuffer([output])
    target.use(); ctx.viewport = (0, 0, W, H)
    vao=ctx.vertex_array(program, [])
    effective_mode=settings.depth_mode
    if effective_mode=='auto':effective_mode='cut' if depthmap is not None and np.all((np.abs(depthmap)<1e-6)|(np.abs(np.asarray(depthmap)-1)<1e-6)) and settings.depth_gain==1 and settings.depth_bias==0 else 'slicing'
    eclipsed=bool(settings.eclipse_bokeh and depthmap is not None)
    program['eclipseCutMode'].value=effective_mode=='cut';program['eclipseSlices'].value=settings.depth_slices
    program['eclipseBokeh'].value=eclipsed;program['eclipseCut'].value=settings.depth_cut;program['eclipseFeather'].value=settings.depth_feather
    if depthmap is not None and effective_mode in ('slicing','cut'):
        composite=ctx.texture((W,H),4,dtype='f2');composite.repeat_x=composite.repeat_y=False
        composite_fbo=ctx.framebuffer([composite]);composite_fbo.use();composite_fbo.clear()
        maskprog=ctx.program(vertex_shader=shader('VERT'),fragment_shader=shader('DEPTHMASK'))
        maskvao=ctx.vertex_array(maskprog,[])
        maskvalues=dict(lightImage=source_unit,depthImage=1,guideImage=4,depthChannel=0,scalarDepth=True,
                        depthGain=settings.depth_gain,depthBias=settings.depth_bias,invertDepth=settings.invert_depth,
                        cutMode=effective_mode=='cut',eclipseBokeh=eclipsed,cutPosition=settings.depth_cut,
                        cutFeather=max(1e-5,settings.depth_feather))
        for name,value in maskvalues.items():
            if name in maskprog:maskprog[name].value=value
        count=2 if effective_mode=='cut' else settings.depth_slices
        for i in range(count):
            ctx.disable(moderngl.BLEND)
            layer=ctx.texture((W,H),4,dtype='f2');layer_fbo=ctx.framebuffer([layer]);layer_fbo.use()
            ctx.viewport=(0,0,W,H);maskprog['sliceDepth'].value=i/(count-1);maskprog['sliceWidth'].value=1/(count-1)
            light.use(4);source_texture.use(source_unit);depth.use(1);maskvao.render(vertices=3);build_pyramid(ctx,layer,True)
            layer.use(8);base.use(5);atlas.use(2);pupils.use(3);depth.use(1)
            composite_fbo.use();ctx.viewport=(0,0,W,H)
            program['sourceImage'].value=8;program['sliceMode'].value=True
            program['sliceBackground'].value=i==0;program['sliceDepth'].value=i/(count-1)
            ctx.enable(moderngl.BLEND);ctx.blend_func=(moderngl.ONE,moderngl.ONE if eclipsed else moderngl.ONE_MINUS_SRC_ALPHA)
            if i==0 or eclipsed or not channel_coverage:vao.render(vertices=3)
            else:
                for channel in range(3):
                    program['sliceChannel'].value=channel
                    composite_fbo.color_mask=(channel==0,channel==1,channel==2,channel==1);composite_fbo.use()
                    vao.render(vertices=3)
                composite_fbo.color_mask=(True,True,True,True);composite_fbo.use();program['sliceChannel'].value=-1
            layer_fbo.release();layer.release()
        ctx.disable(moderngl.BLEND);composite.use(9);light.use(4);base.use(5)
        program['sliceMode'].value=False;program['compositeMode'].value=True
        program['compositeImage'].value=9;program['sourceImage'].value=source_unit
        target.use();ctx.viewport=(0,0,W,H);vao.render(vertices=3)
    else:vao.render(vertices=3)
    linear = np.frombuffer(target.read(components=4, dtype='f4'), 'f4').reshape(H, W, 4).copy()
    if not return_rgba:linear=linear[...,:3]
    assert np.isfinite(linear).all() and (part==2 or probe or linear.max() > .01)
    assert ctx.error == 'GL_NO_ERROR', ctx.error
    return linear


def main():
    ctx = moderngl.create_standalone_context(require=330)
    settings = Settings(focus_m=.9, source_m=5, iris_mm=8.55, blades=7)
    raw = np.zeros((H, W, 4), 'f4'); raw[..., 3] = 1
    for x, y, color in [(95, 110, (400, 170, 30)), (320, 220, (120, 360, 500)),
                        (520, 285, (500, 110, 40))]:
        raw[y-1:y+2, x-1:x+2, :3] = color
    old = render(ctx, 64, False, settings, raw)
    dense = render(ctx, 256, False, settings, raw)
    new = render(ctx, 256, True, settings, raw)
    again = render(ctx, 256, True, settings, raw)
    np.testing.assert_array_equal(new, again)
    # The pyramid must preserve flat-field radiance, including lens transmission.
    flat = np.ones_like(raw); flat[..., :3] = .25
    focused = render(ctx, 256, True, Settings(focus_m=5, source_m=5, iris_mm=8.55), flat)
    baseline = render(ctx, 256, False, Settings(focus_m=5, source_m=5, iris_mm=8.55), flat)
    flat_error = float(np.max(np.abs(focused-baseline)))
    assert flat_error < .0005, flat_error
    canvas = Image.new('RGB', (3*W, H+90), '#101813'); draw = ImageDraw.Draw(canvas)
    font = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 18)
    for col, (title, image) in enumerate([('64 amostras · filtro anterior', old),
                                        ('256 amostras · filtro anterior', dense),
                                        ('256 amostras · pirâmide gaussiana', new)]):
        c = np.clip(image, 0, 1)
        encoded = np.where(c <= .0031308, c*12.92, 1.055*c**(1/2.4)-.055)
        canvas.paste(Image.fromarray(np.uint8(encoded*255)).transpose(Image.Transpose.FLIP_TOP_BOTTOM), (col*W, 40))
        draw.text((col*W+15, 8), title, font=font, fill='#b9efc8')
    draw.text((15, H+52), 'GLSL do app · HDR sintético · mesma exposição · sem depth · mesma saída ao repetir o frame', font=font, fill='#e0ece3')
    path = ROOT.parent/'Bokeh-GPU-0.7.6.png'; canvas.save(path)
    result = {'renderer': ctx.info['GL_RENDERER'], 'repeated_frame_identical': True,
              'focused_flat_max_error': flat_error,
              'path': str(path)}
    (ROOT.parent/'Bokeh-GPU-0.7.6.json').write_text(json.dumps(result, indent=2), encoding='utf-8')
    print(json.dumps(result))


if __name__ == '__main__':
    main()
