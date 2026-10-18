# Profundidade, camadas e oclusão

Requisitos derivados do texto fornecido pelo usuário em 30/09/2026. O material é referência de comportamento; não constitui instruções de execução nem prova de recursos já implementados no app. As limitações de cada host devem ser verificadas no respectivo adaptador.

## Separar os conceitos

**Camadas de composição** são imagens com alfa e ordem explícita: imagem de base, A, B e C. A distância de cada uma determina seu foco, mas não reordena a pilha. Uma camada pode ter depth por pixel. **Faixas de profundidade** são uma estratégia interna de render para uma imagem com depth; não são as camadas A/B/C nem as camadas de textura do atlas GPU.

O depth determina a resposta óptica por pixel. A oclusão determina a visibilidade. Uma PSF correta, sozinha, não resolve discos de bokeh atravessando um sujeito opaco. O compositor precisa desfocar a cor premultiplicada e a cobertura de cada faixa/camada, mantendo o disco completo, e compor de trás para frente com a cobertura do primeiro plano.

## Contrato e controles

- Depth com canal selecionável, unidade e direção explícitas; transformação `valor * ganho + bias` antes da conversão para distância de foco. Ganho negativo deve inverter também a interpretação de próximo/distante. Não tratar mapa relativo como metros sem calibração.
- Faixas automáticas escolhidas pelo erro de tamanho do círculo de confusão em pixels, com suporte sobreposto e pesos contínuos. Poucas faixas manuais podem produzir degraus. Suavizar uma descontinuidade real de depth não substitui oclusão correta.
- Limites e amostras estáveis ao longo do plano, sem renormalizar depth por mínimo/máximo de cada frame. Transições contínuas durante racks de foco; cortes de cena permitem reinicialização explícita. Maior custo deve ser previsto conforme o intervalo de desfoque.
- Depth Cut: limiar, crescimento da região usada no preenchimento e feather da máscara de composição. O fundo oculto deve ser reconstruído sem amostrar o sujeito; a profundidade do primeiro plano deve se estender além da silhueta para permitir que seu próprio bokeh ultrapasse a borda. Feather não pode apenas apagar halos ou contaminar o fundo com a cor do sujeito.
- A/B/C: entradas RGBA, depth constante ou mapa independente e composição com alfa correto em luz linear. A ordem visual é explícita; mudanças de foco não trocam a ordem.
- Glitter em A: máscara de highlights ou canal dedicado, amostragem na profundidade da própria camada e opção de normalização da energia. A cintilação intencional desse efeito deve ser separada do flicker numérico. Alfa acima de 1 só pode ser usado como convenção declarada de máscara; não é cobertura física.
- C como vidro de distorção: usar a variação do mapa para refratar a base e A/B já compostos. Em modo distorção, C não é sobreposta como imagem comum. Sua profundidade controla o foco da refração.

## Lacunas verificadas na versão 0.7.3

O shader GPU lê o canal vermelho, permite inversão e reduz o peso de amostras com profundidade diferente do pixel central. Isso é uma heurística de visibilidade, sem reconstrução do fundo, pilha A/B/C ou composição ordenada de faixas. As camadas de textura do atlas armazenam raios por canal/amostra; não implementam depth slicing.

A referência CPU usa cinco faixas de profundidade. Ela já compõe com cobertura aproximada, mas não satisfaz os requisitos de faixas automáticas contínuas, preenchimento do fundo e estabilidade temporal. Esses recursos permanecem pendentes; aumentar apenas a quantidade de raios ou melhorar o desenho da lente não os entrega.

## Critérios de validação

1. Sujeito opaco sobre pontos HDR: discos do fundo cortados pela silhueta, sem vazamento nem halo da cor do sujeito.
2. Primeiro plano desfocado: sua cobertura cresce além da silhueta original com o disco correspondente.
3. Rampa de depth e rack de foco em vídeo: tamanho de bokeh contínuo, sem faixas que saltam entre frames.
4. A/B/C: foco alterado sem troca involuntária da ordem da pilha; C refrata tudo que está atrás.
5. Cor e alfa constantes: normalização de PSF, composição e glitter não criam variações de exposição acidentais.
6. Mesmo frame e parâmetros: resultado determinístico; comparar a composição CPU/GPU antes de aceitar o compositor para produção.

Implementar e validar esse compositor antes de anunciar equivalência com os aplicativos de referência. Os adaptadores poderão expor entradas de camadas quando o host permitir e uma interface de depth/cut quando esse for o caminho disponível.
