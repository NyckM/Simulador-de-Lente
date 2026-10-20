Bruxosdovfx Resolve {version} / {language} / macOS (Apple Silicon + Intel)

OFX plugin "Bruxosdovfx Defocus" (Lens Blur Simulator) for DaVinci Resolve on macOS 11 or later.
Source: see source/SOURCE.txt.

INSTALL
1. Quit DaVinci Resolve.
2. Open Terminal, type "cd " (with a space), drag this folder onto the Terminal window, press Return, then run:
       bash install.command
   It asks for your Mac password, copies the plugin to /Library/OFX/Plugins, clears the download
   quarantine flag and runs the plugin's OFX host checks on your Mac. It should end with "PASS".
3. Start Resolve. The effect is under Effects > OpenFX > Bruxosdovfx.

Manual install: copy BruxosdovfxDesfoque.ofx.bundle to /Library/OFX/Plugins, then run
    sudo xattr -dr com.apple.quarantine /Library/OFX/Plugins/BruxosdovfxDesfoque.ofx.bundle
Uninstall: delete /Library/OFX/Plugins/BruxosdovfxDesfoque.ofx.bundle.

DIFFERENCES FROM WINDOWS
- GPU: Metal in place of CUDA. Engine "Automatic (Metal / CPU)" renders on the Mac's GPU and falls back
  to the CPU engine if Metal is not available; "CPU" forces the CPU engine. As on Windows, the post
  filters run on the CPU. Builds without the Metal kernels (Contents/Resources/*.metallib) are CPU only.
- The lens dirt texture is in Contents/Resources.
- validation/host-CPU.txt and host-GPU.txt are the host check output from the Mac that built this
  package, when they ran there (build machines without a GPU skip the Metal checks).

------------------------------------------------------------------------------------------------------

LEIA-ME (PT-BR)

Instalação: feche o Resolve. No Terminal, digite "cd " (com espaço), arraste esta pasta para a janela,
aperte Return e rode:  bash install.command
Ele pede a senha do Mac, copia o plugin para /Library/OFX/Plugins, remove a quarentena do download e roda
os testes do host OFX no seu Mac (deve terminar com "PASS"). Depois abra o Resolve:
Effects > OpenFX > Bruxosdovfx.

Diferenças: no lugar do CUDA, a GPU do Mac via Metal. O motor "Automatic (Metal / CPU)" usa a GPU e
volta para a CPU se o Metal não estiver disponível; "CPU" força a CPU. Os filtros de pós continuam na
CPU, como no Windows.
