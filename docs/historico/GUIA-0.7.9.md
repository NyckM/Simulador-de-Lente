# Dither e detalhe de highlights — 0.7.9

O painel Amostragem e altas luzes adiciona Dither, Dither Amount, Highlight Detail, Highlight Quality, Highlight Threshold e Highlight View. Dither e Highlight Detail começam desligados. Configurações são persistidas no projeto e usadas pela prévia e exportação GPU, inclusive vídeo, Depth Cut e Slicing. O renderer CPU de referência não aplica estes efeitos e informa isso em seus avisos.

## Dither do bokeh

Uma perturbação determinística por pixel e célula de amostragem quebra a regularidade do padrão. Não existe seed de frame ou tempo. Ela varia o ponto de leitura dentro da área reconstruída de cada célula; não retraça um raio óptico novo para cada pixel. A amplitude é proporcional ao desfoque local e diminui com o número de amostras. Amount = 1 utiliza o tamanho nominal da célula; acima de 1 amplia a perturbação e suaviza a PSF. Zero mantém a saída original mesmo com Dither marcado.

O efeito desaparece para círculo de confusão abaixo de 0,5 pixel de entrada, cresce suavemente e chega à amplitude completa em 2 pixels. Áreas paraxialmente em foco, sem esférica extra, ficam intocadas. O padrão usa coordenadas fixas da imagem de entrada, estável para uma mesma resolução/qualidade/configuração. Mudanças de parâmetros, resolução, qualidade ou conteúdo podem mudar o resultado; fixar o padrão não elimina instabilidade de mapas depth inferidos. O pequeno dither já existente na conversão de saída para 8 bits é separado deste controle.

## Highlights

A divisão ocorre em luz linear antes de filtrar, usando o maior canal do pixel. Para brilho máximo p e limiar T, a fração high é max(0, p − T) / p. A Base retém o restante, conservando cor e energia. O realce criativo de altas luzes é aplicado à divisão com os mesmos pesos.

Base usa a qualidade principal. Highlights usa 64, 128 ou 256 amostras quando Highlight Detail está ligado e supera a qualidade principal. A GPU limita ambos ao atlas disponível. Em Detalhada/exportação com 256 amostras, selecionar 256 para highlights não acrescenta qualidade; em Rápida ou Equilibrada pode acrescentar. Com Detail desligado, as vistas de diagnóstico ainda mostram a divisão, mas ambas usam a qualidade principal.

Um teste conservador de cobertura evita o gather extra em pixels onde a fonte de highlights não pode atingir o bokeh. Considera o atlas, deslocamento de foco, extremos do depth, esférica, swirl, coma e CA. Ele é deliberadamente mais largo que a forma luminosa final. A máscara de cobertura é reduzida a uma estimativa 32 × 32 na GPU. A partir de 65% de cobertura estimada, Final usa um passe do quadro inteiro em Highlight Quality; os diagnósticos usam essa qualidade também na Base para corresponder ao mesmo resultado. Essa estimativa é uma heurística de custo, não um benchmark que garanta a escolha mais rápida para toda GPU. A leitura de um pixel para decidir o fallback pode sincronizar CPU/GPU. Se a leitura float não for suportada, a otimização de fallback é desativada e os dois passes continuam disponíveis.

## Vistas

- Final: composição de Base e Highlights em luz linear, antes da conversão de exibição.
- Highlights Only: parte luminosa acima do limiar e os acréscimos não lineares dos proxies de ghosts/difração.
- Base Only: parte restante. Alterar somente Highlight Quality não altera esta parte, exceto quando o fallback eleva a qualidade do quadro inteiro.
- Coverage: região conservadora onde o gather de highlights é habilitado. Não é uma medida exata de tempo nem um desenho da PSF. O filtro de suporte pode produzir uma região retangular, mesmo com bokeh circular. Ghosts/difração continuam com sua própria amostragem; Coverage se refere à qualidade extra do bokeh.

Depth usa as mesmas máscaras de oclusão para os dois passes. Exposição, mistura com a entrada e difusão são repartidas coerentemente. Ghosts/difração não lineares são acrescentados uma única vez à parte Highlights. A soma é equivalente em luz linear dentro da precisão do framebuffer float16; somar duas imagens já codificadas/clampadas em sRGB não reproduz esse cálculo.

## Validação e limites

47 testes de unidade/integração passaram. Os shaders reais foram executados em RTX 4090 pelo teste opcional `tests/render_gpu_highlights.py`: padrão repetido idêntico, foco e Amount zero sem mudança, qualidade da Base independente, limiar acima da cena gera Highlights preto, decomposição dentro de um passo float16 e caminhos Cut/Slicing finitos. A cobertura estimada de uma luz isolada foi cerca de 10%; uma cena totalmente acima do limiar chegou a 100% e acionou o critério de fallback. Os testes também compararam o passe de qualidade alta com as partes na mesma qualidade, dentro da precisão float16.

A comparação sintética está em `../Highlights-GPU-0.7.9.png`. O teste requer ModernGL somente em desenvolvimento. Testes anteriores de depth e reconstrução também passaram com os shaders modificados. Esses testes não validam toda a classe WebGL no navegador, a decisão 32 × 32/readPixels integrada ou desempenho de playback. Não há promessa de ausência de moiré/flicker em qualquer vídeo ou mapa de profundidade.
