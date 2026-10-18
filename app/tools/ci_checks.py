"""Run the portable optics checks and optionally the actual browser UI tests."""
from pathlib import Path
import argparse, importlib.metadata, json, os, subprocess, sys, tempfile, time, urllib.request

ROOT = Path(__file__).resolve().parents[1]

def run(browser=False):
    results = ROOT/'ci-results'
    results.mkdir(exist_ok=True)
    (ROOT/'research').mkdir(exist_ok=True)
    dependencies={name:importlib.metadata.version(name) for name in ('numpy','scipy','pillow','pywebview','pyinstaller')}
    (results/'dependencies.json').write_text(json.dumps(dependencies,indent=2),encoding='utf-8')
    env = dict(os.environ, OPTICA_RAY_BACKEND='cpu', PYTHONUTF8='1')
    commands = [
        [sys.executable, 'desktop.py', '--ci-check', 'ci-results/source.json'],
        [sys.executable, '-m', 'unittest', 'discover', '-s', 'tests', '-p', 'test_platform_support.py', '-v'],
        [sys.executable, '-m', 'unittest', 'discover', '-s', 'tests', '-p', 'test_desktop_export.py', '-v'],
        [sys.executable, '-m', 'unittest', 'discover', '-s', 'tests', '-p', 'test_cuda_worker.py', '-v'],
        [sys.executable, '-m', 'unittest', 'discover', '-s', 'tests', '-p', 'test_depth.py', '-v'],
        [sys.executable, '-m', 'unittest', 'discover', '-s', 'tests', '-p', 'test_depth_focus.py', '-v'],
        [sys.executable, '-m', 'unittest', 'discover', '-s', 'tests', '-p', 'test_demo_payloads.py', '-v'],
        [sys.executable, '-m', 'unittest', 'discover', '-s', 'tests', '-p', 'test_filter_transform.py', '-v'],
        [sys.executable, '-m', 'unittest', 'discover', '-s', 'tests', '-p', 'test_filters.py', '-v'],
        [sys.executable, 'tests/make_filter_fixtures.py'],
        [sys.executable, 'tests/check_edge_compensation.py'],
    ] + [[sys.executable, 'tests/'+name] for name in (
        'check_geometry017.py', 'check_geometry018.py', 'check_geometry019.py', 'check_geometry020.py', 'check_geometry021.py', 'check_geometry022.py', 'check_geometry023.py', 'check_geometry024.py', 'check_geometry025.py', 'check_geometry026.py', 'check_depth_lifecycle015.py', 'check_depth_models.py', 'check_depth_stage13.py', 'check_wavefront_stage11.py',
        'check_spectral_psf_stage12.py', 'check_ghosts_stage16.py')]
    if browser:
        commands.append(['node', 'tests/check_focus_picker.js'])
        commands.append(['node', 'tests/check_depth_contract_stage13.js'])
        commands.append(['node', 'tests/check_depth_range016.js'])
    record = {'passed': False, 'browser_requested': browser, 'commands': []}
    server = None
    with tempfile.TemporaryDirectory(prefix='bruxos-ci-') as user:
        env['OPTICA_USER_DATA'] = user
        try:
            for index, command in enumerate(commands):
                with (results/f'check-{index}.log').open('w', encoding='utf-8') as log:
                    subprocess.run(command, cwd=ROOT, env=env, stdout=log, stderr=subprocess.STDOUT,
                                   check=True, timeout=600)
                record['commands'].append(command[1:])
            if browser:
                env.update(OPTICA_TEST_URL='http://127.0.0.1:8893', OPTICA_TEST_BROWSER=env.get('OPTICA_TEST_BROWSER','chromium'), CI='1')
                with (results/'server.log').open('w', encoding='utf-8') as log:
                    server = subprocess.Popen([sys.executable, 'server.py', '--port', '8893', '--test'],
                                              cwd=ROOT, env=env, stdout=log, stderr=subprocess.STDOUT)
                    deadline = time.monotonic()+40
                    while True:
                        if server.poll() is not None:raise RuntimeError('CI server exited; see server.log')
                        try:
                            with urllib.request.urlopen(env['OPTICA_TEST_URL']+'/api/health', timeout=2):break
                        except OSError:
                            if time.monotonic()>deadline:raise RuntimeError('CI server timed out')
                            time.sleep(.25)
                    browser_tests=('check_lens_flare_v1_ui.js','check_edge_compensation_ui.js','check_focus_anchor_ui.js',)+(('check_v1_flows.js',) if env.get('OPTICA_V1_VIDEO') else ())
                    for name in browser_tests+('check_filters_v1_ui.js', 'check_filter_transform_ui.js', 'check_layout029_ui.js', 'check_cuda_interaction029_ui.js', 'check_blur_transition028_ui.js', 'check_menu026_ui.js', 'check_lens_reset026_ui.js', 'check_preview_stall026_ui.js', 'check_optics_workspace026_ui.js', 'check_geometry026_ui.js', 'check_geometry025_ui.js', 'check_geometry024_ui.js', 'check_geometry023_ui.js', 'check_geometry022_ui.js', 'check_geometry021_ui.js', 'check_geometry020_ui.js', 'check_geometry019_ui.js', 'check_geometry018_ui.js', 'check_geometry017_ui.js', 'check_depth_range016_ui.js', 'check_depth_models_ui015.js', 'check_depth_cut_edit.js', 'check_layers_stage15.js'):
                        with (results/(name+'.log')).open('w', encoding='utf-8') as testlog:
                            subprocess.run(['node', 'tests/'+name], cwd=ROOT, env=env, stdout=testlog,
                                           stderr=subprocess.STDOUT, check=True, timeout=600)
                        record['commands'].append(['tests/'+name])
            record['passed'] = True
        except Exception as error:
            record['error'] = str(error)
        finally:
            if server is not None:
                server.terminate()
                try:server.wait(timeout=10)
                except subprocess.TimeoutExpired:server.kill();server.wait(timeout=10)
    (results/'checks.json').write_text(json.dumps(record, indent=2), encoding='utf-8')
    if not record['passed']:raise SystemExit(record['error'])
    print(json.dumps(record, indent=2))

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--browser', action='store_true')
    run(parser.parse_args().browser)
