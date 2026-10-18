# Código-fonte atual — aplicativo 1.2.8

Este pacote contém o estado atual do workspace, incluindo o addon Blender 0.3.3, ComfyUI 0.3.0, os ports AE/Resolve/Nuke 0.3.1 e Photoshop 0.2.1. Inclui presets de caráter e acompanhamento de foco no Blender; consulte CARATER-FOCO-1.2.2.md. A landing está em um ZIP separado, com o demonstrativo de flare removido.

## Executar no Windows

Use Python 3.13. Abra um terminal na pasta extraída:

```powershell
py -3.13 -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements-desktop.txt
.venv\Scripts\python.exe desktop.py
```

Alternativa no navegador, sem a janela desktop:

```powershell
.venv\Scripts\python.exe server.py --open
```

O pacote inclui as bibliotecas GPU pré-compiladas previstas pelo projeto. MoGe 3 e outros modelos requerem seus runtimes e pesos configurados no programa; pesos, ambientes instalados e caches pessoais não estão incluídos. O binário opcional de FFmpeg também não acompanha este ZIP de fontes.

## Compilar

```powershell
.venv\Scripts\python.exe -m PyInstaller --clean --noconfirm OpticaLab.spec
```

A saída é `dist/SimuladorDeDesfoque/`. Para modificar o motor CUDA, consulte `native/cuda/build.cmd`: precisa do CUDA Toolkit e das ferramentas C++ do Visual Studio. Para Vulkan, consulte `native/vulkan/CMakeLists.txt`: precisa de CMake, compilador C++ e Vulkan SDK com glslc. Os arquivos `.iss` e `native/installer/` contêm os fontes do instalador Inno Setup.

## Onde trabalhar na óptica

- `optics/ghosts.py`: traçado sequencial de caminhos com duas reflexões, energia Fresnel, coatings e bloqueio por pupila.
- `optics/wavefront.py`: caminho óptico e frente de onda.
- `optics/spectral_psf.py`: PSF espectral e difração escalar da inspeção.
- `optics/aperture.py`: forma e cobertura da abertura.
- `optics/core.py`: configurações, traçado e composição CPU.
- `native/cuda/engine.cu`: motor CUDA.
- `web/`: interface e renderizadores WebGL; `filter-stack.js` contém os filtros.
- `optics/depth_*.py`: profundidade, integração de modelos e workers.
- `blender/bruxos_physical_lens/`: addon Blender; shader da câmera em `shader.py`.
- `tests/` e relatórios em `research/`: testes e limites das implementações.

O flare geométrico do aplicativo e a PSF escalar da inspeção são caminhos distintos. A prévia de flare da landing foi removida e não deve ser usada como referência de equivalência ao motor do aplicativo.

`SHA256.json` lista os hashes dos arquivos exportados. Consulte `THIRD-PARTY.md` e as licenças e atribuições dos componentes antes de redistribuir.

Preservação de foco e diagnóstico: FOCO-1.2.3.md.

## Etapa 3

Leia `OCLUSAO-1.2.4.md`: extensão do fundo antes dos raios no CUDA/WebGL e antes da convolução na referência CPU. Comparação em `research/depth-stage3/comparacao.html`. Blender permanece 0.3.2.

## Etapa 4

Leia `CAMPO-1.2.5.md`: interpolação por energia da pupila e limite animável em EV para clarear as laterais. Resultados em `research/field-stage4/`.

## Etapa 5

Leia `TEXTURA-BOKEH-1.2.6.md`: padrões internos independentes da íris e animáveis nas layers. Diagnósticos em `research/texture-stage5`. CUDA v3 (372 bytes) com adapters v1/v2.

Etapa 6: veja DESFOQUE-1.2.7.md para ganhos separados antes e depois do foco.

Etapa 7: ANIMACAO-1.2.8.md reúne controles, keyframes, compatibilidade e validação da entrega.

## Plugins desta entrega

Leia PLUGINS-ATUALIZADOS-2026-10-08.md para controles, compatibilidade e instalação. O addon ComfyUI está em comfyui/bruxos_webgl; copie essa pasta para custom_nodes. Os scripts native/ae/build.cmd, native/ofx/build.cmd, native/nuke/build.cmd e native/photoshop/build.cmd recompilam os ports Windows com MSVC/CUDA. Ajuste os caminhos dos SDKs locais de After Effects/OpenFX antes de compilar fora da estrutura original de pastas. O código da câmera Blender fica em blender/bruxos_physical_lens.
