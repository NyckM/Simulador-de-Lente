import ctypes, json, os, tempfile, threading, time, unittest
from pathlib import Path
from unittest.mock import patch
from optics.worker_status import write_status

class WorkerStatusTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.folder=Path(self.temp.name)
        (self.folder/'status.json').write_text('{"state":"loading"}')
    def tearDown(self):self.temp.cleanup()
    def test_transient_replacement_is_retried(self):
        original=os.replace;calls=[]
        def busy(source,target):
            calls.append(1)
            if len(calls)<3:raise PermissionError(13,'reader holds file')
            original(source,target)
        with patch('optics.worker_status.os.replace',side_effect=busy),patch('optics.worker_status.time.sleep'):
            self.assertTrue(write_status(self.folder,{'state':'running','current':87}))
        self.assertEqual(json.loads((self.folder/'status.json').read_text())['current'],87)
        self.assertEqual(len(calls),3);self.assertEqual(list(self.folder.glob('*.tmp')),[])
    def test_intermediate_lock_does_not_abort_inference(self):
        with patch('optics.worker_status.os.replace',side_effect=PermissionError(13,'locked')),patch('optics.worker_status.time.sleep'):
            self.assertFalse(write_status(self.folder,{'state':'running','current':87}))
        self.assertEqual(json.loads((self.folder/'status.json').read_text())['state'],'loading')
        self.assertEqual(list(self.folder.glob('*.tmp')),[])
        self.assertTrue(write_status(self.folder,{'state':'complete','count':121}))
    def test_terminal_lock_is_reported_after_retries(self):
        with patch('optics.worker_status.os.replace',side_effect=PermissionError(13,'locked')),patch('optics.worker_status.time.sleep'):
            with self.assertRaisesRegex(RuntimeError,'permanece bloqueado'):write_status(self.folder,{'state':'complete'})
        self.assertEqual(list(self.folder.glob('*.tmp')),[])
    def test_unrelated_errors_are_not_suppressed(self):
        with patch('optics.worker_status.os.replace',side_effect=OSError(28,'disk full')):
            with self.assertRaises(OSError):write_status(self.folder,{'state':'running'})
        self.assertEqual(list(self.folder.glob('*.tmp')),[])
    @unittest.skipUnless(os.name=='nt','Windows sharing contract')
    def test_real_windows_reader_lock(self):
        api=ctypes.windll.kernel32;api.CreateFileW.restype=ctypes.c_void_p
        api.CreateFileW.argtypes=[ctypes.c_wchar_p,ctypes.c_ulong,ctypes.c_ulong,ctypes.c_void_p,ctypes.c_ulong,ctypes.c_ulong,ctypes.c_void_p]
        api.CloseHandle.argtypes=[ctypes.c_void_p]
        handle=api.CreateFileW(str(self.folder/'status.json'),0x80000000,1,None,3,0,None)
        self.assertNotEqual(handle,ctypes.c_void_p(-1).value)
        release=threading.Timer(.15,lambda:api.CloseHandle(handle));release.start()
        try:self.assertTrue(write_status(self.folder,{'state':'complete','count':121}))
        finally:release.join()
        self.assertEqual(json.loads((self.folder/'status.json').read_text())['count'],121)
    def test_polling_sees_atomic_json(self):
        stop=threading.Event();errors=[]
        def read():
            while not stop.is_set():
                try:json.loads((self.folder/'status.json').read_text())
                except OSError:pass
                except Exception as exc:errors.append(exc)
        reader=threading.Thread(target=read);reader.start()
        try:
            for frame in range(150):write_status(self.folder,{'state':'running','current':frame,'padding':'x'*2000})
            write_status(self.folder,{'state':'complete','count':150})
        finally:stop.set();reader.join()
        self.assertEqual(errors,[]);self.assertEqual(json.loads((self.folder/'status.json').read_text())['state'],'complete')
