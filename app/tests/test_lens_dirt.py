from dataclasses import replace
import unittest
import numpy as np
from optics.core import Settings
from optics.lens_dirt import apply_dirt,dirt_map
from test_custom_aperture import mask_uri


class DirtTests(unittest.TestCase):
    def test_disabled_preserves_input_exactly(self):
        image=np.ones((32,64,3),dtype='f4')
        self.assertIs(apply_dirt(image,Settings()),image)

    def test_custom_mask_blocks_white_and_leaves_black_clear(self):
        mask=np.zeros((64,64),dtype='uint8');mask[:,:32]=255
        s=Settings(lens_dirt_amount=.5,lens_dirt_block=1,lens_dirt_scatter=0,lens_dirt_texture=mask_uri(mask))
        image=np.ones((64,64,3),dtype='f4');out=apply_dirt(image,s)
        np.testing.assert_allclose(out[:,4:24],.5)
        np.testing.assert_allclose(out[:,40:60],1)
        rotated=apply_dirt(image,replace(s,lens_dirt_rotation=180))
        np.testing.assert_allclose(rotated[:,40:60],.5)
        np.testing.assert_allclose(rotated[:,4:24],1)

    def test_only_bright_lights_scatter_and_texture_stays_fixed(self):
        s=Settings(lens_dirt_amount=.5,lens_dirt_block=0,lens_dirt_scatter=4,lens_dirt_threshold=1,lens_dirt_radius=120)
        dark=np.full((64,64,3),.1,dtype='f4')
        np.testing.assert_array_equal(apply_dirt(dark,s),dark)
        light=dark.copy();light[30:34,30:34]=5
        out=apply_dirt(light,s)
        self.assertGreater(out[25,32,0],light[25,32,0])
        np.testing.assert_array_equal(dirt_map(s,64,64),dirt_map(s,64,64))
        self.assertGreater(np.abs(dirt_map(s,64,64)-dirt_map(replace(s,lens_dirt_seed=2),64,64)).mean(),.01)

    def test_invalid_texture_and_bounds_are_rejected(self):
        for data in ({'lens_dirt_texture':'invalid'},{'lens_dirt_amount':2},{'lens_dirt_radius':0}):
            with self.assertRaises(ValueError):Settings.parse(data)
