# Simulador de Desfoque da Bruxosdovfx 0.9.6 — Windows

Execute o instalador e abra Simulador de Desfoque da Bruxosdovfx pelo menu Iniciar. Python e CUDA Toolkit não precisam ser instalados. O WebView2 é instalado quando necessário; nessa situação é preciso acesso à internet. A versão distribuída não possui assinatura digital própria.

## Renderização

O seletor no cabeçalho oferece Automático, CUDA NVIDIA e WebGL. Automático usa CUDA quando disponível e retorna ao WebGL em caso de falha. O driver NVIDIA precisa estar instalado e atualizado; esta build inclui código para arquiteturas CUDA 7.5 ou superiores e foi validada em uma RTX 4090. Outras placas não foram testadas.

O motor CUDA compõe a imagem HDR, desfoque por profundidade e amostras do bokeh. Mantém buffers na GPU e reutiliza CUDA Graphs quando a configuração não muda. O atlas de raios através do vidro continua no motor Vulkan/CPU existente. Gotas e difusão são finalizadas no WebGL. A exibição ainda transfere a imagem HDR pela memória do computador; não é uma implementação de compartilhamento direto de textura entre CUDA e WebView2.

Highlight Detail utiliza qualidade elevada para o quadro inteiro no CUDA. A cena com mapa de profundidade permanece uma aproximação 2,5D: partes escondidas na fotografia não podem ser recuperadas como geometria 3D real.

## Interface

Lente: presets e reset do perfil. Foco: foco, diafragma e mapa de profundidade. Efeitos: aberrações, gotas e controles criativos. Qualidade: amostras e detalhes de renderização. Projeto: perfis próprios e arquivos de configuração. Importação e escolha do motor ficam no cabeçalho. Saída e exportação ficam abaixo do viewer. O desenho óptico abre no painel de inspeção.

Perfis e preferências da janela ficam no armazenamento local do aplicativo. Logs e arquivos temporários ficam em %LOCALAPPDATA%\OpticaLab. A versão desktop usa uma porta local própria e não compartilha automaticamente os perfis salvos no navegador de desenvolvimento. Importe um arquivo de projeto para transferi-los.

Importação de mapas de profundidade funciona sem modelos extras. A geração de profundidade por IA usa o Complemento Depth IA, instalado separadamente, com um runtime Python próprio com PyTorch CUDA, DA2, DA3, MoGe 2 e DVD 1.1. Os pesos são baixados automaticamente no primeiro uso para o cache Hugging Face do usuário. Esse primeiro uso requer internet e vários gigabytes livres; o runtime instalado ocupa aproximadamente 5 GB. Não é necessário instalar módulos Python manualmente.

## Validação

70 testes unitários passaram. Testes de interface verificaram CUDA/WebGL, reset, foco com profundidade, exportação PNG de 1920 pixels e disposição em duas resoluções. O motor CUDA foi comparado ao shader GLSL e verificado para repetibilidade. Os tempos informados na interface medem o motor; não representam o tempo completo de transferência e exibição.

## Filtro de caráter

Em Efeitos > Caráter criativo, Filtro de caráter varia de -1 a +1. No fundo, valores negativos concentram luz em anéis e positivos concentram luz no centro. O sinal se inverte antes do plano de foco. Zero conserva o resultado anterior. O efeito se reduz ao aproximar-se do foco e é nulo exatamente no plano para preservar a imagem focada. Atua na posição das amostras do bokeh em CUDA e WebGL, antes da composição em luz linear; não aplica unsharp mask à imagem final. É um modificador criativo da PSF, sem prescrição ou calibração ARRI e sem alteração real dos elementos do vidro. A intensidade e forma dependem da lente e do diafragma. Perfis próprios e arquivos de projeto guardam o controle.

## Biblioteca 0.9.5

283 presets numéricos adicionais do LensVisualizer, organizados por fabricante e disponíveis na busca. Todos usam geometria própria no desenho e no atlas de raios. Os modelos incompatíveis não são oferecidos como lentes prontas. Reconstruções esféricas de estado fixo, sem calibração de exemplares e sem reprodução dos movimentos internos de zoom/foco. Consulte data/SOURCE-LensVisualizer.md.

## Correção 0.9.5

Na versão 0.9.5, o runtime de IA acompanhava o instalador e roda em um processo separado, sem depender do ambiente de desenvolvimento. DVD inclui o código oficial, configurações e adaptador; DA3 e MoGe são pacotes físicos, sem referências editáveis a diretórios de outra máquina. Os pesos dos modelos continuam no cache do usuário.

DA2, DA3 e MoGe 2 foram validados com geração real de mapas. DVD 1.1 gerou uma sequência de cinco frames. Os quatro testes usaram o runtime da distribuição em uma RTX 4090. O executável também passou no teste de abertura e renderização CUDA.

## Correção de cache 0.9.4.1

O instalador Correcao-Depth-Bruxosdovfx-0.9.4.1.exe atualiza somente os scripts do runtime de profundidade após instalar 0.9.5. Corrige a normalização dos caminhos do cache Hugging Face no Windows e conserva a extensão dos checkpoints safetensors do DVD. Não apaga modelos, projetos ou preferências. DA2, DA3 e MoGe foram retestados no runtime instalado; MoGe também foi validado pelo EXE instalado.

## Otimização 0.9.5

A prévia estática responde com até 512 pixels e 24 amostras durante os ajustes. Após soltar o controle, refina em etapas até a qualidade escolhida. Highlight Detail retorna à configuração completa na etapa final. Vídeo em reprodução e exportação mantêm a amostragem escolhida. Frames obsoletos de ajustes anteriores não substituem o resultado atual.

CUDA reutiliza as pirâmides da imagem e as camadas de profundidade enquanto suas entradas permanecerem iguais. O cache das camadas tem orçamento de 192 MiB; fontes maiores usam o caminho anterior. CUDA Graphs são criados após repetir uma configuração, evitando reconstruí-los a cada mudança de foco. A identificação de mapas binários também é reutilizada.

A prévia CUDA transfere HDR em float16, formato já usado pela textura do viewer. Exportações mantêm float32. A imagem ainda passa pela memória do computador: não há compartilhamento direto de textura, OptiX ou DLSS nesta versão.

Na RTX 4090, o teste de interação com Highlight Detail passou de 26,7 ms no quadro final para 8,2 ms durante o ajuste. Os frames finais em CUDA e WebGL produziram o mesmo PNG que o render explícito de qualidade completa. O comparativo CUDA em float32 preservou os frames anteriores exatamente, incluindo mudanças de foco, máscaras, exposição, íris e fonte. Esses tempos são cenários de teste, não garantia para toda imagem ou GPU.

As correções dos caminhos de pesos de 0.9.4.1 acompanham esta versão.


## Vídeo de profundidade externo (atualização 0.9.5.2)

Abra o vídeo principal e clique em + Depth para selecionar PNG ou vídeo MP4 H.264/WebM. O depth externo acompanha a timeline e a exportação sem gerar mapas por IA. Os dois vídeos precisam ter as mesmas dimensões, enquadramento e início em 0 s. Configure canal, inversão, Gain/Bias e distâncias próximo/distante. Se o depth terminar antes do vídeo principal, seu último frame é mantido. MOV/MKV dependem do codec aceito pelo WebView; para codecs não aceitos, converta para MP4 H.264 ou WebM. PNG continua disponível como mapa estático.

## Versão 0.9.6

Inclui correção de halo na composição com depth em WebGL e CUDA, drawer lateral de inspeção óptica, importação de depth em vídeo e as correções de cache/carregamento dos modelos de depth. O instalador principal é leve; os complementos de IA podem ser instalados pelo próprio app. Os pesos continuam sendo baixados no primeiro uso.

## Distribuição 0.9.6 com instalador leve

O instalador principal inclui o app, CUDA/WebGL, lentes, efeitos e importação de imagens e vídeos de depth. Ele preserva o complemento de IA e o cache de modelos existentes. Para gerar depth em uma instalação nova, use o botão Instalar complementos no app. Como alternativa offline, use Complemento-Depth-IA-Bruxosdovfx-0.9.6.exe: baixe o EXE e todos os arquivos BIN de mesmo nome para a mesma pasta e execute o EXE. Cada arquivo fica abaixo de 2 GB; o complemento completo continua maior que 2 GB e ocupa cerca de 5 GB após instalado. Os pesos não estão incluídos e são baixados no primeiro uso.

## Instalar complementos pelo app

Em Foco > Profundidade, clique em Instalar complementos. O app baixa bibliotecas diretamente do PyPI e do servidor oficial do PyTorch, verifica SHA-256, instala em ambiente separado e valida os quatro adaptadores antes de ativar. Não exige Python, Git ou CUDA Toolkit instalados. Requer internet e pelo menos 12 GB livres durante a instalação. Os pesos são baixados no primeiro uso de cada modelo. Cancelar conserva downloads já concluídos; uma falha não substitui um runtime ativo. O complemento offline em EXE/BIN continua disponível como alternativa.

## Prévia rápida 0.9.6.1

O seletor Prévia acima do viewer limita a maior dimensão a 360, 540, 720 ou 1080 pixels. Conforme qualidade restaura a resolução definida pelo nível de qualidade e pelo zoom. O padrão é 540 pixels e a escolha fica salva na máquina. A limitação atua em CUDA/WebGL e na reprodução de vídeo, preservando as amostras da qualidade escolhida. Ao usar uma resolução fixa, a prévia usa AA 1 para reduzir o custo. Exportação PNG/MP4 e gravação WebM mantêm seus ajustes próprios.
