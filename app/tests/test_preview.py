import unittest
from dataclasses import replace
import numpy as np
from optics.core import LENS, Settings
from optics.preview import focus_plane, kernel


class PreviewTests(unittest.TestCase):
    def test_dense_atlas_recovers_more_of_the_traced_footprint(self):
        settings = Settings(source_m=5, focus_m=.5, iris_mm=8.55)
        points, weights, _ = LENS.spots((0, 0), 5, settings, count=4096)
        center = np.average(points, axis=0, weights=weights)
        reference = np.average(np.sum((points-center)**2, axis=1), weights=weights)
        errors = []
        for taps in (64, 256, 512, 1024):
            data = kernel(settings, taps=taps)
            atlas = np.asarray(data['atlas']).reshape(3, taps, 5, 5, 4)[1, :, 2, 2]
            energy = np.asarray(data['pupils']).reshape(3, taps, 5, 5, 4)[1, :, 2, 2, 2]
            projected = atlas[:, :2]+(focus_plane(.5)-data['reference_z'])*atlas[:, 2:]
            moment = np.average(np.sum(projected**2, axis=1), weights=energy)
            errors.append(abs(reference-moment)/reference)
            np.testing.assert_allclose(energy.sum(), taps, atol=1e-4)
            self.assertIs(data, kernel(settings, taps=taps))
        self.assertLess(errors[1], errors[0])
        self.assertLess(errors[1], .02)

    def test_closing_iris_reduces_projected_bokeh_radius(self):
        moments=[]
        for iris in (8.55,4.275,2.1375):
            s=Settings(source_m=5,focus_m=.6,iris_mm=iris)
            data=kernel(s,taps=128)
            self.assertEqual(data['iris_mm'],iris)
            rays=np.asarray(data['atlas']).reshape(3,128,5,5,4)[1,:,2,2]
            weights=np.asarray(data['pupils']).reshape(3,128,5,5,4)[1,:,2,2,2]
            offsets=rays[:,:2]+(focus_plane(.6)-data['reference_z'])*rays[:,2:]
            moments.append(np.sqrt(np.average(np.sum(offsets**2,axis=1),weights=weights)))
        self.assertLess(moments[1],moments[0]*.6)
        self.assertLess(moments[2],moments[1]*.6)

    def test_edge_controls_change_atlas_and_remain_deterministic(self):
        settings = Settings(iris_mm=8.55, soften_internal_cutoff=False)
        hard = kernel(settings, rays=1024)
        glass = kernel(replace(settings, soften_internal_cutoff=True), rays=1024)
        iris = kernel(replace(settings, iris_softness=.1), rays=1024)
        self.assertIs(hard, kernel(settings, rays=1024))
        self.assertIs(glass, kernel(replace(settings, soften_internal_cutoff=True, focus_m=.8), rays=1024))
        for changed in (glass, iris):
            self.assertGreater(np.max(np.abs(np.asarray(hard['pupils'])-np.asarray(changed['pupils']))), .001)
            p = np.asarray(changed['pupils']).reshape(3, 64, 3, 3, 4)
            np.testing.assert_allclose(p[...,2].sum(1), 64, atol=1e-4)
            self.assertTrue(np.isfinite(changed['atlas']).all())
        self.assertTrue(glass['soften_internal_cutoff'])
        self.assertEqual(iris['iris_softness'], .1)

    def test_paraxial_plane_matches_direct_ray_focus(self):
        for meters in (.3,.8,2,5,20):
            self.assertAlmostEqual(focus_plane(meters),LENS.sensor_z(meters),places=4)

    def test_sensor_translation_matches_direct_ray_positions(self):
        s=Settings(source_m=5,iris_mm=8.55)
        p,d,valid,_,_=LENS.bundle((0,0),5,s,.5876,4096,history=True)
        z1=focus_plane(.8);z2=focus_plane(5)
        xy1=p[:,:2]+(z1-p[:,2,None])*d[:,:2]/d[:,2,None]
        xy2=p[:,:2]+(z2-p[:,2,None])*d[:,:2]/d[:,2,None]
        np.testing.assert_allclose(xy1[valid]+(z2-z1)*d[valid,:2]/d[valid,2,None],xy2[valid],atol=1e-10)

    def test_atlas_preserves_energy_and_is_focus_independent(self):
        s=Settings(source_m=5,iris_mm=8.55)
        a=kernel(s);b=kernel(replace(s,focus_m=.8,filmback_mm=1))
        self.assertIs(a,b)
        self.assertEqual(a['grid'],5)
        p=np.asarray(a['pupils']).reshape(3,64,5,5,4)
        self.assertTrue(np.isfinite(a['atlas']).all())
        np.testing.assert_allclose(p[:,:,:,:,2].sum(1),64,atol=1e-4)
        self.assertGreaterEqual(p[...,2].min(),0)
        self.assertGreater(p[...,3].min(),0)
        self.assertLessEqual(p[...,3].max(),1)
        atlas=np.asarray(a['atlas']).reshape(3,64,5,5,4)
        np.testing.assert_allclose(atlas[0],atlas[2])
        self.assertGreater(np.max(np.abs(atlas[1,:,0,2]-atlas[1,:,2,2])),.001)

    def test_atlas_validation(self):
        for aspect in (0,6,float('nan')):
            with self.assertRaises(ValueError):kernel(Settings(),aspect)

    def test_glass_edit_changes_traced_atlas_and_focus(self):
        original=kernel(Settings())
        edited=Settings.parse({'lens_edits':[[0,'curvature_radius',31.0]]})
        changed=kernel(edited)
        self.assertNotAlmostEqual(original['efl_mm'],changed['efl_mm'],places=2)
        self.assertGreater(np.max(np.abs(np.asarray(original['atlas'])-np.asarray(changed['atlas']))),.001)
        self.assertEqual(changed['efl_mm'],kernel(edited)['efl_mm'])
        interactive=kernel(edited,rays=1024)
        self.assertEqual(interactive['grid'],3)
        self.assertEqual(changed['grid'],5)
        self.assertEqual(len(interactive['atlas']),3*64*3*3*4)
        self.assertEqual(len(changed['atlas']),3*64*5*5*4)
        self.assertTrue(np.isfinite(interactive['atlas']).all())

    def test_invalid_glass_edits_are_rejected(self):
        for edit in ([0,'curvature_radius',2],[0,'curvature_radius',-30],
                     [5,'nd',1.5],[0,'nd',float('nan')],[99,'thickness',2]):
            with self.assertRaises(ValueError):Settings.parse({'lens_edits':[edit]})

    def test_coating_reduces_two_bounce_ghost_energy(self):
        bare=kernel(Settings())
        coated=kernel(Settings(coating_strength=1))
        self.assertEqual(len(bare['ghost_pairs']),3)
        self.assertLess(sum(pair[2] for pair in coated['ghost_pairs']),
                        sum(pair[2] for pair in bare['ghost_pairs']))
        self.assertGreater(np.max(np.abs(np.asarray(bare['pupils'])-np.asarray(coated['pupils']))),.001)
