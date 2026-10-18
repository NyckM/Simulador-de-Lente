# Fringing — planejamento 1.0

Status: planejado. A descrição enviada define a aparência desejada; não comprova equivalência com uma lente real. Nenhuma alteração no executável nesta revisão.

## Resultado e localização

Adicionar **Fringing · franjas de cor** ao bloco de aberrações em Efeitos. Usar o mesmo menu recolhível da interface. Atua em regiões de alto contraste, com intensidade, largura e cor controláveis, e variação suave no campo da imagem. Não é um filtro de difusão; a aba Filtros permanece dedicada ao espalhamento.

## Controles

| Controle | Finalidade |
| --- | --- |
| Intensidade e largura | Quantidade de sangramento e extensão da franja; zero mantém bypass exato. |
| Contraste / transição | Seleção suave de bordas, evitando ligar/desligar abruptamente em vídeo. |
| Matiz, saturação e luminosidade | Ajustar a cor da franja sem recolorir globalmente a imagem. Controles artísticos. |
| Centro → bordas | Variar intensidade e largura com distância ao centro óptico; interpolação contínua. |
| Direção | Resposta radial/tangencial ou orientação local da borda, identificada por modo. |
| Máscara e inspeção | Restringir o efeito e visualizar regiões selecionadas; comparação antes/depois. |
| Modo | Resposta óptica existente da lente ou fringing artístico de pós-processamento, claramente separados. |

## Relação com o motor atual

O app já contém `dispersion`, `ca_red`, `ca_blue` e `ca_axial`. Auditar sua contribuição e a dispersão dos materiais antes de integrar o novo efeito, evitando duplicação involuntária. A aberração lateral desloca posições de imagem por comprimento de onda; a longitudinal altera os planos de foco. Um detector de contraste com cor escolhida não substitui esses cálculos. Referência oficial: https://www.microscope.healthcare.nikon.com/en_AOM/resources/glossary/chromatic-aberration

No modo óptico, aproveitar materiais/traçado espectral e os caminhos de render que realmente suportam essa resposta. No modo artístico, definir espaço linear, detector de borda multiescala, máscara suave e modelo de espalhamento/deslocamento cromático. Matiz/saturação/luminosidade arbitrários são ajustes criativos, não parâmetros de vidro fisicamente medidos.

Definir largura em escala normalizada, centro óptico e comportamento para diferentes proporções. Tratar alpha premultiplicado, amostragem de borda e pixels inválidos. Não usar a máscara do depth como detector de bordas coloridas: o contorno MoGe 3 reportado é um defeito a corrigir, não um efeito para esconder ou intensificar.

## Implementação e validação em ordem

1. Auditar CA/dispersão atual e documentar ordem no pipeline, combinação e bypass.
2. Referência CPU do modo artístico; campos, máscara, escala e colorimetria definidos.
3. Implementação GPU e comparação numérica com tolerâncias registradas.
4. Controles PT/EN/ZH, projeto, reset e inspeção de máscara.
5. Testes com pontos, grades, bordas pretas/brancas e coloridas, centro/cantos, áreas uniformes, alpha e HDR. Verificar que zero preserva a saída e áreas uniformes não ganham franjas.
6. Comparar 1080p/4K, CPU/GPU, preview/exportação e vídeo: sem alteração de escala por resolução, costuras, cintilação de limiar ou dependência de semente aleatória. Ensaiar combinações com difusão/CA e mudanças rápidas.

Integra a frente 6, Consistência do render, após os contratos comuns de cor, máscara e GPU da frente Filtros. Perfis de lentes reais exigem referências de captura/calibração; presets iniciais são artísticos quando não houver essas medições.

## Referência: bokeh recortado com CA axial vermelho/azul

Referência visual recebida em 2026-10-03: [imagem preservada](research/references/cropped-bokeh-axial-ca.png). O painel esquerdo apresenta uma grade de pontos, com discos mais circulares no centro e recortes variáveis na periferia; o direito apresenta muitos highlights sobrepostos. O rótulo da imagem descreve CA axial vermelho/azul, mas uma captura isolada não identifica o algoritmo, a lente ou a causa do recorte.

Adicionar ao conjunto de validação da frente 6: grade uniforme de fontes pontuais, centro/laterais/cantos, pontos isolados e campo denso sobreposto. Comparar antes e depois do foco para observar resposta cromática longitudinal, além de abertura, tamanho do desfoque e posição no campo. CA axial envolve planos de foco distintos por comprimento de onda; não deve ser confundida com simples deslocamento lateral RGB. [Definição Nikon](https://www.microscope.healthcare.nikon.com/en_AOM/resources/glossary/chromatic-aberration).

Separar os contratos de aparência:

- **Recorte óptico:** resposta da pupila/superfícies no campo, quando sustentada pelo traçado; controle artístico de recorte deve ser identificado como aproximação.
- **Oclusão por cena/depth:** Eclipsed Bokeh e máscaras de objetos na frente da fonte; validar separadamente para não confundir com recorte óptico.
- **CA axial:** auditar `ca_axial` e dispersão dos materiais, sem duplicar a contribuição espectral. No modo artístico, permitir intensidade e inversão da ordem vermelho/azul para reproduzir a referência, sem alegar calibração de uma lente real.

Controles candidatos para o recorte artístico: quantidade, transição, centro óptico/posição X/Y, escala da região e orientação. Transformações seguem FILTROS-TRANSFORMACOES-1.0.md quando o efeito estiver no bloco Filtros. No modo físico, os parâmetros da lente governam o recorte; não aplicar uma máscara arbitrária escondida.

Critérios: zero de CA remove apenas a contribuição artística de CA, mantendo a dispersão física se ligada; zero de recorte artístico não remove vinhetagem física. Áreas uniformes não ganham franjas; sobreposição, alpha, HDR e bordas do quadro permanecem coerentes. Comparar CUDA/WebGL e preview/exportação em diferentes resoluções, com mudanças rápidas e reset. Referência incorporada ao planejamento; nenhuma alteração no render ou executável nesta revisão.
## Referência: Cat’s Eye verde/magenta e astigmatismo

Referência recebida em 2026-10-03: [imagem preservada](research/references/cats-eye-green-magenta-astigmatism.png). O painel superior mostra pontos aproximadamente circulares no centro e formas estreitas, orientadas conforme a posição na periferia, com rótulo Cat’s Eye e CA axial verde/magenta. O inferior mostra bokeh elíptico com orientação variável no campo, rotulado astigmatismo. Os campos densos à direita são referências de sobreposição e continuidade. A imagem não fornece parâmetros físicos ou algoritmo de origem.

Manter três contribuições separadas no planejamento:

- **Cat’s Eye:** formato e recorte do bokeh dependentes da posição no campo. No modo físico, avaliar a pupila efetivamente transmitida pela lente. No artístico, quantidade, transição centro/borda, centro X/Y e escala da região; preservar resposta circular central quando configurada assim.
- **CA verde/magenta:** adicionar essa combinação ao modo artístico junto da referência vermelho/azul, com intensidade e inversão. No modo físico, usar a resposta espectral calculada; não impor cores escolhidas como se fossem propriedades medidas do vidro.
- **Astigmatismo:** auditar o controle existente `astigmatism_mm`, a orientação radial/tangencial e sua resposta ao foco. Não substituir por squeeze global ou swirl. Intensidade e orientação artística podem existir como modo separado da resposta física.

A integração deve avaliar combinações dessas contribuições e o reset independente de cada uma. Usar grades com pontos em centro, lados e cantos, foco antes/no/depois da fonte, diferentes aberturas e campos densos. Registrar alongamento, orientação, área e energia de cada footprint, sem apresentar métricas de uma referência não calibrada como valores físicos esperados. Comparar CUDA/WebGL, preview/exportação, alpha/HDR e escala em diferentes resoluções. Não usar estes efeitos para encobrir o contorno MoGe 3 pendente.

Status: referências incorporadas ao plano; sem alteração do executável ou validação visual do render nesta revisão.