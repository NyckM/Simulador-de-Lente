import unittest
import numpy as np
from optics.core import Settings, LENS, normalize, refract, coated_transmission, make_psf, render, srgb_decode, srgb_encode, layout, aperture_coverage


class PhysicsTests(unittest.TestCase):
    def test_edge_coverage_is_continuous_and_never_leaks_outside(self):
        margin = np.array([-.1, 0., .025, .05, .075, .1, .2])
        coverage = aperture_coverage(margin, .1)
        np.testing.assert_allclose(coverage, [0, 0, .15625, .5, .84375, 1, 1])
        self.assertTrue(np.all(np.diff(coverage) >= 0))
        np.testing.assert_array_equal(aperture_coverage(margin, 0), margin >= 0)
        # Smoothstep has zero slope where the fade meets the full pupil.
        self.assertLess(1-float(aperture_coverage(.1-1e-6, .1)), 1e-8)

    def test_glass_and_iris_softness_have_independent_coverage(self):
        def bundle(field, soft, iris_softness):
            return LENS.bundle(field, 5, Settings(iris_mm=8.55, soften_internal_cutoff=soft,
                               iris_softness=iris_softness), count=8192)
        _, _, hard_valid, hard_energy, _ = bundle((14, 0), False, 0)
        _, _, soft_valid, soft_energy, _ = bundle((14, 0), True, 0)
        np.testing.assert_array_equal(hard_valid, soft_valid)
        self.assertTrue(np.all(soft_energy[soft_valid] <= hard_energy[soft_valid]+1e-12))
        self.assertGreater(np.max(hard_energy[soft_valid]-soft_energy[soft_valid]), .05)
        _, _, valid, hard, _ = bundle((0, 0), False, 0)
        _, _, iris_valid, soft, _ = bundle((0, 0), False, .1)
        np.testing.assert_array_equal(valid, iris_valid)
        self.assertGreater(np.max(hard[valid]-soft[valid]), .05)
        self.assertTrue(np.all(soft[valid] <= hard[valid]+1e-12))
        with self.assertRaises(ValueError): Settings.parse({'iris_softness': .4})
        with self.assertRaises(ValueError): Settings.parse({'soften_internal_cutoff': 'false'})

    def test_layout_shows_both_sides_of_focus_with_fixed_reference_sensor(self):
        near = layout(Settings(focus_m=.5, source_m=2))
        sharp = layout(Settings(focus_m=2, source_m=2))
        far = layout(Settings(focus_m=10, source_m=2))
        self.assertLess(near['source_focus_z_mm'], near['sensor_z_mm'])
        self.assertAlmostEqual(sharp['source_focus_z_mm'], sharp['sensor_z_mm'])
        self.assertGreater(far['source_focus_z_mm'], far['sensor_z_mm'])
        for data in (near, sharp, far):
            self.assertEqual(data['reference_sensor_z_mm'], sharp['reference_sensor_z_mm'])
            rays = [ray for ray in data['rays'] if len(ray) > len(data['surfaces'])]
            self.assertTrue(rays)
            self.assertTrue(all(ray[-1][0] > max(data['sensor_z_mm'], data['source_focus_z_mm']) for ray in rays))

    def test_snell_against_scalar_law(self):
        theta=np.deg2rad(30)
        outgoing,ok,t=refract(np.array([[np.sin(theta),0,np.cos(theta)]]),np.array([[0.,0.,-1.]]),1.,1.5)
        self.assertTrue(ok[0])
        self.assertAlmostEqual(outgoing[0,0],np.sin(theta)/1.5,places=12)
        self.assertGreater(t[0],0)
        self.assertLessEqual(t[0],1)

    def test_total_internal_reflection(self):
        theta=np.deg2rad(60)
        _,ok,_=refract(np.array([[np.sin(theta),0,np.cos(theta)]]),np.array([[0.,0.,-1.]]),1.5,1.)
        self.assertFalse(ok[0])

    def test_quarter_wave_coating_reduces_design_wavelength_reflection(self):
        bare=1-((1-1.5)/(1+1.5))**2
        coated=float(coated_transmission(1.,1.,1.5,.55,550))
        self.assertGreater(coated,bare)
        self.assertLessEqual(coated,1)
        red=float(coated_transmission(1.,1.,1.5,.6563,550))
        self.assertLess(red,coated)
        _,_,_,energy_bare,_=LENS.bundle((0,0),5,Settings(),count=1024)
        _,_,_,energy_coated,_=LENS.bundle((0,0),5,Settings(coating_strength=1),count=1024)
        self.assertGreater(energy_coated.mean(),energy_bare.mean())

    def test_efl_matches_independent_abcd(self):
        # [height, reduced angle n*theta], no reuse of vector ray intersection.
        matrix=np.eye(2)
        n1=1
        for s in LENS.surfaces:
            n2=s['nd'];r=s['curvature_radius']
            power=(n2-n1)/r if r else 0
            surface=np.array([[1.,0],[-power,1.]])
            transfer=np.array([[1.,s['thickness']/n2],[0,1.]])
            matrix=transfer@surface@matrix
            n1=n2
        self.assertAlmostEqual(LENS.efl,-1/matrix[1,0],places=4)

    def test_focus_and_aperture_reduce_spot(self):
        s=Settings(focus_m=2,source_m=2,iris_mm=4,blades=0)
        def rms(distance,settings):
            p,_,_=LENS.spots((0,0),distance,settings,count=16000)
            return np.sqrt(np.mean(np.sum((p-p.mean(0))**2,axis=1)))
        self.assertLess(rms(2,s),rms(8,s))
        wide=Settings(focus_m=2,iris_mm=8.55,blades=0)
        self.assertLess(rms(8,s),rms(8,wide))

    def test_physical_psf_conservation(self):
        for field in [(0,0),(10,5),(18,10)]:
            kernel,throughput,ok=make_psf(field,5,Settings(dispersion=.5),640,4096)
            self.assertTrue(ok)
            self.assertTrue(np.isfinite(kernel).all())
            self.assertGreaterEqual(kernel.min(),0)
            np.testing.assert_allclose(kernel.sum((0,1)),[1,1,1],atol=1e-12)
            self.assertGreater(throughput,0)
            self.assertLessEqual(throughput,1)

    def test_achromatic_reference_and_dispersive_proxy(self):
        kernel,_,_=make_psf((12,5),5,Settings(),640,4096)
        np.testing.assert_allclose(kernel[...,0],kernel[...,2])
        kernel,_,_=make_psf((12,5),5,Settings(dispersion=1),640,4096)
        self.assertGreater(np.max(np.abs(kernel[...,0]-kernel[...,2])),.001)

    def test_deterministic_and_linear_render(self):
        rng=np.random.default_rng(2)
        rgb=rng.random((32,48,3))
        a,_=render(rgb,Settings())
        b,_=render(rgb*2,Settings())
        np.testing.assert_allclose(b,a*2,atol=1e-12)
        c,_=render(rgb,Settings())
        np.testing.assert_array_equal(a,c)

    def test_black_remains_black(self):
        out,_=render(np.zeros((32,48,3)),Settings(diffusion=.3,dispersion=.2))
        self.assertEqual(out.max(),0)

    def test_constant_depth_equals_single_plane(self):
        rgb=np.ones((32,48,3))
        s=Settings(source_m=5,near_m=2,far_m=5)
        a,_=render(rgb,s)
        b,_=render(rgb,s,np.zeros((32,48)))
        np.testing.assert_allclose(a,b,atol=1e-12)

    def test_srgb_roundtrip(self):
        x=np.linspace(0,1,1000)
        np.testing.assert_allclose(srgb_encode(srgb_decode(x)),x,atol=1e-12)

    def test_invalid_inputs(self):
        for bad in [{'focus_m':0},{'iris_mm':float('nan')},{'blades':2},{'near_m':20,'far_m':2}]:
            with self.assertRaises(ValueError):Settings.parse(bad)
        with self.assertRaises(ValueError):render(np.zeros((32,48,3)),Settings(),np.ones((8,8)))


if __name__=='__main__':unittest.main()
