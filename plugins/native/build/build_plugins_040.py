# 1.2.17 native port (filters, prism types, starburst, lens dirt, recovery, gaussian flare splats).
# Run from the "ol" folder. Same steps as build_plugins_031.py, output in work/plugins-040-hosts.
from pathlib import Path
import subprocess,shutil,json,os,sys
base=Path.cwd();src=base/'outputs/OpticaLab';out=base/'work/plugins-040-hosts';out.mkdir(exist_ok=True)
vc=os.environ.get('BRUXOS_VCVARS','C:/Program Files (x86)/Microsoft Visual Studio/2019/BuildTools/VC/Auxiliary/Build/vcvars64.bat');sdk=base/'work/ae-sdk';ofx=base/'work/openfx/include';results=[]
for n,lang in enumerate(['PT-BR','EN','ZH-CN']):
 for host,folder,binary in [('AE','ae','BruxosdovfxDesfoque.aex'),('Nuke','nuke','BruxosdovfxNuke.ofx'),('Resolve','ofx','BruxosdovfxDesfoque.ofx')]:
  target=out/lang/host;target.mkdir(parents=True,exist_ok=True);native=src/'native'/folder;log=target/'build.log'
  lines=['@echo off',f'call "{vc}" >nul',f'cd /d "{native}"']
  if host=='AE':
   lines += [f'cl /nologo /utf-8 /EP /DBRUXOS_LANGUAGE={n} /I"{sdk}/Headers" /Tc Bruxosdovfx.r >"{target}/Bruxosdovfx.rr"','if errorlevel 1 exit /b 1',f'"{sdk}/Resources/PiPLtool.exe" "{target}/Bruxosdovfx.rr" "{target}/Bruxosdovfx.rrc"','if errorlevel 1 exit /b 1',f'"{sys.executable}" "{base}/work/fix_pipl_encoding.py" "{target}/Bruxosdovfx.rrc" {n}','if errorlevel 1 exit /b 1',f'cl /nologo /utf-8 /EP /DMSWindows /Tc "{target}/Bruxosdovfx.rrc" >"{target}/Bruxosdovfx.rc"',f'rc /nologo /fo "{target}/Bruxosdovfx.res" "{target}/Bruxosdovfx.rc"','if errorlevel 1 exit /b 1',f'cl /nologo /utf-8 /O2 /EHsc /std:c++17 /openmp /MT /D_WINDOWS /DBRUXOS_LANGUAGE={n} /LD /I"{sdk}/Headers" /I"{sdk}/Headers/SP" /I"{sdk}/Util" Effect.cpp LensCore.cpp NativeEngine.cpp StackEngine.cpp CpuEngine.generated.cpp "{target}/Bruxosdovfx.res" /Fe"{target}/{binary}" /link /EXPORT:EffectMain','if errorlevel 1 exit /b 1',f'cl /nologo /utf-8 /O2 /EHsc /std:c++17 /MT /DBRUXOS_LANGUAGE={n} /I"{sdk}/Headers" /I"{sdk}/Headers/SP" HostTest.cpp /Fe"{target}/HostTest.exe"']
  else:
   lines += [f'cl /nologo /utf-8 /O2 /EHsc /std:c++17 /openmp /MT /DBRUXOS_LANGUAGE={n} /LD /I"{src}/native/ae" /I"{ofx}" Plugin.cpp NativeEngine.cpp ../ae/StackEngine.cpp ../ae/LensCore.cpp ../ae/CpuEngine.generated.cpp /Fe"{target}/{binary}"','if errorlevel 1 exit /b 1',f'cl /nologo /utf-8 /O2 /EHsc /std:c++17 /MT /I"{ofx}" HostTest.cpp /Fe"{target}/HostTest.exe"']
  lines+=['if errorlevel 1 exit /b 1','exit /b 0'];cmd=target/'build.cmd';cmd.write_text('\n'.join(lines),encoding='utf-8')
  with log.open('w',encoding='utf-8') as f:c=subprocess.run(['cmd','/c',str(cmd)],stdout=f,stderr=subprocess.STDOUT)
  if c.returncode:raise RuntimeError(f'{host} {lang}: {log.read_text(errors="replace")[-2500:]}')
  dll='optica_cuda.dll' if host=='AE' else 'bruxos_nuke_cuda.dll' if host=='Nuke' else 'bruxos_ofx_cuda.dll';shutil.copy2(src/'native/ae/bin/optica_cuda.dll',target/dll);shutil.copy2(src/'native/ae/bin/bruxos_layers_cuda.dll',target/'bruxos_layers_cuda.dll')
  shutil.copy2(src/'native/ae/bruxos_dirt.rgba',target/'bruxos_dirt.rgba')
  cpu=target/'cpu';cpu.mkdir(exist_ok=True);shutil.copy2(target/binary,cpu/binary);shutil.copy2(src/'native/ae/bruxos_dirt.rgba',cpu/'bruxos_dirt.rgba')
  for mode,plugin in [('CUDA',target/binary),('CPU',cpu/binary)]:
   run=subprocess.run([str(target/'HostTest.exe'),str(plugin)]+(['--cpu-fallback'] if mode=='CPU' else []),cwd=native,env={**os.environ,'OMP_NUM_THREADS':'8'},stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
   (target/f'host-test-{mode}.txt').write_text(run.stdout,encoding='utf-8')
   if run.returncode:raise RuntimeError(f'{host} {lang} {mode}: {run.stdout[-2000:]}')
   result={'host':host,'language':lang,'mode':mode,'summary':run.stdout.splitlines()[-1]};results.append(result);print(json.dumps(result),flush=True)
(out/'results.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
