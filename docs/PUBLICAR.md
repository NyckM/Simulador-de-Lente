# O que publicar e onde

Este guia separa o que entra no repositório (código aberto), o que vai para a página de Releases (binários) e o que fica só na sua máquina.

## 1. Repositório (código aberto, GPL-3.0)

Tudo que está neste repositório já foi filtrado e pode ser público:

| Pasta | Conteúdo |
|---|---|
| raiz, `css/`, `js/`, `assets/` | site (GitHub Pages) nos 3 idiomas |
| `app/` | código do aplicativo: `optics/`, `web/`, `data/`, `localization/`, `tests/`, `tools/`, specs do PyInstaller e o instalador NSIS |
| `plugins/native/` | código C++ / CUDA do After Effects, Resolve, Nuke, Photoshop e Vulkan, mais os scripts de build |
| `plugins/blender/`, `plugins/comfyui/` | add-on do Blender e nós do ComfyUI |
| `docs/historico/` | notas de desenvolvimento de cada versão |

Caminhos pessoais (`C:\Users\...`) foram trocados por variáveis de ambiente. Não há senhas nem chaves.

## 2. Releases (tag `V1.2.17`): arquivos para baixar

Suba estes arquivos, que estão em `outputs\Versao-Atual-1.2.17`. Os nomes precisam ser exatamente estes, porque o site aponta para eles:

- `Simulador-de-Desfoque-Bruxosdovfx-1.2.17-Setup-Windows-x64.exe`
- `ComfyUI-Bruxos-WebGL-0.4.0.zip`
- `Bruxos-Physical-Lens-0.4.0-Blender-Addon.zip`
- `Bruxosdovfx-Desfoque-AE-0.4.0-PT-BR-Windows.zip`, `-EN-`, `-ZH-CN-` (gerados por `build-plugins-1.2.17.ps1`)
- `Bruxosdovfx-Desfoque-Resolve-0.4.0-PT-BR-Windows.zip`, `-EN-`, `-ZH-CN-`
- `Bruxosdovfx-Desfoque-Nuke-0.4.0-PT-BR-Windows.zip`, `-EN-`, `-ZH-CN-`
- `Bruxosdovfx-Desfoque-Photoshop-0.2.1-PT-BR-Windows.zip`, `-EN-`, `-ZH-CN-` (os mesmos da V1.2.8, que estão em `Versoes-Antigas\Photoshop\0.2.1`)
- `Downloads-1.2.17-Manifesto.json`: rode `python tools\make-release-manifest.py "<pasta com os arquivos>"`

Como texto da release, use `docs/RELEASE-1.2.17.md`.

Os binários (instalador, .aex, .ofx, DLLs CUDA, FFmpeg, bootstrapper do WebView2) vão só para Releases, nunca para o repositório.

## 3. Não publicar (fica só na sua máquina)

| Item | Motivo |
|---|---|
| `work\ae-sdk` (Adobe After Effects SDK) | A licença da Adobe não permite redistribuir o SDK. Quem compila baixa o SDK da Adobe. |
| `dist\`, `build\`, `cache\`, `tmp\`, `artifacts\`, `ci-results\` | saídas de build e caches (centenas de MB) |
| `models\` e pesos de depth (MoGe, DA3, DVD) | grandes; são baixados no primeiro uso, sujeitos às licenças dos modelos |
| `native\depth\python`, `native\depth\vendors`, `native\media\ffmpeg.exe` | runtimes e binários de terceiros (já vão dentro do instalador) |
| `research\`, testes com fotos pessoais, `native\installer\wizard-photo-original.png` (foto sem desfoque), `Versoes-Antigas\` | material interno e pessoas identificáveis |
| `*.iss` antigos de atualização | substituídos pelo `installer-1.2.17.nsi` |

## Atenção à licença dos plugins

O código está sob GPL-3.0, mas os plugins se ligam a SDKs proprietários: Adobe (After Effects / Photoshop), NVIDIA CUDA e o host do Nuke/Resolve. A GPL pura pode conflitar com essa ligação. A prática comum é acrescentar uma **exceção de ligação** ("linking exception") permitindo combinar o código com esses SDKs, ou publicar os plugins sob uma licença permissiva (MIT ou BSD). Isto não é uma orientação jurídica: se o projeto for comercial, consulte quem entende de licenças.
