"""Immutable, versioned optical geometry shared by app consumers.

Legacy names remain available at the renderer boundary. Explicitly assigned
spectral glass materials are preserved alongside the immutable geometry.
"""
from dataclasses import dataclass
from types import MappingProxyType
import hashlib
import json
import math

SCHEMA = 'optical-prescription/1'

@dataclass(frozen=True)
class Surface:
    index: int
    kind: str
    z_mm: float
    radius_mm: float
    thickness_to_next_mm: float
    clear_diameter_mm: float
    nd_after: float
    is_stop: bool
    material_spec: tuple = ()
    geometry_spec: tuple = ()

    def legacy(self):
        result=dict(index=self.index,curvature_radius=self.radius_mm,
                    thickness=self.thickness_to_next_mm,
                    aperture_diameter=self.clear_diameter_mm,
                    nd=self.nd_after,is_stop=self.is_stop)
        if self.material_spec:result['material_spec']=self.material_spec
        if self.geometry_spec:
            result.update(zip(('shape','conic','a4','a6'),self.geometry_spec))
        return result

    def export(self):
        from .materials import medium
        result=dict(index=self.index,type=self.kind,z_mm=self.z_mm,
                    radius_mm=self.radius_mm,
                    thickness_to_next_mm=self.thickness_to_next_mm,
                    clear_diameter_mm=self.clear_diameter_mm,
                    medium_after=medium(self.material_spec) if self.material_spec else dict(nd=self.nd_after,material_id=None,abbe=None),
                    is_stop=self.is_stop)
        if self.geometry_spec:
            result['geometry']=dict(zip(('shape','conic','a4_mm_minus3','a6_mm_minus5'),self.geometry_spec))
        return result

@dataclass(frozen=True)
class Prescription:
    model: str
    surfaces: tuple
    category: str
    source_file: str
    sources: tuple
    source_sha256: str | None
    normalization_scale: float
    modeled_apertures: bool
    edited: bool

    @classmethod
    def from_legacy(cls,model,rows,z,profile,scale=1.,edited=False):
        from . import geometry
        surfaces=[]
        for index,(row,position) in enumerate(zip(rows,z)):
            values=[position,row['curvature_radius'],row['thickness'],row['aperture_diameter'],row['nd']]
            if row['index']!=index or not all(math.isfinite(v) for v in values):
                raise ValueError('Prescrição: superfície ou coordenada inválida.')
            if row['aperture_diameter']<=0 or row['nd']<1 or row['thickness']<0:
                raise ValueError('Prescrição: diâmetro, índice ou espessura inválidos.')
            surfaces.append(Surface(index,geometry.NAMES.get(int(row.get('shape',0)),'plane' if row['curvature_radius']==0 else 'spherical'),
                            float(position),float(row['curvature_radius']),float(row['thickness']),
                            float(row['aperture_diameter']),float(row['nd']),bool(row.get('is_stop',False)),row.get('material_spec',()),geometry.spec(row)))
        if len(surfaces)!=len(rows) or len(surfaces)!=len(z) or not surfaces:
            raise ValueError('Prescrição: quantidade de superfícies inválida.')
        category='public_reference' if model=='dgauss50' else 'reconstructed' if profile.get('prescription') else 'artistic'
        return cls(model,tuple(surfaces),category,profile.get('prescription','dgauss50mm.json'),
                   tuple(profile.get('sources',())),profile.get('source_sha256'),float(scale),
                   bool(profile.get('prescription')),bool(edited))

    @property
    def geometry_id(self):
        encoded=json.dumps([s.export() for s in self.surfaces],sort_keys=True,separators=(',',':'),allow_nan=False)
        return hashlib.sha256(encoded.encode()).hexdigest()

    def legacy_surfaces(self):
        return tuple(MappingProxyType(s.legacy()) for s in self.surfaces)

    def export(self):
        return dict(schema=SCHEMA,model=self.model,geometry_id=self.geometry_id,
                    units=dict(length='mm',object_distance='m',wavelength='um'),
                    convention=dict(axis='z',direction='scene_to_sensor',
                                    radius_sign='positive_center_toward_sensor',
                                    refractive_index='medium_after_surface'),
                    provenance=dict(category=self.category,source_file=self.source_file,
                                    sources=list(self.sources),source_sha256=self.source_sha256,
                                    normalization_scale=self.normalization_scale,
                                    modeled_apertures=self.modeled_apertures,edited=self.edited,
                                    measured_calibration=False),
                    surfaces=[s.export() for s in self.surfaces])
