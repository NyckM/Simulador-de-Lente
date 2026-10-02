# Nota específica da build macOS

Esta distribuição de fontes não inclui binários Windows, CUDA, FFmpeg, WebView2, runtime de depth ou pesos. O build macOS empacota Python, NumPy, SciPy, Pillow, pywebview/PyObjC e o bootloader PyInstaller com seus metadados. As referências Windows abaixo descrevem as distribuições anteriores; não indicam que esses componentes são enviados no DMG macOS. FFmpeg instalado externamente permanece uma dependência separada para MP4.

# Componentes distribuídos

Simulador de Desfoque da Bruxosdovfx inclui Python, NumPy, SciPy, Pillow, pywebview/pythonnet, PyInstaller bootloader e suas dependências. As licenças presentes nas distribuições são preservadas no pacote. Prescrições ópticas e atribuições estão em data/. CUDA runtime: redistribuição conforme a licença NVIDIA CUDA Toolkit, https://docs.nvidia.com/cuda/eula/ . CUDA e Vulkan exigem o driver instalado no sistema.

FFmpeg é um executável separado usado para exportação de vídeo. Esta build estática de Gyan inclui componentes GPL; não é ligada ao código do Simulador de Desfoque da Bruxosdovfx. Consulte native/media/LICENSE.txt, https://www.gyan.dev/ffmpeg/builds/ e o código fonte https://github.com/FFmpeg/FFmpeg . A versão e configuração exatas constam no arquivo de licença. As bibliotecas externas e fontes desta build estão listadas na página do fornecedor. O instalador do Microsoft WebView2 é assinado pela Microsoft e distribuído como bootstrapper, conforme https://learn.microsoft.com/microsoft-edge/webview2/concepts/distribution .

Prescrições numéricas adicionais: consulte data/SOURCE-LensVisualizer.md e os endereços, patentes e hashes de cada perfil. A importação não inclui o código ou conteúdo editorial do LensVisualizer.

Runtime de profundidade: Python 3.12, PyTorch/torchvision CUDA e dependências distribuídas com suas licenças e metadados. Código DVD: https://github.com/EnVision-Research/DVD (Apache-2.0), MoGe: https://github.com/microsoft/MoGe (MIT), Depth Anything 3: https://github.com/ByteDance-Seed/Depth-Anything-3 (Apache-2.0). Cópias das licenças estão em native/depth/. Os pesos são obtidos separadamente no primeiro uso, sujeitos às licenças dos respectivos repositórios de modelos.
