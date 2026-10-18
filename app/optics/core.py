"""Sequential spherical, cylindrical and aspheric refraction in millimetres.

Original implementation; prescription from LensSim (see data/LICENSE-LensSim.txt).
Positive z travels from scene to sensor. nd denotes the medium AFTER a surface.
This is geometric optics, not a wave-optics or non-sequential reflection solver.
"""
from dataclasses import dataclass, asdict, replace
from functools import lru_cache
from pathlib import Path
import json
import math
import numpy as np
from scipy.signal import fftconvolve
from scipy.ndimage import gaussian_filter

from .aperture import mask_image, mask_coverage
from . import materials, geometry

DATA = Path(__file__).resolve().parents[1] / 'data'
LENS_PROFILES=json.loads((DATA/'lens_profiles.json').read_text(encoding='utf-8'))


@dataclass
class Settings:
    lens_edits: tuple = ()
    lens_model: str = 'dgauss50'
    field_grid: int = 5
    ray_backend: str = "auto"
    ray_focus: bool = False
    physical_distortion: bool = False
    physical_ghosts: bool = False
    focus_m: float = 2.0
    foreground_blur: float = 100.0
    background_blur: float = 100.0
    focus_preservation: float = 0.0
    focus_width: float = .1
    source_m: float = 5.0
    iris_mm: float = 6.0
    sensor_mm: float = 36.0
    filmback_mm: float = 0.0
    blades: int = 7
    rotation: float = 0.0
    soften_internal_cutoff: bool = True
    iris_softness: float = 0.0
    aperture_mask: str = ''
    aperture_custom: bool = False
    aperture_invert: bool = False
    dispersion: float = 0.0
    impression: float = 0.0
    bokeh_texture_rings: float = 0.0
    bokeh_texture_grain: float = 0.0
    bokeh_texture_scale: float = 6.0
    bokeh_texture_rotation: float = 0.0
    bokeh_distortion: float = 0.0
    bokeh_distortion_color: float = .25
    filters: tuple = ()
    diffusion: float = 0.0
    diffusion_region: bool = False
    diffusion_x: float = .5
    diffusion_y: float = .5
    diffusion_scale: float = 1.0
    diffusion_scale_x: float = 1.0
    diffusion_scale_y: float = 1.0
    diffusion_rotation: float = 0.0
    diffusion_pivot_x: float = 0.0
    diffusion_pivot_y: float = 0.0
    diffusion_reach: float = 1.0
    lens_dirt_amount: float = 0.0
    lens_dirt_block: float = .2
    lens_dirt_scatter: float = 2.0
    lens_dirt_radius: float = 120.0
    lens_dirt_scale: float = 1.0
    lens_dirt_seed: float = 1.0
    lens_dirt_rotation: float = 0.0
    lens_dirt_threshold: float = .8
    lens_dirt_texture: str = ''
    lens_dirt_fingerprints: float = .7
    lens_dirt_dust: float = .6
    lens_dirt_scratches: float = .35
    lens_dirt_fungus: float = 0.0
    lens_dirt_defocus: float = .35

    coating_strength: float = 0.0
    coating_nm: float = 550.0
    ghost_gain: float = 0.0
    diffraction_gain: float = 0.0
    diffraction_scale: float = 1.0
    astigmatism_mm: float = 0.0
    swirl: float = 0.0
    vignette_amount: float = 0.0
    edge_compensation: float = 0.0
    edge_compensation_limit: float = 3.0
    coma: float = 0.0
    squeeze: float = 1.0
    exposure: float = 0.0
    near_m: float = 0.8
    far_m: float = 10.0
    invert_depth: bool = False
    depth_channel: str = 'r'
    depth_gain: float = 1.0
    depth_bias: float = 0.0
    depth_units: str = 'relative'
    depth_normalize: str = 'off'
    depth_low: float = 0.0
    depth_high: float = 1.0
    depth_curve: float = 1.0
    depth_mapping: str = 'inverse'
    shimmer_amount: float = 0.0
    shimmer_depth: float = 1.0
    shimmer_size: float = 8.0
    shimmer_density: float = .3
    shimmer_seed: float = 1.0
    shimmer_threshold: float = .6
    shimmer_prism: float = .25
    shimmer_normalize: bool = True
    eclipse_bokeh: bool = False
    depth_mode: str = 'auto'
    depth_slices: int = 12
    depth_cut: float = .5
    depth_feather: float = .02
    bokeh_dither: bool = False
    dither_amount: float = 1.0
    highlight_detail: bool = False
    highlight_quality: int = 128
    highlight_threshold: float = .8
    highlight_view: str = 'final'
    quality: str = 'preview'

    @classmethod
    def parse(cls, raw):
        s = cls(**{k: v for k, v in raw.items() if k in cls.__dataclass_fields__})
        if not isinstance(s.lens_model,str) or s.lens_model not in LENS_PROFILES:raise ValueError('Modelo de lente desconhecido.')
        if s.ray_backend not in ('auto','cpu','vulkan'):raise ValueError('Motor de raios desconhecido.')
        if isinstance(s.field_grid,bool) or s.field_grid not in (3,5,9):raise ValueError('Campo óptico: use 3, 5 ou 9 pontos por eixo.')
        from .filters import validate as validate_filters
        s.filters=validate_filters(s.filters)
        s.lens_edits = validate_lens_edits(s.lens_edits,s.lens_model)
        if not isinstance(s.aperture_custom,bool) or not isinstance(s.aperture_invert,bool):raise ValueError('Controles de abertura personalizada devem ser booleanos.')
        if not isinstance(s.aperture_mask,str):raise ValueError('Máscara de abertura inválida.')
        if s.aperture_mask:
            image=mask_image(s.aperture_mask)
            if s.aperture_custom and np.mean(1-image if s.aperture_invert else image)<1e-4:raise ValueError('A máscara bloqueia toda a luz. Use áreas brancas ou inverta a máscara.')
        elif s.aperture_custom:raise ValueError('Importe uma máscara de abertura primeiro.')
        if not isinstance(s.lens_dirt_texture,str):raise ValueError('Textura Lens Dirt inválida.')
        if s.lens_dirt_texture:mask_image(s.lens_dirt_texture)
        if not isinstance(s.diffusion_region,bool):raise ValueError('Região de difusão deve ser booleana.')
        limits = {'diffusion_x':(-1,2),'diffusion_y':(-1,2),'diffusion_scale':(.05,4),'diffusion_scale_x':(.05,4),'diffusion_scale_y':(.05,4),'diffusion_rotation':(-360,360),'diffusion_pivot_x':(-2,2),'diffusion_pivot_y':(-2,2),'diffusion_reach':(.1,4),'lens_dirt_amount':(0,1),'lens_dirt_block':(0,1),'lens_dirt_scatter':(0,8),'lens_dirt_radius':(10,360),'lens_dirt_scale':(.25,4),'lens_dirt_seed':(1,1000),'lens_dirt_rotation':(0,360),'lens_dirt_threshold':(0,20),'lens_dirt_fingerprints':(0,2),'lens_dirt_dust':(0,2),'lens_dirt_scratches':(0,2),'lens_dirt_fungus':(0,2),'lens_dirt_defocus':(0,4),'impression':(-1,1),'shimmer_amount':(0,8),'shimmer_depth':(.3,30),'shimmer_size':(2,80),'shimmer_density':(.05,1),'shimmer_seed':(1,1000),'shimmer_threshold':(0,20),'focus_m': (.3, 1000), 'source_m': (.3, 1000), 'iris_mm': (.5, 80),
                  'sensor_mm': (12, 44), 'filmback_mm': (-2, 2), 'blades': (0, 32),
                  'rotation': (0, 360), 'iris_softness': (0, .3), 'dispersion': (0, 2), 'diffusion': (0, .8),
                  'coating_strength': (0, 1), 'coating_nm': (400, 700),
                  'ghost_gain': (0, 40), 'diffraction_gain': (0, 10), 'diffraction_scale': (1, 20),
                  'foreground_blur': (0,200), 'background_blur': (0,200), 'focus_preservation': (0,1), 'focus_width': (.001,2), 'astigmatism_mm': (-6,6), 'swirl': (0, 2), 'vignette_amount': (0,1), 'edge_compensation': (0,100), 'edge_compensation_limit': (0,6), 'bokeh_texture_rings': (0,1), 'bokeh_texture_grain': (0,1), 'bokeh_texture_scale': (.5,12), 'bokeh_texture_rotation': (0,360), 'coma': (0, 2), 'squeeze': (1, 2),
                  'dither_amount': (0,4), 'highlight_threshold': (0,20), 'depth_gain': (-20,20), 'depth_bias': (-10,10), 'depth_cut': (0,1), 'depth_feather': (0,.2), 'depth_slices': (4,32), 'exposure': (-5, 5), 'near_m': (.3, 100), 'far_m': (.4, 1000)}
        for k, (lo, hi) in limits.items():
            v = float(getattr(s, k))
            if not math.isfinite(v) or not lo <= v <= hi:
                raise ValueError(f'{k}: valor fora de {lo}–{hi}.')
            setattr(s, k, v)
        if s.iris_mm>_model_lens(s.lens_model).max_iris+1e-6:raise ValueError('Íris acima da abertura deste modelo.')
        s.blades = int(s.blades)
        if s.blades in (1, 2):
            raise ValueError('A íris precisa de 0 (circular) ou 3–32 lâminas.')
        if s.far_m <= s.near_m:
            raise ValueError('A profundidade distante deve ser maior que a próxima.')
        if s.quality not in ('preview', 'final'):
            raise ValueError('Qualidade desconhecida.')
        if s.depth_channel not in ('r','g','b','a','luma') or s.depth_mode not in ('auto','continuous','slicing','cut'):
            raise ValueError('Canal ou modo de profundidade desconhecido.')
        if int(s.depth_slices) != s.depth_slices:
            raise ValueError('Use um número inteiro de fatias.')
        s.depth_slices=int(s.depth_slices)
        if s.depth_units not in ('relative','meters') or s.depth_normalize not in ('off','minmax','percentile','manual') or s.depth_mapping not in ('inverse','linear'):
            raise ValueError('Interpretação de depth inválida.')
        for key,lo,hi in [('depth_curve',.25,4),('depth_low',-1e6,1e6),('depth_high',-1e6,1e6)]:
            value=getattr(s,key)
            if isinstance(value,bool) or not isinstance(value,(int,float)) or not np.isfinite(value) or not lo<=value<=hi:raise ValueError('Valor de depth inválido: '+key)
        if s.depth_low>=s.depth_high:raise ValueError('Limite inferior do depth precisa ser menor que o superior.')
        for key in ('bokeh_distortion','bokeh_distortion_color'):
            value=getattr(s,key);upper=2 if key=='bokeh_distortion' else 1
            if isinstance(value,bool) or not isinstance(value,(int,float)) or not math.isfinite(value) or not 0<=value<=upper:raise ValueError('Deformação da luz: valor inválido para '+key)
        if not isinstance(s.shimmer_normalize,bool):raise ValueError('Normalizar glitter deve ser booleano.')
        if not isinstance(s.shimmer_prism,(int,float)) or isinstance(s.shimmer_prism,bool) or not np.isfinite(s.shimmer_prism) or not 0<=s.shimmer_prism<=1:raise ValueError('Cor prismática deve estar entre 0 e 1.')
        if not isinstance(s.eclipse_bokeh,bool):raise ValueError("Eclipsed bokeh: use verdadeiro ou falso.")
        if not isinstance(s.ray_focus,bool):raise ValueError('Compensação de foco deve ser booleana.')
        if not isinstance(s.physical_ghosts,bool):raise ValueError('Ghosts físicos devem ser booleanos.')
        if not isinstance(s.physical_distortion,bool):raise ValueError('Distorção física deve ser booleana.')
        s.invert_depth = bool(s.invert_depth)
        if not isinstance(s.soften_internal_cutoff, bool):
            raise ValueError('Soften Internal Cutoff: use verdadeiro ou falso.')
        if not isinstance(s.bokeh_dither,bool) or not isinstance(s.highlight_detail,bool):
            raise ValueError('Dither e Highlight Detail devem ser booleanos.')
        if isinstance(s.highlight_quality,bool) or s.highlight_quality not in (64,128,256,512,1024):
            raise ValueError('Highlight Quality: use 64, 128, 256, 512 ou 1024 amostras.')
        if s.highlight_view not in ('final','highlights','base','coverage'):
            raise ValueError('Highlight View desconhecida.')
        return s


def normalize(v):
    return v / np.maximum(np.linalg.norm(v, axis=-1, keepdims=True), 1e-20)


def aperture_coverage(margin, width):
    """Inward cubic edge taper; never admits rays outside a clear aperture.

    Width is in mm at this surface, independent of quality and frame number.
    Zero width retains the hard aperture. This numerical/creative taper is
    distinct from a coating or diffraction model.
    """
    margin, width = np.broadcast_arrays(np.asarray(margin), np.asarray(width))
    t = np.clip(np.divide(margin, width, out=np.zeros_like(margin, dtype=float), where=width > 0), 0, 1)
    return np.where(width > 0, t*t*(3-2*t), (margin >= 0).astype(float))


def refract(direction, normal, n1, n2):
    """Vector Snell and unpolarized Fresnel transmission; TIR is rejected."""
    normal = np.where((direction * normal).sum(-1, keepdims=True) > 0, -normal, normal)
    ci = -(direction * normal).sum(-1)
    eta = n1 / n2
    k = 1 - eta * eta * (1 - ci * ci)
    ct = np.sqrt(np.maximum(k, 0))
    outgoing = normalize(eta * direction + (eta * ci - ct)[:, None] * normal)
    rs = ((n1 * ci - n2 * ct) / np.maximum(n1 * ci + n2 * ct, 1e-20)) ** 2
    rp = ((n2 * ci - n1 * ct) / np.maximum(n2 * ci + n1 * ct, 1e-20)) ** 2
    return outgoing, k >= 0, 1 - .5 * (rs + rp)


def coated_transmission(ci, n1, n2, wavelength_um, design_nm):
    """Idealized single-layer quarter-wave coating, unpolarized s/p light.

    Film index is sqrt(n1*n2); no absorption or measured glass dispersion.
    Blend strength is applied by the caller as coated surface coverage.
    """
    ci=np.clip(np.asarray(ci),0,1)
    nfilm=np.sqrt(n1*n2)
    si2=np.maximum(0,1-ci*ci)
    cf=np.sqrt(np.maximum(0,1-(n1/nfilm)**2*si2))
    ct=np.sqrt(np.maximum(0,1-(n1/n2)**2*si2))
    phase=2*np.pi*nfilm*(design_nm*.001/(4*nfilm))*cf/wavelength_um
    wave=np.exp(2j*phase)
    reflect=[]
    for y0,yf,y2 in ((n1*ci,nfilm*cf,n2*ct),(n1/np.maximum(ci,1e-12),nfilm/np.maximum(cf,1e-12),n2/np.maximum(ct,1e-12))):
        a=(y0-yf)/np.maximum(y0+yf,1e-12)
        b=(yf-y2)/np.maximum(yf+y2,1e-12)
        reflect.append(np.abs((a+b*wave)/(1+a*b*wave))**2)
    return 1-np.asarray(reflect).mean(axis=0)


class Lens:
    def __init__(self, edits=(),model='dgauss50'):
        from .prescription import Prescription
        normalization_scale=1.
        profile=LENS_PROFILES[model]
        raw = json.loads((DATA / profile.get('prescription','dgauss50mm.json')).read_text())
        self.surfaces = [dict(s) for s in sorted(raw.values(), key=lambda x: x['index'])]
        if profile.get('prescription'):
            # Uniformly normalize an independent prescription to nominal EFL.
            self.z=np.cumsum([0.]+[row['thickness'] for row in self.surfaces[:-1]])
            self.max_iris=next(row['aperture_diameter']/2 for row in self.surfaces if row.get('is_stop'))
            p,d,valid,_,_=self.trace(np.array([[.001,0.,-1.]]),np.array([[0.,0.,1.]]),Settings())
            if not valid[0]:raise ValueError('Prescrição sem raio paraxial transmitido.')
            base_efl=-.001/(d[0,0]/d[0,2]);factor=profile['focal_mm']/base_efl;normalization_scale=factor
            for row in self.surfaces:
                for field in ('curvature_radius','thickness','aperture_diameter'):row[field]*=factor
        elif model!='dgauss50':
            factor=LENS_PROFILES[model]['focal_mm']/LENS.efl;normalization_scale=factor
            for surface in self.surfaces:
                for field in ('curvature_radius','thickness','aperture_diameter'):surface[field]*=factor
                if surface.get('is_stop'):surface['aperture_diameter']*=2.030153400195128/2
        if profile.get('prescription') and profile.get('nominal_f'):
            front=np.eye(2);n1=1.
            for row in self.surfaces:
                if row.get('is_stop'):
                    modeled_radius=abs(profile['focal_mm'])*abs(front[0,0])/(2*profile['nominal_f'])
                    row['aperture_diameter']=min(row['aperture_diameter'],2*modeled_radius)
                    break
                n2=row['nd'];power=(n2-n1)/row['curvature_radius'] if row['curvature_radius'] else 0
                front=np.array([[1,row['thickness']/n2],[0,1]])@np.array([[1,0],[-power,1]])@front;n1=n2
        self.max_iris=next(s['aperture_diameter']/2 for s in self.surfaces if s.get('is_stop'))
        self.model=model
        for index, field, value in edits:
            self.surfaces[index][field] = value
        for row in self.surfaces:
            spec=materials.resolve(row)
            if spec:row['material_spec']=spec;row['nd']=spec[1]
        self.z = np.cumsum([0.] + [s['thickness'] for s in self.surfaces[:-1]])
        self.prescription=Prescription.from_legacy(model,self.surfaces,self.z,profile,normalization_scale,bool(edits))
        self.surfaces=self.prescription.legacy_surfaces()
        self.z.setflags(write=False)
        # Paraxial EFL from a parallel ray in air: f' = -height / outgoing slope.
        p, d, valid, _, _ = self.trace(np.array([[.001, 0., -1.]]),
                                      np.array([[0., 0., 1.]]), Settings())
        if not valid[0]:
            raise RuntimeError('A prescrição rejeitou o raio paraxial.')
        self.efl = float(-.001 / (d[0, 0] / d[0, 2]))
        self.efl_y=self.efl
        if any(s.get('shape',0) for s in self.surfaces):
            _,dy,vy,_,_=self.trace(np.array([[0.,.001,-1.]]),np.array([[0.,0.,1.]]),Settings())
            if not vy[0] or abs(dy[0,1])<1e-12 or not math.isfinite(self.efl) or self.efl<=0:
                raise ValueError('A geometria exige potência convergente nos dois eixos.')
            self.efl_y=float(-.001/(dy[0,1]/dy[0,2]))
            if self.efl_y<=0:raise ValueError('A geometria exige potência convergente nos dois eixos.')

    @staticmethod
    def index(nd, wavelength, dispersion):
        # Cauchy proxy anchored at the d line. The source has nd but NO glass/Abbe.
        # Therefore nonzero dispersion is explicitly a creative approximation.
        if nd == 1 or dispersion == 0:
            return nd
        vd = 45.0
        b = (nd - 1) / vd / (1 / .4861**2 - 1 / .6563**2)
        return nd + dispersion * b * (1 / wavelength**2 - 1 / .5876**2)

    @staticmethod
    def surface_index(surface,wavelength,dispersion=0):
        spec=surface.get('material_spec')
        return materials.index(spec,wavelength) if spec else Lens.index(surface['nd'],wavelength,dispersion)

    def trace(self, p, d, settings, wavelength=.5876, history=False, optical_path=False):
        p, d = p.copy(), normalize(d.copy())
        valid = np.ones(len(p), dtype=bool)
        energy = np.ones(len(p))
        n1 = 1.
        opl = np.zeros(len(p),dtype=np.float64) if optical_path else None
        paths = [p.copy()] if history else []
        for s, z in zip(self.surfaces, self.z):
            radius = s['curvature_radius']
            if s.get('shape',0):
                hit,normal,intersects=geometry.intersect(s,z,p,d)
            elif radius == 0:
                t = (z - p[:, 2]) / np.maximum(d[:, 2], 1e-12)
                hit = p + t[:, None] * d
                normal = np.tile([0., 0., -1.], (len(p), 1))
                intersects = t >= -1e-7
            else:
                center = np.array([0., 0., z + radius])
                q = p - center
                b = (q * d).sum(-1)
                discriminant = b*b - ((q*q).sum(-1) - radius*radius)
                t = -b - np.sign(radius) * np.sqrt(np.maximum(discriminant, 0))
                hit = p + t[:, None] * d
                normal = normalize(hit - center)
                intersects = (discriminant >= 0) & (t >= -1e-7)
            r = np.linalg.norm(hit[:, :2], axis=1)
            if optical_path:
                opl += n1*np.linalg.norm(hit-p,axis=1)
            aperture = s['aperture_diameter'] / 2
            # Clear glass/housing cutoff and the iris have separate boundaries.
            valid &= intersects & (r <= aperture + 1e-9)
            if settings.soften_internal_cutoff:
                energy *= aperture_coverage(aperture-r, aperture*.025)
            if s.get('is_stop'):
                aperture = min(aperture, settings.iris_mm)
                if settings.blades >= 3 and not settings.aperture_custom:
                    a = np.arctan2(hit[:, 1], hit[:, 0]) - np.deg2rad(settings.rotation)
                    sector = (a + np.pi/settings.blades) % (2*np.pi/settings.blades) - np.pi/settings.blades
                    aperture = aperture * np.cos(np.pi/settings.blades) / np.cos(sector)
                valid &= r <= aperture + 1e-9
                energy *= aperture_coverage(aperture-r, aperture*settings.iris_softness)
                if settings.aperture_custom:
                    mask=mask_coverage(hit[:,:2],settings);energy*=mask;valid&=mask>1e-8
            n2 = self.surface_index(s,wavelength,settings.dispersion)
            incident=np.abs(np.sum(d*normal,axis=1))
            d, transmission_ok, trans = refract(d, normal, n1, n2)
            valid &= transmission_ok
            if settings.coating_strength:
                coated=coated_transmission(incident,n1,n2,wavelength,settings.coating_nm)
                trans=(1-settings.coating_strength)*trans+settings.coating_strength*coated
            energy *= trans
            p = hit
            n1 = n2
            if history:
                paths.append(p.copy() if optical_path else np.where(valid[:, None], p, np.nan))
        result = (p, d, valid, energy, paths)
        return result+(np.where(valid,opl,np.nan),) if optical_path else result

    def sensor_z(self, focus_m, axis=0):
        target = np.array([[.002, 0., 0.]]) if axis==0 else np.array([[0.,.002,0.]])
        origin = np.array([[0., 0., -focus_m * 1000]])
        direction = normalize(target - origin)
        p, d, valid, _, _ = self.trace(origin, direction, Settings())
        if not valid[0] or abs(d[0, axis]) < 1e-12:
            raise ValueError('Não foi possível calcular o plano de foco.')
        return float(p[0, 2] - p[0, axis] * d[0, 2] / d[0, axis])

    def bundle(self, field_mm, distance_m, settings, wavelength=.5876, count=2048, history=False):
        # Deterministic equal-area disk sampling on a fixed plane before the lens.
        i = np.arange(count) + .5
        r = self.surfaces[0]['aperture_diameter']/2 * np.sqrt(i/count)
        theta = i * np.pi * (3 - np.sqrt(5))
        target = np.column_stack((r*np.cos(theta), r*np.sin(theta), np.full(count, geometry.entry_plane(self))))
        origin = np.tile([-field_mm[0] * distance_m*1000/self.efl,
                          -field_mm[1] * distance_m*1000/self.efl,
                          -distance_m*1000], (count, 1))
        direction = normalize(target - origin)
        # Launch before the front sag to avoid distant-scene cancellation and
        # starting a ray inside a strongly edited asphere.
        return self.trace(target, direction, settings, wavelength, history)

    def spots(self, field_mm, distance_m, settings, wavelength=.5876, count=2048):
        # Compensate rejection sampling when the physical iris is small.
        count = int(count * min(16, max(1, (3/settings.iris_mm)**2)))
        textured=bool(settings.bokeh_texture_rings or settings.bokeh_texture_grain)
        p, d, valid, energy, paths = self.bundle(field_mm, distance_m, settings, wavelength, count,history=textured)
        sensor = self.sensor_z(settings.focus_m) + settings.filmback_mm
        if settings.ray_focus:sensor+=focus_calibration(settings,settings.focus_m)['shift_mm']
        hit = p + ((sensor - p[:, 2]) / np.maximum(d[:, 2], 1e-12))[:, None] * d
        field=np.asarray(field_mm)/(settings.sensor_mm/2)
        fr=np.linalg.norm(field)
        if settings.astigmatism_mm and fr>1e-9:
            radial=field/fr;tangent=np.array([-radial[1],radial[0]])
            slopes=d[:,:2]/np.maximum(d[:,2:3],1e-12)
            split=settings.astigmatism_mm*fr*fr
            hit[:,:2]+=split*((slopes@radial)[:,None]*radial-(slopes@tangent)[:,None]*tangent)
        weights=energy[valid];transmission=float(weights.sum()/count)
        if textured and weights.size and weights.sum()>0:
            from .bokeh_texture import modulation
            pupil=paths[0][valid,:2]/(self.surfaces[0]['aperture_diameter']/2)
            center=np.average(pupil,axis=0,weights=weights)
            scale=np.maximum(np.sqrt(np.average((pupil-center)**2,axis=0,weights=weights))*2,1e-6)
            texture=modulation((pupil-center)/scale,settings.bokeh_texture_rings,settings.bokeh_texture_grain,settings.bokeh_texture_scale,settings.bokeh_texture_rotation)
            adjusted=weights*texture;weights=adjusted*(weights.sum()/adjusted.sum())
        return hit[valid, :2], weights, transmission


LENS = Lens()


def validate_lens_edits(raw,model='dgauss50'):
    base_lens=_model_lens(model)
    """Bounded, serializable geometry and material overrides of the prescription."""
    if not isinstance(raw, (list, tuple)) or len(raw) > 256:
        raise ValueError('Edições da lente inválidas.')
    allowed = {'curvature_radius', 'thickness', 'aperture_diameter', 'nd'} | materials.FIELDS | geometry.FIELDS
    edits = {}
    for item in raw:
        if not isinstance(item, (list, tuple)) or len(item) != 3:
            raise ValueError('Edição de superfície inválida.')
        index, field, value = item
        if isinstance(index, bool) or not isinstance(index, int) or not 0 <= index < len(base_lens.surfaces):
            raise ValueError('Índice de superfície inválido.')
        if field not in allowed or (base_lens.surfaces[index].get('is_stop') and field != 'thickness'):
            raise ValueError('Propriedade de superfície inválida.')
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
            raise ValueError('Valor de superfície inválido.')
        base = base_lens.surfaces[index]
        if field in geometry.FIELDS:geometry.validate_value(field,value)
        if field in materials.FIELDS:
            if base['nd']==1:raise ValueError('Atribua materiais somente aos meios de vidro da prescrição.')
            materials.validate_value(field,value)
        if field == 'curvature_radius':
            if abs(value) < base['aperture_diameter']*.51 or abs(value) > max(2000,abs(base['curvature_radius'])*2):
                raise ValueError('Raio de curvatura incompatível com a abertura.')
            if value*base['curvature_radius'] <= 0:
                raise ValueError('A orientação da superfície deve ser preservada.')
        elif field == 'thickness' and (index == len(base_lens.surfaces)-1 or not .02 <= value <= max(20,base['thickness']*2)):
            raise ValueError('Espessura fora dos limites de edição desta prescrição.')
        elif field == 'aperture_diameter' and not 4 <= value <= max(34,base['aperture_diameter']*2):
            raise ValueError('Diâmetro fora dos limites de edição desta prescrição.')
        elif field == 'nd' and not 1 <= value <= 2:
            raise ValueError('Índice de refração fora de 1–2.')
        edits[(index, field)] = float(value)
    rows=[]
    for index in range(len(base_lens.surfaces)):
        row={**base_lens.surfaces[index],**{f:v for (i,f),v in edits.items() if i==index}}
        rows.append(row)
        materials.resolve(row)
        radius = edits.get((index, 'curvature_radius'), base_lens.surfaces[index]['curvature_radius'])
        diameter = edits.get((index, 'aperture_diameter'), base_lens.surfaces[index]['aperture_diameter'])
        if radius and abs(radius) <= diameter*.51:
            raise ValueError('A abertura excede a curvatura da superfície.')
    geometry.validate_rows(rows)
    return tuple((i, f, v) for (i, f), v in sorted(edits.items()))


@lru_cache(maxsize=32)
def _edited_lens(edits,model='dgauss50'):
    return Lens(edits,model)


@lru_cache(maxsize=32)
def _model_lens(model):
    return LENS if model=='dgauss50' else Lens(model=model)


def get_lens(settings):
    return _edited_lens(validate_lens_edits(settings.lens_edits,settings.lens_model),settings.lens_model) if settings.lens_edits else _model_lens(settings.lens_model)


def make_psf(field_mm, distance_m, settings, width, count=4096):
    lens = get_lens(settings)
    green, _, throughput = lens.spots(field_mm, distance_m, settings, count=count)
    if len(green) < 4:
        return np.zeros((3, 3, 3)), throughput, False
    # Recenter green centroid: this version models PSF shape, not image distortion.
    center = green.mean(axis=0)
    from .focus_preservation import spread_scale
    keep=float(spread_scale(distance_m,settings.focus_m,settings.focus_preservation,settings.focus_width,settings.foreground_blur,settings.background_blur))
    channels = []
    extent = 1
    unit = width/settings.sensor_mm
    field = np.asarray(field_mm) / (settings.sensor_mm/2)
    radius = np.linalg.norm(field)
    radial = field / max(radius, 1e-9)
    tangent = np.array([-radial[1], radial[0]])
    for wavelength in (.6563, .5876, .4861):
        points, weights, _ = lens.spots(field_mm, distance_m, settings, wavelength, count)
        points = (points - center) * unit
        if settings.swirl and radius > 0:
            # Creative tangential stretching, NOT a calibrated Petzval/Helios model.
            rcomp, tcomp = points @ radial, points @ tangent
            points = rcomp[:, None]*radial/(1+settings.swirl*radius) + tcomp[:, None]*tangent*(1+settings.swirl*radius)
        points[:, 0] /= settings.squeeze
        if settings.coma and radius > 0:
            rr = (points*points).sum(-1)
            points += settings.coma * radial * (rr/max(np.sqrt(rr.max(initial=0)), 1))[:, None] * .3
        if keep!=1:points*=keep
        if len(points):
            extent = max(extent, int(np.ceil(np.max(np.abs(points)))) + 1)
        channels.append((points, weights))
    # Never silently clip an optical footprint.
    if extent > 160:
        raise ValueError('PSF maior que o limite de 321 pixels. Reduza desfoque, sensor crop ou resolução.')
    kernels = []
    for points, weights in channels:
        kernel = np.zeros((2*extent+1, 2*extent+1))
        q = points + extent
        base = np.floor(q).astype(int)
        frac = q - base
        for ox, oy in ((0,0),(0,1),(1,0),(1,1)):
            w = weights * (frac[:,0] if ox else 1-frac[:,0]) * (frac[:,1] if oy else 1-frac[:,1])
            np.add.at(kernel, (base[:,1]+oy, base[:,0]+ox), w)
        total = kernel.sum()
        kernels.append(kernel / max(total, 1e-20))
    return np.stack(kernels, axis=-1), throughput, True


def srgb_decode(x):
    return np.where(x <= .04045, x/12.92, ((x+.055)/1.055)**2.4)


def srgb_encode(x):
    x = np.clip(x, 0, 1)
    return np.where(x <= .0031308, x*12.92, 1.055*x**(1/2.4)-.055)


def depth_nearness(depth, settings):
    """Contract shared with JS/CUDA preprocessing; original defaults are exact."""
    from .depth_mapping import advanced,prepare
    if advanced(settings) or not np.isfinite(depth).all():return prepare(depth,settings)['nearness']
    d=np.asarray(depth,dtype=float)
    if not np.all(np.isfinite(d)):
        raise ValueError('Depth precisa conter valores finitos.')
    d=np.clip(d*settings.depth_gain+settings.depth_bias,0,1)
    return 1-d if settings.invert_depth else d


def depth_layers(depth, settings):
    """Fixed soft partitions in inverse distance; no data-dependent bins per frame."""
    d=depth_nearness(depth,settings)
    if settings.depth_mode=='cut' and settings.depth_feather<=0:
        width=1e-5
        t=np.clip((d-settings.depth_cut+width)/(2*width),0,1)
        front=t*t*(3-2*t)
        return [(settings.far_m,1-front),(settings.near_m,front)]
    from .depth_mapping import blur_transition
    d=blur_transition(d,settings)
    n=settings.depth_slices if settings.depth_mode in ('auto','slicing','cut') else 5
    from .depth_mapping import focus_partition
    d=focus_partition(d,settings)
    centers=focus_partition(np.linspace(0,1,n),settings,inverse=True)
    return [(1/(1/settings.far_m+c*(1/settings.near_m-1/settings.far_m)),
             np.maximum(0,1-np.abs(d-i/(n-1))*(n-1))) for i,c in enumerate(centers)]


def render(rgb, settings, depth=None):
    """RGB scene-linear float input/output. Source-weighted PSFs; finite depth layers.

    RGB+Z cannot reconstruct hidden background. Layer compositing approximates
    occlusion and does not replace deep images or a 3D radiance field.
    """
    if settings.physical_distortion:
        raise ValueError('Distorção física requer o render WebGL/CUDA e o compositor do aplicativo; o render CPU de referência não aplica esse mapa.')
    rgb = np.asarray(rgb, dtype=np.float64)
    if rgb.ndim != 3 or rgb.shape[2] != 3 or not np.all(np.isfinite(rgb)):
        raise ValueError('Esperada imagem RGB finita.')
    h, w, _ = rgb.shape
    if min(h, w) < 16 or max(h, w) > 1920:
        raise ValueError('Dimensão suportada: 16 a 1920 pixels.')
    count = 2048 if settings.quality == 'preview' else 8192
    nx, ny = (3, 3) if settings.quality == 'preview' else (5, 3)
    xs, ys = np.linspace(0, w-1, nx), np.linspace(0, h-1, ny)
    xcoord, ycoord = np.arange(w), np.arange(h)
    if depth is None:
        layers = [(settings.source_m, np.ones((h, w)))]
    else:
        depth = np.asarray(depth, dtype=float)
        from .depth_mapping import advanced
        finite=depth[np.isfinite(depth)]
        if depth.shape != (h,w) or (not advanced(settings) and finite.size and (finite.min()<0 or finite.max()>1)):
            raise ValueError('Depth inválido para a interpretação selecionada ou dimensões diferentes da imagem.')
        from .depth_mapping import blur_transition
        nearness=blur_transition(depth_nearness(depth,settings),settings)
        if np.ptp(nearness)<1e-12:
            distance=1/(1/settings.far_m+float(nearness.flat[0])*(1/settings.near_m-1/settings.far_m))
            result,warnings=render(rgb,replace(settings,source_m=distance),None)
            warnings.append("Mapa de profundidade constante: um único plano, sem divisão em camadas.")
            return result,warnings
        layers=depth_layers(depth,settings)
    _, _, base_trans = get_lens(settings).spots((0,0), settings.source_m, settings, count=count)
    if base_trans <= 0:
        raise ValueError('A lente não transmitiu raios. Verifique abertura e distância.')
    out = np.zeros_like(rgb)
    warnings = set()
    background_rendered=False
    for layer_index,(distance, mask) in enumerate(layers):
        if depth is not None and (settings.depth_mode in ('auto','slicing') or
                                  settings.depth_mode=='cut' and settings.depth_feather>0):
            # Partition weights are not OVER alpha: make opacity conditional
            # on far-to-near coverage before applying each layer's PSF.
            center=layer_index/(len(layers)-1)
            from .depth_mapping import focus_partition
            cumulative=np.clip(1+(center-focus_partition(nearness,settings))*(len(layers)-1),0,1)
            mask=mask/np.maximum(cumulative,1e-5)
        if mask.max() == 0:
            continue
        layer_rgb=rgb
        if depth is not None and settings.depth_mode!='continuous' and not background_rendered:
            from .background_extension import extend_background
            layer_rgb,support=extend_background(rgb,mask)
            if support:
                mask=np.ones_like(mask)
        color = np.zeros_like(rgb)
        alpha = np.zeros((h,w))
        for cy in ys:
            wy = np.maximum(1-np.abs(ycoord-cy)/max(ys[1]-ys[0],1), 0)
            for cx in xs:
                wx = np.maximum(1-np.abs(xcoord-cx)/max(xs[1]-xs[0],1), 0)
                window = wy[:,None]*wx[None,:]*mask
                field = ((cx/(w-1)-.5)*settings.sensor_mm,
                         (cy/(h-1)-.5)*settings.sensor_mm*h/w)
                psf, trans, ok = make_psf(field, distance, settings, w, count)
                if not ok:
                    warnings.add('Parte do campo não tem cobertura óptica suficiente.')
                    continue
                relative_light = min(trans/base_trans, 1.)
                for c in range(3):
                    color[...,c] += fftconvolve(layer_rgb[...,c]*window, psf[...,c], mode='same')*relative_light
                alpha += fftconvolve(window, psf[...,1], mode='same')
        alpha = np.clip(alpha, 0, 1)
        if depth is not None and settings.depth_mode=='continuous':
            # Continuous source-scatter approximation has no ordered occlusion.
            out += color
        elif depth is not None:
            straight=np.divide(color,alpha[...,None],out=np.zeros_like(color),where=alpha[...,None]>1e-5)
            out=straight*alpha[...,None]+out*(1-alpha[...,None])
            background_rendered=True
        else:
            out=color
    if settings.diffusion:
        from .filter_transform import region_mask
        amount=settings.diffusion*region_mask(settings,h,w)[...,None]
        radius=max(w*.018*settings.diffusion_reach,1)
        out = (1-amount)*out + amount*gaussian_filter(out, (radius,radius,0))
    if depth is not None:
        warnings.add(f'Profundidade em {len(layers)} camadas ({settings.depth_mode}): fundo oculto e oclusões são aproximados.')
    if settings.dispersion:
        warnings.add('Dispersão criativa: números de Abbe não constam na prescrição original.')
    if settings.swirl or settings.astigmatism_mm or settings.coma or settings.squeeze != 1 or settings.diffusion:
        warnings.add('Modificadores criativos ativos; não representam uma lente clássica calibrada.')
    if settings.bokeh_distortion:
        warnings.add('Deformação da luz é aplicada pela prévia/exportação GPU, não pela referência CPU.')
    if settings.ghost_gain or settings.diffraction_gain:
        warnings.add('Ghosts e raios de difração são renderizados apenas na prévia/exportação GPU; a referência CPU ainda não os inclui.')
    if settings.bokeh_dither or settings.highlight_detail or settings.highlight_view!='final':
        warnings.add('Dither e qualidade/vistas de highlights são aplicados pelo renderer GPU, não pela referência CPU.')
    out=np.maximum(out,0)*2**settings.exposure
    if settings.lens_dirt_amount:
        from .lens_dirt import apply_dirt
        out=apply_dirt(out,settings)
        warnings.add('Lens Dirt: obstrução e dispersão no espaço da câmera, como aproximação visual.')
    if settings.filters:
        from .filters import apply as apply_filters
        out=apply_filters(out,settings.filters,aperture_scale=settings.iris_mm/8.55)
        warnings.add('Filtros artísticos próprios em luz linear; sem calibração comercial.')
    if settings.edge_compensation:
        from .vignette import compensation_gain
        illumination=np.zeros((ny,nx))
        lens=get_lens(settings)
        for iy,cy in enumerate(ys):
            for ix,cx in enumerate(xs):
                field=((cx/(w-1)-.5)*settings.sensor_mm,(cy/(h-1)-.5)*settings.sensor_mm*h/w)
                illumination[iy,ix]=lens.spots(field,settings.source_m,settings,count=count)[2]
        out*=compensation_gain(illumination,h,w,settings.edge_compensation,settings.edge_compensation_limit)[...,None]
        warnings.add(f'Clareamento baseado na transmissão da lente: limite de +{settings.edge_compensation_limit:g} EV; não recupera campos bloqueados.')
    if settings.vignette_amount:
        from .vignette import vignette_mask
        out*=vignette_mask(h,w,settings.vignette_amount)[...,None]
        warnings.add('Vinheta criativa: atenuação radial adicional no espaço da câmera.')
    return out, sorted(warnings)


def aperture_info(settings):
    """Paraxial entrance pupil: front-group magnification at the aperture stop."""
    lens=get_lens(settings);matrix=np.eye(2);n=1.
    for surface in lens.surfaces:
        if surface.get('is_stop'):break
        n2=surface['nd'];r=surface['curvature_radius']
        power=(n2-n)*geometry.curvature(surface,0) if surface.get('shape',0) else (n2-n)/r if r else 0.
        matrix=np.array([[1,surface['thickness']/n2],[0,1]])@np.array([[1,0],[-power,1]])@matrix
        n=n2
    scale=1/max(abs(float(matrix[0,0])),1e-9)
    coefficient=abs(lens.efl)/(2*scale)
    return dict(pupil_scale=scale,entrance_diameter_mm=2*settings.iris_mm*scale,
                f_number=coefficient/settings.iris_mm,min_f=coefficient/lens.max_iris,max_f=coefficient/.5,max_iris_mm=lens.max_iris)


def focus_calibration(settings, distance=None):
    """Axial focus with the strongest central ray concentration, preserving aberrations."""
    return _focus_calibration(settings.lens_model,tuple(settings.lens_edits),round(settings.iris_mm,4),
                              settings.blades,round(settings.rotation,3),settings.soften_internal_cutoff,
                              round(settings.iris_softness,4),round(settings.source_m if distance is None else distance,4),settings.aperture_mask if settings.aperture_custom else '',settings.aperture_invert)

@lru_cache(maxsize=128)
def _focus_calibration(model,edits,iris,blades,rotation,soften,softness,distance,aperture_mask,aperture_invert):
    s=Settings(lens_model=model,lens_edits=edits,iris_mm=iris,blades=blades,rotation=rotation,
               soften_internal_cutoff=soften,iris_softness=softness,aperture_mask=aperture_mask,aperture_custom=bool(aperture_mask),aperture_invert=aperture_invert)
    lens=get_lens(s);paraxial=lens.sensor_z(distance)
    count=int(8192*min(16,max(1,(3/iris)**2)))
    p,d,valid,energy,_=lens.bundle((0,0),distance,s,count=count)
    p=p[valid];d=d[valid];weights=energy[valid]
    if len(p)<8 or weights.sum()<=0:return dict(shift_mm=0.,rays=len(p),valid=False)
    weights=weights/weights.sum();slope=d[:,:2]/d[:,2:3];origin=p[:,:2]-p[:,2:3]*slope
    vc=slope-(weights[:,None]*slope).sum(0);xc=origin-(weights[:,None]*origin).sum(0)
    denominator=(weights[:,None]*vc*vc).sum()
    if denominator<1e-16:return dict(shift_mm=0.,rays=len(p),valid=False)
    best=-(weights[:,None]*xc*vc).sum()/denominator
    rms_plane=best
    # Min-RMS can favor weak aberrated outer rays and soften the central image.
    # Search for the strongest central core at two sensor-space scales instead.
    rms_shift=float(best-paraxial)
    offsets=np.unique(np.r_[0.,np.linspace(min(0.,rms_shift)*1.5-.3,max(0.,rms_shift)*1.5+.3,81)])
    def concentration(z):
        r2=((xc+z*vc)**2).sum(1)
        return float(np.sqrt((weights*np.exp(-r2/(2*.025**2))).sum()*(weights*np.exp(-r2/(2*.05**2))).sum()))
    scores=[concentration(paraxial+offset) for offset in offsets]
    index=int(np.argmax(scores));step=(offsets[-1]-offsets[0])/80
    fine=np.unique(np.r_[0.,np.linspace(offsets[index]-step,offsets[index]+step,41)])
    best=paraxial+max(fine,key=lambda offset:concentration(paraxial+offset))
    shift=float(best-paraxial)
    # A pathological prescription must not place a sensor inside the glass.
    if not np.isfinite(shift) or best<=lens.z[-1]:return dict(shift_mm=0.,rays=len(p),valid=False)
    def rms(z):return float(np.sqrt((weights[:,None]*(xc+z*vc)**2).sum()))
    return dict(shift_mm=shift,rays=len(p),valid=True,paraxial_rms_mm=rms(paraxial),best_rms_mm=rms(best),paraxial_core=concentration(paraxial),focused_core=concentration(best),rms_shift_mm=float(rms_plane-paraxial))


def layout(settings):
    lens = get_lens(settings)
    matrix = np.eye(2)
    n1 = 1.
    for s in lens.surfaces:
        n2 = s['nd']
        power = (n2-n1)*geometry.curvature(s,0) if s.get('shape',0) else (n2-n1)/s['curvature_radius'] if s['curvature_radius'] else 0.
        matrix = np.array([[1, s['thickness']/n2], [0, 1]]) @ np.array([[1, 0], [-power, 1]]) @ matrix
        n1 = n2
    # The front focal pole bounds real object-to-sensor conjugates. Keep a
    # small numerical margin; this is not a manufacturer's close-focus rating.
    pole=-matrix[1,1]/matrix[1,0]/1000 if matrix[1,0]<-1e-12 else 0.
    focus_min=max(.3,pole+max(.01,abs(pole)*.02))
    calibration=focus_calibration(settings)
    focus_shift=calibration['shift_mm'] if settings.ray_focus else 0.
    sensor = lens.sensor_z(settings.focus_m)+settings.filmback_mm+focus_shift
    reference_sensor = lens.sensor_z(2.0)
    source_focus = lens.sensor_z(settings.source_m)+focus_shift
    # Meridian rays for an actual optical layout, not a decorative diagram.
    heights = np.linspace(-12,12,19)
    target = np.column_stack((heights, np.zeros(19), np.full(19,geometry.entry_plane(lens))))
    origin = np.tile([0.,0.,-settings.source_m*1000], (19,1))
    p,d,valid,_,paths = lens.trace(target, normalize(target-origin), settings, history=True)
    # Continue past the sensor and convergence so both sides of focus are visible.
    end_z = max(sensor, source_focus, reference_sensor) + 12
    hit = p + ((end_z-p[:,2])/d[:,2])[:,None]*d
    paths.append(np.where(valid[:,None],hit,np.nan))
    rays = []
    for i in range(19):
        rays.append([[float(a[i,2]),float(a[i,0])] for a in paths if np.isfinite(a[i]).all()])
    axes={}
    if any(s.get('shape',0) for s in lens.surfaces):
        matrix_y=np.eye(2);n1=1.
        for s in lens.surfaces:
            n2=s['nd'];power=(n2-n1)*geometry.curvature(s,1)
            matrix_y=np.array([[1,s['thickness']/n2],[0,1]])@np.array([[1,0],[-power,1]])@matrix_y;n1=n2
        axes=dict(efl_x_mm=lens.efl,efl_y_mm=lens.efl_y,
                  focus_x_z_mm=lens.sensor_z(settings.source_m,0),focus_y_z_mm=lens.sensor_z(settings.source_m,1),
                  focus_matrix_y=matrix_y.ravel().tolist(),geometry_trace='cpu-reference',sensor_reference_axis='x')
    return {**axes,'prescription':lens.prescription.export(),'focus_shift_mm':focus_shift,'focus_calibration':calibration,'focus_min_m':float(focus_min),'efl_mm': lens.efl, 'profile':LENS_PROFILES[settings.lens_model], 'aperture':aperture_info(settings), 'sensor_z_mm': sensor,
            'reference_sensor_z_mm': reference_sensor, 'source_focus_z_mm': source_focus,
            'focus_matrix': matrix.ravel().tolist(), 'last_z_mm': float(lens.z[-1]),
            'surfaces': [dict(s,z=float(z)) for s,z in zip(lens.surfaces,lens.z)],
            'base_surfaces':[dict(s) for s in _model_lens(settings.lens_model).surfaces],
            'rays': rays, 'settings': asdict(settings)}


def diagnostics(settings):
    return layout(settings)
