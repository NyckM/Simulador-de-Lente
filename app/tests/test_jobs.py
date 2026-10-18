import tempfile, unittest
from pathlib import Path
from unittest.mock import patch, Mock
from optics import jobs

class JobTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.cache=Path(self.temp.name)
        self.patches=[patch.object(jobs,'CACHE',self.cache),patch.object(jobs,'PYTHON',Path(__file__)),patch.object(jobs,'JOBS',{})]
        for p in self.patches:p.start()
    def tearDown(self):
        for p in reversed(self.patches):p.stop()
        self.temp.cleanup()
    def test_path_escape_rejected(self):
        for key in ['../source','C:/Windows','a'*31,'a'*32+'/..']:
            with self.assertRaises(ValueError):jobs.folder(key)
    def test_cancelled_upload_cannot_launch_worker(self):
        key=jobs.create({'model':'da2','kind':'image'},'depth')['id']
        (jobs.folder(key)/'source').write_bytes(b'test');jobs.cancel(key)
        with patch.object(jobs.subprocess,'Popen') as launch:
            with self.assertRaises(ValueError):jobs.run(key)
            launch.assert_not_called()
    def test_second_worker_rejected(self):
        key=jobs.create({'model':'da2','kind':'image'},'depth')['id']
        (jobs.folder(key)/'source').write_bytes(b'test')
        running=Mock();running.poll.return_value=None;jobs.JOBS['another']={'process':running}
        with self.assertRaises(ValueError):jobs.run(key)
    def test_video_format_rejected_before_encoder(self):
        with patch.object(jobs.subprocess,'Popen') as launch:
            for fps in [0,100,float('nan')]:
                with self.assertRaises(ValueError):jobs.create({'width':1920,'height':1080,'fps':fps},'video')
            launch.assert_not_called()

    def test_transient_status_read_keeps_last_progress(self):
        key=jobs.create({'model':'moge','kind':'image'},'depth')['id']
        jobs.JOBS[key]={'last_status':{'state':'running','current':87,'total':121}}
        with patch.object(Path,'read_text',side_effect=PermissionError(13,'sharing conflict')):
            self.assertEqual(jobs.status(key)['current'],87)
            self.assertEqual(jobs.status(key)['state'],'running')
