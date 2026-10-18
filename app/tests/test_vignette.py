import unittest
import numpy as np
from optics.vignette import vignette_mask
from optics.core import Settings

class VignetteTests(unittest.TestCase):
    def test_zero_is_identity_and_center_is_preserved(self):
        np.testing.assert_array_equal(vignette_mask(400,640,0),np.ones((400,640)))
        mask=vignette_mask(400,640,.8)
        np.testing.assert_array_equal(mask[160:240,280:360],np.ones((80,80)))
        self.assertLess(mask[0,0],.21)
        self.assertGreater(mask.min(),0)

    def test_falloff_is_symmetric_and_resolution_independent(self):
        mask=vignette_mask(400,640,.8)
        np.testing.assert_allclose(mask,mask[::-1,::-1],atol=1e-14)
        large=vignette_mask(800,1280,.8)
        self.assertLess(np.abs(mask-large[::2,::2]).max(),.003)
        self.assertGreater(mask[200,500],mask[200,620])

    def test_invalid_strength_is_rejected(self):
        for value in (-.1,1.1,float('nan')):
            with self.assertRaises(ValueError):Settings.parse({'vignette_amount':value})
