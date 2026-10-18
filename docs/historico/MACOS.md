# Build macOS pelo GitHub Actions

Consulte [ETAPA18.md](ETAPA18.md) para enviar o código e executar **Actions → Build desktop app → Run workflow**.

A versão vem de `app_version.py`: os DMGs são `Bruxosdovfx-0.9.13-macOS-arm64.dmg` (Apple Silicon) e `Bruxosdovfx-0.9.13-macOS-x86_64.dmg` (Intel), com SHA256. São builds separadas para macOS 15+, usando Python 3.13, CPU para traçado e WebGL para a imagem. Os dois jobs usam os testes CPU e verificam o próprio app empacotado; a interface WebKit ainda precisa ser conferida em um Mac.

Os três idiomas, depth importado, camadas A/B/C e ghosts da Etapa 16 estão no código. O runtime de geração IA Windows e as bibliotecas CUDA/Vulkan Windows não são incluídos. FFmpeg deve estar instalado para MP4. Cache e preferências usam `~/Library/Application Support/Bruxosdovfx/OpticaLab`.

Assinatura ad hoc, sem Developer ID/notarização. Não há publicação automática de Releases. Esta entrega local não executou os builds no GitHub nem comprovou o app num Mac. Os plugins e seus SDKs não fazem parte deste pipeline.

Referências: [GitHub runners](https://docs.github.com/en/actions/reference/runners/github-hosted-runners), [PyInstaller](https://www.pyinstaller.org/en/stable/usage.html).
