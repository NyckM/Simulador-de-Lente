import base64
from io import BytesIO
import json
import threading
import unittest
from urllib.request import Request, urlopen
from urllib.error import HTTPError
import numpy as np
from PIL import Image
from http.server import ThreadingHTTPServer
from server import Handler, decode_image, encode_image


class ImageTests(unittest.TestCase):
    def test_16_bit_depth_preserved(self):
        pixels=np.linspace(0,65535,32*32).reshape(32,32).astype(np.uint16)
        stream=BytesIO();Image.fromarray(pixels).save(stream,format='PNG')
        data='data:image/png;base64,'+base64.b64encode(stream.getvalue()).decode()
        decoded,size=decode_image(data,768,True)
        self.assertEqual(size,(32,32))
        np.testing.assert_allclose(decoded,pixels/65535,atol=1e-7)

    def test_resize_preserves_aspect(self):
        data=encode_image(np.zeros((400,800,3)))
        decoded,size=decode_image(data,384)
        self.assertEqual(size,(800,400))
        self.assertEqual(decoded.shape,(192,384,3))


class ApiTests(unittest.TestCase):
    def test_focus_script_is_delivered_to_the_browser(self):
        with urlopen(self.url+'/lens-view.js', timeout=10) as response:
            self.assertEqual(response.status, 200)
            self.assertIn('javascript', response.headers['Content-Type'])
            self.assertIn(b'focusAfterTranslation', response.read())

    def test_quality_script_is_delivered_to_the_browser(self):
        with urlopen(self.url+'/quality.js', timeout=10) as response:
            self.assertEqual(response.status,200)
            self.assertIn('javascript',response.headers['Content-Type'])
            self.assertIn(b'LensQuality',response.read())

    def test_lens_presets_script_is_delivered(self):
        with urlopen(self.url+'/presets.js',timeout=10) as response:
            self.assertEqual(response.status,200)
            self.assertIn(b'helios_44_2',response.read())

    def test_personal_profile_controls_and_script_are_delivered(self):
        with urlopen(self.url+'/profile-store.js',timeout=10) as response:
            self.assertIn(b'ProfileStore',response.read())
        with urlopen(self.url+'/',timeout=10) as response:
            page=response.read()
            for control in ('reset-profile','save-profile','update-profile','import-profile','export-profile','profile-input'):
                self.assertIn(('id="'+control+'"').encode(),page)

    def test_depth_focus_controls_are_delivered(self):
        with urlopen(self.url+'/depth-utils.js',timeout=10) as response:
            self.assertIn(b'DepthUtils',response.read())
        with urlopen(self.url+'/',timeout=10) as response:
            page=response.read()
            for control in ('focus-depth','focus-near','focus-far'):
                self.assertIn(('id="'+control+'"').encode(),page)

    @classmethod
    def setUpClass(cls):
        cls.server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
        cls.thread=threading.Thread(target=cls.server.serve_forever,daemon=True)
        cls.thread.start()
        cls.url=f'http://127.0.0.1:{cls.server.server_port}'

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown();cls.server.server_close();cls.thread.join()

    def post(self,body,origin=None):
        headers={'Content-Type':'application/json'}
        if origin:headers['Origin']=origin
        request=Request(self.url+'/api/render',data=json.dumps(body).encode(),headers=headers)
        with urlopen(request,timeout=60) as response:return json.load(response)

    def test_image_render_export_and_depth(self):
        image=encode_image(np.full((32,48,3),.5))
        depth=encode_image(np.zeros((32,48)))
        result=self.post({'image':image,'depth':depth,'settings':{'source_m':5,'near_m':2,'far_m':5}})
        self.assertEqual((result['width'],result['height']),(48,32))
        data=base64.b64decode(result['image'].split(',')[1])
        with Image.open(BytesIO(data)) as im:
            self.assertEqual(im.format,'PNG');self.assertEqual(im.size,(48,32))
        self.assertTrue(any('camadas' in w for w in result['warnings']))

    def test_depth_dimension_mismatch_is_rejected(self):
        with self.assertRaises(HTTPError) as e:
            self.post({'image':encode_image(np.zeros((32,48,3))),'depth':encode_image(np.zeros((32,32)))})
        self.assertEqual(e.exception.code,400)

    def test_foreign_origin_is_rejected(self):
        with self.assertRaises(HTTPError) as e:self.post({},'https://example.com')
        self.assertEqual(e.exception.code,403)

    def test_edited_glass_reaches_diagnostics_and_gpu_atlas(self):
        def route(path, settings):
            request=Request(self.url+path,data=json.dumps({'settings':settings}).encode(),
                            headers={'Content-Type':'application/json'})
            with urlopen(request,timeout=60) as response:return json.load(response)
        original=route('/api/diagnostics',{})
        settings={'lens_edits':[[0,'curvature_radius',31.0]]}
        changed=route('/api/diagnostics',settings)
        self.assertEqual(changed['surfaces'][0]['curvature_radius'],31)
        self.assertNotAlmostEqual(changed['efl_mm'],original['efl_mm'],places=2)
        atlas=route('/api/kernel',settings)
        self.assertAlmostEqual(atlas['efl_mm'],changed['efl_mm'],places=4)
        live=route('/api/layout',{'lens_edits':[[5,'thickness',5.5]]})
        self.assertAlmostEqual(live['surfaces'][6]['z']-original['surfaces'][6]['z'],1.0)
        self.assertEqual(len(live['rays']),19)


if __name__=='__main__':unittest.main()
