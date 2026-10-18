# Flare por altas luzes — adaptação de fontes extensas

Referência estudada: https://github.com/ken-eizo/flaresim_ae, revisão b442cb79bd64e5b5da4eb83d5e54cf49827751a9, MIT. Arquitetura: src/FlareLensEffect.cpp (detecção), src/FlareLensCore.cpp (traçado), src/FlareLensOptics.cpp (amostragem), upstream/src/ghost.cpp (seleção de pares). Clone de pesquisa em work/flaresim-ae-reference; não se executou seu instalador ou plugin.

## Implementado no código do desktop

- A detecção automática integra RGB linear, já ponderado pelo alfa, de todos os pixels admitidos pelo limiar de cada região conexa. O fluxo não fica mais limitado à janela de 9 × 9 ao redor do pico.
- Regiões extensas são representadas por várias posições e fluxos. A distribuição espacial usa células e quadratura com centroides ponderados pela luminância, determinísticos. A soma de RGB e a área são conservadas para cada região incluída no orçamento.
- Até 32 amostras de fonte, repartidas entre as regiões pela energia e extensão espacial. Quando há mais regiões que o limite, são selecionadas as de maior energia integrada. A seleção manual mantém a janela de 9 × 9 por compatibilidade.
- Cada posição entra no traçado existente de duas reflexões, com a lente, a íris, os vidros, a dispersão e os coatings ativos. As posições não são usadas para apenas transladar uma figura de flare fixa.
- Opção de 16.384 raios por par, além de 1.024 e 4.096. Novo padrão de sessão: 4.096; parâmetros salvos permanecem respeitados. Aumentar fontes, raios e pares aumenta o tempo e o volume de dados.
- Interface explicativa atualizada em português, inglês e chinês. Exportação de diagnóstico identifica a integração automática de fontes extensas.

## Escopo e diferenças da referência

Esta etapa adapta a alimentação do motor existente. O detector é uma implementação própria, não uma reprodução numérica exata do detector por blocos do FlareSimAE. Seu código C++/CUDA/Metal e suas 1.370 prescrições ainda não foram incorporados ao aplicativo. Não se afirma paridade de imagem ou desempenho com o FlareSimAE.

Preservam-se as limitações do nosso traçado: duas reflexões, três linhas espectrais C/d/F, coating idealizado, seleção de pares por estimativa axial. Não inclui difração ondulatória ou espalhamento neste passe. O solver de ghosts continua CPU float64, com composição WebGL; não foi portado para CUDA nesta etapa. A entrada LDR não recupera energia HDR que tenha sido recortada na captura.

Os arquivos de fonte foram alterados; o instalador público 1.2.8 e os plugins publicados não foram recompilados nem substituídos.

## Validação

- tests/check_flare_extended_sources.cjs: fluxo de toda a região, centroides, extensão espacial, HDR linear, alfa, valores não finitos, orçamento e determinismo.
- tests/check_ghosts_stage16.py: Snell/Fresnel, conservação na placa, reflexão interna total, concordância com o traçado direto e resposta ao coating.
- tests/check_flare_iris.py: máscara de íris compartilhada com o bokeh.
- research/flare-16384-validation.json: cálculo com 16.384 raios; fonte movida no campo altera energia e percursos.

Os resultados da validação na interface devem ser consultados separadamente; testes numéricos não substituem inspeção visual nem comparação com a referência.

Validação visual nesta sessão: não concluída. O Edge headless encerrou durante a inicialização no ambiente restrito, antes de carregar o aplicativo. O resultado está em research/flare-interface-2026-10-17.json.
