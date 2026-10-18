# Optica Lab 0.6 · atlas de raios mais denso

A prévia final agora traça feixes em **25 posições do sensor (5 × 5)** e três comprimentos de onda. Enquanto você arrasta uma superfície, usa **9 posições (3 × 3)** com menos raios para manter o editor responsivo; ao soltar, recompõe o atlas 5 × 5. O estado aparece junto ao tempo da GPU abaixo da imagem. O traçado considera as superfícies editadas, a íris e a refração. A atualização de uma lente típica levou cerca de 2,5 s nesta máquina; mudanças de foco e efeitos que são uniformes do shader seguem sem novo traçado.

Isso melhora a variação espacial da forma do bokeh, especialmente entre centro e bordas. Ainda é uma **aproximação por atlas**: cada pixel interpola feixes pré-traçados e acumula até 64 amostras. Não é path tracing por pixel, nem simulação de difração, coatings ou reflexos internos. Oclusão por depth e estabilidade temporal de vídeo ainda precisam de trabalho e validação com material real; esta versão não deve ser considerada um renderizador de produção sem flicker.

Execute `Iniciar.cmd` e abra `http://127.0.0.1:8766/`. O editor visual está descrito em [GUIA-0.5.md](GUIA-0.5.md). O ray tracer e a prévia usam o mesmo conjunto de parâmetros ópticos, mas a prévia GPU adiciona controles criativos separados da prescrição física.
