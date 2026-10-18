"""Recovery of the isolated CUDA process, including an unresponsive child."""
import sys, time, unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from optics.cuda_worker import CUDAWorker


def fixture(connection):
    source = None
    while True:
        try:
            operation, args, kwargs = connection.recv()
        except EOFError:
            return
        if operation == 'hang':
            time.sleep(60)
        elif operation == 'upload':
            source = args[0]
            connection.send(('ok', source))
        elif operation == 'large-frame':
            import numpy as np
            from optics.cuda_worker import _send_render
            _send_render(connection,(np.full((512,512,4),args[0],dtype=args[1]),{'test':True}))
        elif operation == 'render':
            connection.send(('ok', source))
        elif operation == 'invalid':
            connection.send(('invalid', 'Invalid settings'))
        elif operation == 'failed':
            connection.send(('failed', 'Native failure'))
        elif operation == 'crash':
            connection.close()
            return


class Recovery(unittest.TestCase):
    def setUp(self):
        self.worker = CUDAWorker(fixture)
    def tearDown(self):
        self.worker.close()
    def test_hang_ends_process_and_new_source_renders(self):
        self.assertEqual(self.worker.call('upload', 'old', timeout=10), 'old')
        old = self.worker.process
        start = time.monotonic()
        with self.assertRaisesRegex(RuntimeError, 'prazo'):
            self.worker.call('hang', timeout=.3)
        self.assertLess(time.monotonic()-start, 5)
        self.assertFalse(old.is_alive())
        self.assertEqual(self.worker.call('render', timeout=10), None)
        self.assertEqual(self.worker.call('upload', 'latest', timeout=10), 'latest')
        self.assertEqual(self.worker.call('render'), 'latest')
        self.assertEqual(self.worker.generation, 2)
    def test_invalid_settings_do_not_discard_source(self):
        self.worker.call('upload', 'saved', timeout=10)
        with self.assertRaises(ValueError):
            self.worker.call('invalid')
        self.assertEqual(self.worker.call('render'), 'saved')
        self.assertEqual(self.worker.generation, 1)
    def test_crash_and_native_error_clear_worker(self):
        for operation in ('crash', 'failed'):
            self.worker.call('upload', 'old', timeout=10)
            old = self.worker.process
            with self.assertRaises(RuntimeError):
                self.worker.call(operation)
            self.assertFalse(old.is_alive())
            self.assertEqual(self.worker.call('upload', 'new', timeout=10), 'new')
    def test_shared_frames_own_pixels_after_worker_closes(self):
        import numpy as np
        saved=[]
        for value,dtype in [(0.25,'f2'),(0.75,'f4')]:
            image,metadata=self.worker.call('large-frame',value,dtype,timeout=10)
            self.assertEqual(metadata['workerTransfer'],'shared-memory-copy')
            self.assertTrue(image.flags.owndata)
            np.testing.assert_array_equal(image,np.full(image.shape,value,dtype=dtype))
            saved.append(image)
        self.worker.close()
        np.testing.assert_array_equal(saved[0],np.full(saved[0].shape,.25,dtype='f2'))
        np.testing.assert_array_equal(saved[1],np.full(saved[1].shape,.75,dtype='f4'))

    def test_busy_queue_has_deadline(self):
        self.worker.lock.acquire()
        try:
            with self.assertRaisesRegex(RuntimeError, 'ocupado'):
                self.worker.call('upload', 'stale', timeout=.1)
        finally:
            self.worker.lock.release()
        self.assertIsNone(self.worker.process)


if __name__ == '__main__':
    unittest.main()
