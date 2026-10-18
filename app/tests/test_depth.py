import unittest
import numpy as np
from optics.core import Settings,depth_nearness,depth_layers
from server import encode_image,decode_image

class DepthTests(unittest.TestCase):
    def test_saved_negative_gain_reports_collapsed_depth(self):
        from optics.depth_mapping import prepare
        raw=np.array([0.,.3,1.])
        bad=prepare(raw,Settings(depth_gain=-10.27,depth_bias=0,invert_depth=False))
        self.assertTrue(bad["statistics"]["collapsed"])
        self.assertIn("collapsed_depth_mapping",bad["warnings"])
        good=prepare(raw,Settings(depth_gain=1,depth_bias=0,invert_depth=False))
        self.assertFalse(good["statistics"]["collapsed"])
        np.testing.assert_allclose(good["nearness"],raw)

    def test_gain_bias_are_applied_before_direction_and_clamp(self):
        s=Settings(depth_gain=2,depth_bias=-.25,invert_depth=True)
        np.testing.assert_allclose(depth_nearness(np.array([0,.25,.5,1]),s),[1,.75,.25,0])
        np.testing.assert_equal(depth_nearness([np.nan],s),[0]) # Invalid depth uses far; never alpha.

    def test_larger_values_can_read_farther_away(self):
        s=Settings(invert_depth=True,near_m=2,far_m=10,depth_mode='slicing',depth_slices=8)
        masks=depth_layers(np.linspace(0,1,101),s)
        distances=np.array([d for d,_ in masks]);weights=np.array([m for _,m in masks])
        np.testing.assert_allclose(weights.sum(0),1,atol=1e-14)
        self.assertTrue(np.all(np.diff(distances)<0))
        expected_diopters=np.sum(weights/distances[:,None],axis=0)
        self.assertTrue(np.all(np.diff(expected_diopters)<=0))
        self.assertAlmostEqual(1/expected_diopters[0],2)
        self.assertAlmostEqual(1/expected_diopters[-1],10)

    def test_ramp_masks_change_continuously_at_slice_boundaries(self):
        s=Settings(depth_mode='slicing',depth_slices=12)
        d=5/11
        a=np.array([m for _,m in depth_layers(np.array([d-1e-5]),s)])
        b=np.array([m for _,m in depth_layers(np.array([d+1e-5]),s)])
        self.assertLess(np.max(np.abs(a-b)),.00023)
        np.testing.assert_allclose(a.sum(0),1);np.testing.assert_allclose(b.sum(0),1)

    def test_cut_band_varies_blur_depth_not_two_plane_opacity(self):
        s=Settings(depth_mode='cut',depth_cut=.4,depth_feather=.1,depth_slices=12)
        d=np.linspace(.3,.5,101)
        layers=depth_layers(d,s)
        self.assertEqual(len(layers),12)
        weights=np.array([m for _,m in layers])
        np.testing.assert_allclose(weights.sum(0),1,atol=1e-14)
        distances=np.array([z for z,_ in layers])
        inverse=np.sum(weights/distances[:,None],axis=0)
        self.assertTrue(np.all(np.diff(inverse)>=-1e-14))
        self.assertGreater(len(np.unique(inverse)),90)
        self.assertAlmostEqual(inverse[0],1/s.far_m)
        self.assertAlmostEqual(inverse[-1],1/s.near_m)

    def test_cut_transition_render_matches_intermediate_depth_reference(self):
        # Known finite PSF isolates composition from lens sampling noise.
        from unittest.mock import patch, Mock
        from dataclasses import replace
        from optics.core import render
        from optics.depth_mapping import blur_transition
        y,x=np.mgrid[:16,:24]
        rgb=np.stack([x/23,y/15,(x+y)/38],axis=2)
        depth=np.broadcast_to(np.linspace(0,1,24),(16,24))
        s=Settings(depth_mode='cut',depth_cut=.5,depth_feather=.3,
                   depth_slices=8,invert_depth=False)
        lens=Mock();lens.spots.return_value=(None,None,1.)
        psf=np.full((3,3,3),1/9)
        with patch('optics.core.get_lens',return_value=lens),patch('optics.core.make_psf',return_value=(psf,1.,True)):
            actual,_=render(rgb,s,depth)
            reference,_=render(rgb,replace(s,depth_mode='slicing'),blur_transition(depth,s))
        np.testing.assert_allclose(actual,reference,rtol=0,atol=1e-12)

    def test_hard_cut_keeps_two_planes(self):
        s=Settings(depth_mode='cut',depth_cut=.4,depth_feather=0)
        layers=depth_layers(np.array([0,.2,.6,1]),s)
        self.assertEqual(len(layers),2)
        np.testing.assert_array_equal(layers[1][1],[0,0,1,1])

    def test_color_channel_is_selected_without_srgb_decoding(self):
        rgb=np.empty((16,16,3));rgb[:]=[.2,.4,.8];data=encode_image(rgb)
        for channel,expected in [('r',.2),('g',.4),('b',.8),('a',1)]:
            d,_=decode_image(data,128,True,channel)
            np.testing.assert_allclose(d,expected,atol=1/255)
        d,_=decode_image(data,128,True,'luma')
        np.testing.assert_allclose(d,.2*.2126+.4*.7152+.8*.0722,atol=1/255)

    def test_invalid_controls_are_rejected(self):
        for raw in [{'depth_slices':4.5},{'depth_slices':33},{'depth_channel':'xyz'},
                    {'depth_mode':'unknown'},{'depth_gain':float('nan')},{'depth_bias':11}]:
            with self.assertRaises(ValueError):Settings.parse(raw)

if __name__=='__main__':unittest.main()
