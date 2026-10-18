import base64,io,unittest
from dataclasses import replace
import numpy as np
from PIL import Image
from optics.aperture import mask_image,mask_coverage
from optics.core import Settings,get_lens
from optics.preview import kernel
from optics import vulkan

def mask_uri(image):
    b=io.BytesIO();Image.fromarray(image).save(b,format='PNG');return 'data:image/png;base64,'+base64.b64encode(b.getvalue()).decode()
def stripe_mask():
    image=np.zeros((128,128),dtype='uint8');image[48:80,10:118]=255;return mask_uri(image)

class ApertureTests(unittest.TestCase):
    def test_rotating_mask_rotates_physical_opening(self):
        s=Settings(aperture_mask=stripe_mask(),aperture_custom=True,iris_mm=8,rotation=0)
        q=np.array([[4,0],[0,4],[9,0],[float('nan'),0]])
        np.testing.assert_allclose(mask_coverage(q,s),[1,0,0,0])
        np.testing.assert_allclose(mask_coverage(q,replace(s,rotation=90)),[0,1,0,0])
        np.testing.assert_allclose(mask_coverage(q,replace(s,aperture_invert=True)),[0,1,0,0])
    def test_alpha_and_gray_transmit_partial_energy(self):
        image=np.ones((16,16,4),dtype='uint8')*255;image[...,3]=128
        s=Settings(aperture_mask=mask_uri(image),aperture_custom=True)
        np.testing.assert_allclose(mask_coverage([[0,0]],s),[128/255])
    def test_size_and_empty_mask_validation(self):
        Settings.parse({'aperture_mask':mask_uri(np.ones((512,512),dtype='uint8')*255),'aperture_custom':True})
        for raw in [{'aperture_mask':mask_uri(np.ones((513,16),dtype='uint8'))}, {'aperture_custom':True}, {'aperture_custom':True,'aperture_mask':mask_uri(np.zeros((16,16),dtype='uint8'))}, {'aperture_mask':'invalid'}, {'aperture_custom':1}]:
            with self.assertRaises(ValueError):Settings.parse(raw)
    def test_mask_substitutes_blades_and_changes_ray_footprint(self):
        s=Settings(iris_mm=8.55,source_m=5,blades=3,aperture_mask=stripe_mask(),aperture_custom=True)
        lens=get_lens(s);a=lens.bundle((0,0),5,s,count=8192,history=True);b=lens.bundle((0,0),5,replace(s,blades=20),count=8192)
        np.testing.assert_array_equal(a[2],b[2]);self.assertGreater(a[2].sum(),100)
        stop=next(i for i,surface in enumerate(lens.surfaces) if surface.get('is_stop'))
        transmitted=a[4][stop+1][a[2],:2];self.assertGreater(np.std(transmitted[:,0]),np.std(transmitted[:,1])*2)
        off=lens.bundle((0,0),5,replace(s,aperture_custom=False),count=8192)
        self.assertGreater(off[2].sum(),a[2].sum())
    @unittest.skipUnless(vulkan.available(),'Vulkan unavailable')
    def test_native_gpu_and_cpu_mask_match_at_real_iris(self):
        s=Settings(iris_mm=8.55,blades=7,rotation=27,aperture_mask=stripe_mask(),aperture_custom=True)
        lens=get_lens(s);p,d,v,e,paths=lens.bundle((8,4),5,s,count=8192,history=True)
        origin=np.array([-8*5000/lens.efl,-4*5000/lens.efl,-5000]);direction=paths[0]-origin;direction/=np.linalg.norm(direction,axis=1)[:,None]
        a,b,c,f=vulkan.trace(lens,s,paths[0],direction,np.full(8192,.5876));both=v&c
        self.assertLessEqual(np.count_nonzero(v!=c),1);self.assertGreater(both.sum(),100)
        np.testing.assert_allclose(f[both],e[both],atol=.002,rtol=0)
        np.testing.assert_allclose(a[both],p[both],atol=.0005,rtol=0)
    def test_mask_participates_in_atlas_cache_key_and_disable_restores_it(self):
        s=Settings(ray_backend='cpu',iris_mm=8.55,aperture_mask=stripe_mask(),aperture_custom=True)
        a=kernel(s,taps=64,rays=1024);b=kernel(replace(s,aperture_custom=False),taps=64,rays=1024);c=kernel(replace(s,aperture_custom=False,aperture_mask=''),taps=64,rays=1024)
        self.assertIsNot(a,b);self.assertIs(b,c);self.assertNotEqual(a['pupils'],b['pupils'])
