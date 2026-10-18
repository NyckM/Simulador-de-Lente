"""Concurrent demo endpoints reuse one scene without changing linear pixels."""
import unittest
from unittest.mock import patch
from concurrent.futures import ThreadPoolExecutor
import numpy as np
import server
class DemoPayloads(unittest.TestCase):
 def test_concurrent_formats_share_scene_and_preserve_linear_values(self):
  rgb=np.full((16,16,3),2.,dtype='f8');depth=np.ones((16,16));old=server._demo_payload
  try:
   server._demo_payload=None
   with patch('server.demo',return_value=(rgb,depth)) as build,ThreadPoolExecutor(2) as pool:
    results=list(pool.map(lambda _:server.demo_payloads(),range(2)))
   self.assertEqual(build.call_count,1);self.assertIs(results[0],results[1])
   metadata,buffer=results[0];self.assertEqual(metadata['width'],16)
   linear=np.frombuffer(buffer,dtype='<f4').reshape(16,16,4)
   np.testing.assert_array_equal(linear[:,:,:3],rgb)
   np.testing.assert_array_equal(linear[:,:,3],1)
   self.assertTrue(metadata['image'].startswith('data:image/png;base64,'))
  finally:server._demo_payload=old
if __name__=='__main__':unittest.main()
