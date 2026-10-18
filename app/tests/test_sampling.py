import unittest
from optics.core import Settings

class SamplingTests(unittest.TestCase):
    def test_defaults_leave_optical_dither_and_highlight_detail_off(self):
        s=Settings.parse({})
        self.assertFalse(s.bokeh_dither);self.assertFalse(s.highlight_detail)
        self.assertEqual(s.dither_amount,1);self.assertEqual(s.highlight_view,'final')

    def test_sampling_controls_validate_and_survive_parse(self):
        s=Settings.parse(dict(bokeh_dither=True,dither_amount=2,highlight_detail=True,
                             highlight_quality=256,highlight_threshold=1.5,highlight_view='coverage'))
        self.assertTrue(s.bokeh_dither);self.assertEqual(s.dither_amount,2)
        self.assertTrue(s.highlight_detail);self.assertEqual(s.highlight_quality,256)
        self.assertEqual(s.highlight_threshold,1.5);self.assertEqual(s.highlight_view,'coverage')
        for raw in [dict(bokeh_dither=1),dict(highlight_detail='yes'),dict(dither_amount=-1),
                    dict(dither_amount=float('nan')),dict(highlight_quality=100),dict(highlight_quality=True),
                    dict(highlight_threshold=-.1),dict(highlight_view='unknown')]:
            with self.assertRaises(ValueError):Settings.parse(raw)

if __name__=='__main__':unittest.main()
