# Etapa 18 — compilação do app pelo GitHub

Versão 0.9.13. Mantém a Etapa 16 e a correção de digitação do Depth Cut. Esta entrega prepara a compilação multiplataforma; não implementa uma Etapa 17 nem altera plugins.

## Usar

1. Extraia **OpticaLab-Etapa18-GitHub-Fonte.zip** e coloque seu conteúdo na raiz do repositório, incluindo `.github`. Não envie o ZIP como um único arquivo e não coloque os arquivos dentro de uma pasta extra.
2. Abra **Actions → Build desktop app → Run workflow**. Push em main, pull requests relevantes e tags `v0.9.13`/`V0.9.13` também disparam o pipeline. A versão da tag precisa coincidir com `app_version.py`.
3. O job de testes precisa passar antes dos builds. Baixe os artefatos Windows, macOS arm64 ou macOS x86_64 na execução. Cada pacote acompanha SHA256 e metadados da build.

Os três idiomas ficam no mesmo app, com seletor no menu. O workflow tem apenas `contents: read`; não publica Releases. Nenhuma execução no GitHub foi realizada nesta máquina.

## O que é compilado e verificado

- Windows x64: PyInstaller, teste do executável empacotado, instalador Inno Setup e ZIP portátil. O WebView2 Evergreen é instalado quando necessário. O bootstrap e os workers de depth Windows são incluídos; pesos IA não são incluídos.
- macOS 15+: builds nativas separadas Apple Silicon e Intel, metadados de versão, verificação de arquitetura, teste CPU dentro do pacote, verificação da assinatura ad hoc e DMG.
- Testes: exportação JSON, caminhos por plataforma, depth CPU/JS, frente de onda, PSF espectral, ghosts CPU, digitação do Depth Cut e composição WebGL de camadas com alpha, glitter e vidro frontal. Os shaders são testados em navegador com rasterização por software, não como benchmark de GPU real.
- Dependências Python principais fixadas; versões resolvidas e logs acompanham os relatórios. `app_version.py` fornece versão para o desktop e os nomes de pacote; o spec macOS lê a mesma fonte.

## Limites de distribuição

As bibliotecas Windows CUDA/Vulkan são binários pré-compilados, identificados em `native/ci-assets.json`. `tools/ci_assets.py --prepare` verifica os hashes e coloca a DLL CUDA validada no destino do spec antes do build. Esse pipeline compila o aplicativo Python e o instalador, não recompila os kernels. Alterar fontes nativas exige compilar, testar numa GPU e atualizar os binários e o manifesto juntos.

O pacote de código não inclui o FFmpeg de 222 MB, para não ultrapassar o limite de arquivo comum do GitHub. Instale FFmpeg no sistema para MP4 ou coloque uma distribuição licenciada em `native/media/ffmpeg.exe` antes do build Windows. O spec o inclui quando presente. O app procura FFmpeg instalado quando ausente. Imagens e mapas importados não dependem dele.

No Mac, a imagem usa WebGL e o traçado usa CPU. CUDA Windows e geração de depth IA Windows não são empacotados. Os testes headless do pacote não comprovam funcionamento da interface WebKit, dos diálogos ou do render numa GPU Mac: teste o DMG num Mac. Não há assinatura Developer ID nem notarização Apple. Plugins AE/Resolve/Nuke/Photoshop ficam para a integração posterior.

## Referências

- [Runners oficiais do GitHub](https://docs.github.com/en/actions/reference/runners/github-hosted-runners).
- [Ferramentas do runner Windows 2022](https://github.com/actions/runner-images/blob/main/images/windows/Windows2022-Readme.md).
- [Builds por plataforma e assinatura no PyInstaller](https://www.pyinstaller.org/en/stable/usage.html).
