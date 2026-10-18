# Plugins atualizados — 8 de outubro de 2026

Aplicativo de referência: 1.2.8. After Effects, Resolve e Nuke: 0.3.1, Windows x64, PT-BR/EN/ZH-CN. Photoshop: 0.2.1 UXP, Windows x64, Photoshop 25+, três idiomas. Blender: 0.3.3. ComfyUI: 0.3.0.

## After Effects / Resolve / Nuke / Photoshop

Novo grupo **Foco / Textura do bokeh**: preservar foco (0–1), transição do foco em dioptrias (0,001–2), desfoque próximo e distante (0–200%), textura de anéis e granulado (0–1), frequência (0,5–12), rotação (0–360°) e limite de clareamento (0–6 EV). O clareamento usa transmissão relativa ao centro e não abre a pupila ou altera a vinheta criativa. Transmissão nula não é recuperada.

Valores neutros mantêm o render anterior: preservar foco e textura em 0, próximo/distante em 100%, limite em 3 EV. A largura da transição controla a distância em dioptrias ao plano focal. Próximo/distante afetam a dispersão dos raios e a reconstrução, sem suavidade residual quando o ganho chega a zero longe do foco.

15 filtros de imagem, um por instância. Acrescentados **Prisma espectral** e **Blur direcional** ao final da lista. No Prisma use Deslocamento de refração, Escala, Rotação e Intensidade; a separação usa sete bandas aproximadas. No Blur direcional use Alcance do kernel, Escala, Rotação e Intensidade. Os filtros permanecem aproximações artísticas originais, sem calibração de lentes comerciais. Os IDs/índices e as opções antigas foram preservados.

AE/Resolve/Nuke usam os keyframes do host para os parâmetros contínuos, avaliados por frame. As camadas A/B/C recebem os controles ópticos no plano de cada camada. Photoshop tem seleção de camadas e presets; não adiciona uma timeline própria.

Lens Flare continua usando duas reflexões entre interfaces, coatings idealizados e a íris do bokeh. A textura do bokeh não muda o caminho do flare. Os filtros e a compensação de exposição são pós-processados em CPU; o desfoque mantém CUDA/CPU. DLL principal do plugin: configuração 356 bytes, entry points v2. A interface anterior de 320 bytes é mantida por adaptador. DLL de camadas: ABI 3, com verificação de versão e fallback CPU. Não misture DLLs do aplicativo standalone com as dos plugins.

## Blender

Textura de anéis, granulado, frequência e rotação na pupila do caminho primário OSL, com keyframes; render real CPU/OptiX. Mantidos mm, f-stop, presets, caráter, foco por ponto/alvo, swirl, bokeh e 15 filtros no compositor. Leia blender/bruxos_physical_lens/UPDATE-0.3.3.md.

A câmera 3D não recebeu os controles 2D de porcentagem próximo/distante ou limite EV de compensação dos outros ports. A textura tem normalização circular aproximada; recortes dos vidros e diafragma poligonal podem mudar a exposição residual. O clareamento em EV existente no Blender é artístico.

## ComfyUI

Motor WebGL atualizado com as correções do desktop: reconstrução das bordas, campo óptico e controles novos de foco, textura, próximo/distante e compensação. Novos widgets são opcionais; workflows antigos conservam os defaults. O node BruxosArtisticFilter oferece 15 filtros, incluindo prisma e direção, encadeáveis por advanced_settings. Recebe depth relativo ou em metros de nodes externos. Não inclui inferência MoGe3 nem uma timeline própria; parâmetros podem ser fornecidos por nodes de animação. Saída RGB sRGB, resolve de 8 bits. Python/Playwright e aceleração WebGL são necessários.

## Instalação e validação

Feche o host e extraia somente o pacote correspondente ao programa e idioma. Substitua o conjunto completo de binário e DLLs. Nuke também inclui o painel auxiliar; instale conforme PREVIOUS-INSTALLATION.txt. Photoshop: UXP Developer Tool > plugin/manifest.json > Reload; reinicie o motor nativo atualizado. Blender: instalar ZIP como extensão. ComfyUI: copiar bruxos_webgl para custom_nodes, instalar requirements com o Python do ComfyUI e reiniciar.

Verificados builds nativos localizados em CPU/CUDA, IDs antigos, adaptador CUDA legado, composição e animação das camadas, 15 filtros comparados ao desktop, motor e painel Photoshop, render Blender 4.5.14 CPU/OptiX e nodes ComfyUI com Torch/WebGL RTX 4090. Relatórios em research/plugins-update. After Effects, Resolve, Nuke e Photoshop não foram abertos nos hosts reais: os testes usam SDK harnesses e motor/adapter. ComfyUI foi testado por execução direta dos nodes, sem abrir a interface do servidor.

Não foi recompilado o instalador do aplicativo 1.2.8 nem publicado release remoto. Os arquivos fonte desta entrega contêm o aplicativo e os seis ports atualizados. As etapas 3–6 não foram integralmente reimplementadas no render nativo; esta atualização porta os controles e mantém o tratamento de bordas/depth já existente nos ports. Não se promete paridade completa de todos os motores.
