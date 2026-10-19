# Simulador de Desfoque · Lens Blur Simulator · 镜头虚化模拟器

**Português · [English](#english) · [中文](#中文)**

<img width="939" height="537" alt="Simulador de Desfoque" src="https://github.com/user-attachments/assets/645d708d-5396-4017-bfad-f818dd2926d3" />

Um simulador óptico que calcula o desfoque por **ray tracing pelas superfícies reais da lente**: refração em cada vidro, diafragma, aberrações, dispersão, coatings e reflexos internos. O mesmo motor roda no aplicativo desktop e nos plugins.

- **Site:** https://nyckm.github.io/Simulador-de-Lente/ (as páginas `index.html`, `en.html` e `zh.html` deste repositório)
- **Downloads:** [Releases](https://github.com/NyckM/Simulador-de-Lente/releases/latest)

## Novidades da 1.2.17

| | |
|---|---|
| **Lens Flare das luzes da imagem** | Reflexos entre os vidros calculados a partir das fontes de luz da foto. Dependem da lente, do coating e do diafragma, e são somados à imagem. |
| **Starburst físico** | Difração da íris atual (FFT da abertura, 16 comprimentos de onda). Lâminas pares dão N raios, ímpares 2N. Some fora de foco. |
| **Lens Dirt real** | Marcas de dedo, poeira, riscos e fungos no elemento frontal, iluminados pelas altas luzes e desfocados pela abertura. |
| **Filtros na frente da lente, em 3D** | Visor 3D do vidro, 8 tipos de prisma com borda desfocada, Black Mist contínuo e Kaleidoscope sem emenda. |
| **Interface modular** | Painéis que encaixam em cima, dos lados ou embaixo, janelas flutuantes e menu Arquivo / Editar / Efeitos / Exibir / Janela / Ajuda. |
| **Depth e luzes** | Mapa de profundidade fiel ao desfoque e recuperação de luzes recortadas em fotos 8-bit. |

Plugins **0.4.0** com o mesmo visual: After Effects, DaVinci Resolve, Nuke, Blender e ComfyUI. O Photoshop continua na 0.2.1.

## Downloads ([Release V1.2.17](https://github.com/NyckM/Simulador-de-Lente/releases/tag/V1.2.17))

| Pacote | Arquivo |
|---|---|
| App Windows x64 | `Simulador-de-Desfoque-Bruxosdovfx-1.2.17-Setup-Windows-x64.exe` |
| After Effects, Resolve, Nuke · prévia 1.2.17 (PT-BR) | `Bruxos-AE-1.2.17-PREVIA-PT-BR-Windows.zip`, `Bruxos-Resolve-…`, `Bruxos-Nuke-…` |
| Blender · prévia 0.4.1 | `Bruxos-Blender-0.4.1-PREVIA.zip` |
| Código-fonte | `codigo-aberto.tar.gz` |

Versões estáveis em inglês e chinês dos plugins (0.3.1), Photoshop 0.2.1 e ComfyUI 0.3.0: [Release V1.2.8](https://github.com/NyckM/Simulador-de-Lente/releases/tag/V1.2.8).

## Estrutura do repositório

```
index.html, en.html, zh.html, css/, js/, assets/   site (GitHub Pages)
app/                aplicativo desktop: servidor Python + interface WebGL2 (pywebview / WebView2)
  optics/           motor óptico em Python (ray tracing, atlas, depth, ghosts, filtros de referência)
  web/              interface e renderizador WebGL2 (gpu.js, filter-stack.js, reflected-ghosts.js…)
  data/             prescrições ópticas (295 perfis) e catálogos
  localization/     catálogo PT / EN / ZH
  tests/, tools/    testes e ferramentas de build
plugins/
  native/ae         After Effects (C++ / CUDA)
  native/ofx        DaVinci Resolve (OpenFX)
  native/nuke       Nuke (OpenFX)
  native/cuda       motor CUDA
  native/photoshop  Photoshop (UXP + serviço nativo)
  native/vulkan     protótipo Vulkan compute
  native/build      scripts de compilação e empacotamento dos plugins nativos
  blender/          add-on Bruxos Physical Lens (OSL + compositor)
  comfyui/          nós Bruxos WebGL para ComfyUI
docs/historico/     notas de cada etapa e versão
tools/              ferramentas do site (i18n, demos, build-filters3d.py)
```

## Rodar a partir do código

**App (Windows, Python 3.12):**
```
cd app
python -m pip install -r requirements-desktop.txt
python desktop.py          # ou: python server.py e abra http://localhost:8000
```
CUDA é opcional: sem GPU NVIDIA o app usa WebGL2. Para gerar o executável: `pyinstaller OpticaLab.spec`. O instalador sai de `installer-1.2.17.nsi` (NSIS).

**Plugins nativos:** veja `plugins/native/build/build-plugins-1.2.17.ps1`. É preciso ter o Visual Studio 2019 Build Tools, o CUDA 12.8, o [Adobe After Effects SDK](https://developer.adobe.com/after-effects/) e os [headers OpenFX](https://github.com/AcademySoftwareFoundation/openfx). Os SDKs não fazem parte deste repositório.

**Blender:** compacte `plugins/blender/bruxos_physical_lens` e instale como extensão (Blender 4.5+).
**ComfyUI:** use o zip da release (ele inclui o motor `_engine`, copiado de `app/optics` e `app/data`).

## Site: demonstração dos filtros 3D

`js/filters3d.js` é gerado a partir do código do app (`app/web/filter-stack.js`), então o site mostra exatamente os filtros do aplicativo. Depois de mudar os filtros, rode:
```
python tools/build-filters3d.py
```

## Licenças

Código sob **GPL-3.0** (`LICENSE`). A prescrição Double-Gauss de referência vem do LensSim (MIT, `LICENSE-LensSim.txt`); as prescrições numéricas importadas estão descritas em `SOURCE-LensVisualizer.md`; os componentes de terceiros, em `THIRD-PARTY.md`. Nomes de fabricantes pertencem aos seus titulares, e os perfis de lentes são modelos ópticos aproximados.

---

## English

An optical simulator that computes defocus by **ray tracing through the real lens surfaces**: refraction at every glass, aperture, aberrations, dispersion, coatings and internal reflections. The same engine runs in the desktop app and in the plugins.

**New in 1.2.17:** lens flare from the image highlights (RealFlare style), a physical iris starburst, real lens dirt (fingerprints, dust, scratches, fungus), filters in front of the lens with a 3D glass viewer and 8 prism types, a modular dockable interface with a top menu, accurate depth and recovery of clipped highlights. The **0.4.0** plugins have the same look: After Effects, DaVinci Resolve, Nuke, Blender and ComfyUI.

- Website: `index.html` (PT), `en.html`, `zh.html`. Downloads: [Releases](https://github.com/NyckM/Simulador-de-Lente/releases/latest).
- Run from source: `cd app && pip install -r requirements-desktop.txt && python desktop.py`.
- Native plugins: `plugins/native/build/build-plugins-1.2.17.ps1` (needs VS 2019 Build Tools, CUDA 12.8, the Adobe AE SDK and OpenFX headers, which are not included).
- License: GPL-3.0. See `THIRD-PARTY.md`.

## 中文

一款通过对**真实镜头表面进行光线追踪**来计算焦外虚化的光学模拟器：每片玻璃的折射、光圈、像差、色散、镀膜和内部反射。桌面应用和各插件使用同一个引擎。

**1.2.17 新功能：**来自画面高光的镜头光晕（RealFlare 风格）、物理光圈星芒、真实镜头污渍（指纹、灰尘、划痕、霉菌）、带 3D 玻璃视图和 8 种棱镜的镜前滤镜、可停靠的模块化界面与顶部菜单、准确的深度以及截断高光恢复。**0.4.0** 插件效果相同：After Effects、DaVinci Resolve、Nuke、Blender 和 ComfyUI。

- 网站：`index.html`（葡萄牙语）、`en.html`、`zh.html`。下载：[Releases](https://github.com/NyckM/Simulador-de-Lente/releases/latest)。
- 从源码运行：`cd app && pip install -r requirements-desktop.txt && python desktop.py`。
- 原生插件：`plugins/native/build/build-plugins-1.2.17.ps1`（需要 VS 2019 Build Tools、CUDA 12.8、Adobe AE SDK 和 OpenFX 头文件，本仓库不包含这些 SDK）。
- 许可证：GPL-3.0，详见 `THIRD-PARTY.md`。

---

**Bruxosdovfx** · *Optical defocus, not just blur.*
