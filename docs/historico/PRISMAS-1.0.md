# Efeitos de prisma — especificação visual para 1.0

Status: planejado para **Filtros → Efeitos de prisma**. Nenhuma mudança no executável nesta revisão. As três imagens enviadas orientam aparência e interação; não permitem identificar, sozinhas, material, geometria ou filtro físico utilizado.

## Referências visuais e presets próprios

| Referência | Aparência observável | Preset artístico proposto |
| --- | --- | --- |
| Retrato externo junto ao rio | Véu claro amplo na lateral direita e suavização na parte inferior; região esquerda mais definida. | Véu lateral: cobertura direcional, dispersão ampla e transição suave. |
| Retrato com fundo escuro | Regiões periféricas difusas e uma faixa inferior com aparência deslocada; rosto e tronco centrais mais definidos. | Janela central: refração/desfoque periféricos com abertura central ajustável. |
| Retrato no carro | Sobreposição suave deslocada nas regiões esquerda e superior, mantendo o rosto principal definido. | Duplicação suave: cópia refratada com deslocamento e mistura localizados. |

Esses nomes descrevem objetivos visuais, não identificam os filtros das fotografias. Preservar uma região nítida deve ser controlável; uma detecção automática de rosto não está implícita.

## Controles e interação

- **Posição e rotação:** arrastar o efeito sobre a imagem; alças para orientação e escala.
- **Cobertura e transição:** lado, faixa, janela central ou máscara própria; borda contínua sem linha de recorte visível.
- **Refração / deslocamento:** direção e quantidade de deslocamento do conteúdo; origem das amostras e tratamento de borda explícitos.
- **Duplicação:** ganho e deslocamento do ramo secundário; não confundir com ghosts por reflexões já existentes.
- **Desfoque local:** suavização da região refratada, independente do foco principal.
- **Véu / espalhamento:** componente difusa opcional, separada da refração. Um simples deslocamento não explica sozinho o véu observado.
- **Dispersão cromática:** opcional, desligada por padrão nos presets destas referências; as fotos não exigem uma separação RGB exagerada.
- **Região preservada:** posição, tamanho e suavidade da janela de passagem direta.
- **Liga/desliga e reset próprios:** restaurar o módulo sem alterar lente, depth ou outros filtros; persistência no projeto e máscara de inspeção.

O módulo usa blocos recolhíveis, PT/EN/ZH e a pilha de Filtros. Ordem de processamento documentada; não presumir que refração e difusão são intercambiáveis.

## Dois caminhos distintos

**Artístico:** composição de caminho direto, amostra deslocada e componentes difusas, em espaço de trabalho definido. Pesos e máscaras contínuos, sem duplicar luz de forma involuntária. Presets reproduzem a linguagem visual e são identificados como não calibrados.

**Óptico:** geometria, orientação, índice e dispersão do elemento frontal, com traçado suportado pelo motor. Uma cunha prismática precisa de faces com normais/orientações próprias; não apresentar a edição atual de superfícies axiais como suporte completo a prismas. Duplicações ou véus requerem caminhos/mecanismos adicionais, conforme o elemento. Até implementação e validação, esse modo não será anunciado como disponível.

Coordenadas de imagem e máscaras não equivalem a posição 3D do vidro. A imagem 2D pode não conter informação fora do campo ou escondida necessária para a refração física. Se houver integração futura com geometria/depth, documentar os buracos e limites, sem inventar recuperação exata.

## Implementação em ordem

1. Definir contratos comuns de Filtros: cor, escala, alpha, máscara, bypass e ordem de pilha.
2. Implementar referência CPU do modo artístico com os três presets próprios.
3. GPU, cache, resposta a gestos e invalidação seletiva; comparação CPU/GPU.
4. Alças na imagem, campos editáveis, inspeção de máscara e persistência.
5. Validar combinação com foco, camadas, difusão e fringing; preview/exportação.
6. Evoluir para elemento frontal geométrico somente com suporte ao traçado e referências verificáveis.

## Critérios de validação

- Intensidade zero/bypass mantém a saída; região preservada não recebe efeito indevido.
- Gradientes de cobertura sem costuras; alpha premultiplicado sem bordas pretas ou transparência involuntária.
- Mesma composição em diferentes resoluções/proporções; deslocamento e desfoque mantêm escala definida.
- Sem amostragem fora dos limites não tratada; regiões sem dados têm política identificada.
- Campos, alças e valores salvos sincronizados; cancelar gesto restaura parâmetros.
- Vídeo sem ruído temporal adicionado; mudanças rápidas/reset não reaplicam resultado antigo.
- CPU/GPU comparados com tolerâncias justificadas e tempos totais medidos.

Para a 1.0, a entrega proposta é o modo artístico validado e os três presets próprios. Traçado de prisma físico completo permanece uma evolução separada, sem impedir o fechamento da versão estável.

## Replicações / Linear FX — referências adicionais

Status: planejado, sem implementação no executável. As seis referências mostram séries de imagens deslocadas: algumas com sobreposição contínua e intensidade decrescente, outras com limites verticais semelhantes a facetas. O nome “Linear FX” presente nas imagens é contexto da referência comercial, não identifica nosso modelo ou comprova equivalência física.

A afirmação de que seria impossível recriar em pós-produção não entra na especificação. Uma aparência de múltiplas cópias pode ser aproximada por amostragem e composição espacial. Reproduzir exatamente um elemento físico exige conhecer geometria, material, caminhos ópticos e informações possivelmente ausentes, como regiões fora do campo. A mesma imagem repetida não cria vistas novas reais da pessoa.

### Modos e presets próprios

- **Replicação linear:** cópias distribuídas ao longo de um eixo, com direção horizontal, vertical ou diagonal.
- **Sobreposição suave:** cópias sobrepostas com máscaras/transições contínuas e queda de intensidade ajustável.
- **Faixas facetadas:** regiões de amostragem distintas, com limites definidos ou suavizados e refração artística opcional.
- **Linear sutil:** poucas cópias próximas, menor intensidade e suavização discreta.

Não interpretar a cor vermelha, verde ou azul das referências como coloração obrigatória do efeito: a iluminação original também contribui. Preservar cor da fonte por padrão; dispersão/tint são opcionais.

### Controles específicos

| Controle | Comportamento planejado |
| --- | --- |
| Quantidade | Número total de imagens, incluindo a principal; limites definidos após medir o custo. |
| Espaçamento e ângulo | Distância entre cópias e direção do eixo, normalizadas à imagem. |
| Distribuição | Um lado, dois lados ou distribuição centrada; definir qual imagem é a principal. |
| Ganho / queda entre cópias | Intensidade das secundárias e progressão da queda; manter exposição sob controle. |
| Escala e distorção | Transformação opcional por cópia, sem anunciar parallax físico. |
| Suavidade | Desfoque das secundárias e transição das faixas separados. |
| Dispersão cromática | Franja opcional nas cópias; auditar interação com Fringing/CA para evitar duplicação. |
| Região de aplicação | Imagem completa ou máscara da fonte; região principal preservada ajustável. |
| Inspeção | Visualizar posições, regiões e máscara; alças de espaçamento, ângulo e centro na imagem. |

A máscara da fonte determina o conteúdo replicado; a máscara de aplicação determina onde o resultado aparece. Replicar somente uma pessoa exige máscara fornecida ou segmentação implementada: as referências não autorizam anunciar detecção automática. Sem máscara, a replicação também afeta o fundo.

### Implementação

Integrar como modo do módulo Prismas, compartilhando pipeline, alças, máscara, bypass, reset e persistência. Primeiro referência CPU de transformações/amostragem com pesos explícitos; depois GPU, cache e validação. Trabalhar com RGB linear e alpha premultiplicado; não usar soma de cópias sem definir ganho. Tratar bordas e áreas sem dados; não gerar preenchimento oculto artificial como se fosse refração exata.

São cópias simultâneas do frame atual, não eco de frames anteriores. Movimento em vídeo deve acompanhar o frame sem atraso temporal. Um eventual efeito de rastro temporal será outro modo, com contrato distinto.

### Validação

- Quantidade 1 e transformações neutras equivalem ao bypass conforme contrato; desligar preserva a saída.
- Quantidade, espaçamento, distribuição e orientação correspondem às posições previstas em chart sintético.
- Imagem uniforme mantém o comportamento fotométrico definido; pesos normalizados quando o modo promete conservação, sem clareamento inesperado.
- Máscaras, alpha, faixas e bordas sem costuras involuntárias ou contornos pretos; inspeção separa principal/secundárias.
- Escala consistente em diferentes resoluções/proporções; CPU/GPU comparados com tolerâncias registradas.
- Vídeo sem atraso de frame, cintilação, ruído aleatório ou reaplicação de estado antigo após reset.
- Comparar custo por quantidade de cópias; limitar a interface conforme capacidade medida e manter a exportação coerente com a prévia.

Esta ampliação integra a frente 5 do plano 1.0 como modo artístico de Prismas. Presets e recursos entram no escopo estável somente após validação; não há reivindicação de calibração do filtro comercial mostrado.

## Halo FX — refração anular com centro preservado

Status: planejado para **Filtros → Prismas → Halo FX**, sem implementação no executável. A descrição e as duas imagens enviadas são referências do efeito desejado, não instruções do documento nem medições do vidro. Não copiar a montagem comercial como interface ou assumir sua geometria exata.

### Aparência e comportamento

Uma região central de passagem direta mantém o conteúdo principal, enquanto uma faixa anular modifica a imagem periférica. As referências mostram arcos claros/coloridos relacionados às luzes, com sobreposição, refração e suavização. O efeito não deve desenhar um círculo luminoso fixo independente da imagem. “Halo” aqui significa aparência de refração anular; não é halation de filme nem o halo de difusão Mist.

Evoluir o preset Janela central para um modo específico, sem criar duas implementações incompatíveis de cobertura radial. Disponibilizar presets próprios **Halo suave**, **Halo refratado** e **Halo cromático**.

### Controles

| Controle | Comportamento planejado |
| --- | --- |
| Centro X/Y | Posição da região preservada; alça arrastável na imagem. |
| Raio interno | Tamanho do centro sem efeito. |
| Largura do anel / alcance externo | Extensão da região refratada, com definição explícita do que ocorre além do anel. |
| Transição interna/externa | Mistura suave nas duas bordas, sem costuras. |
| Refração radial | Deslocamento do conteúdo para dentro/fora, com sinal ajustável. |
| Giro / deformação tangencial | Ajuste artístico opcional, separado da refração radial. |
| Arcos secundários | Quantidade/ganho de amostras deslocadas, somente a partir do conteúdo da imagem. |
| Desfoque periférico | Suavização do anel sem alterar o foco principal. |
| Dispersão cromática | Separação de canais ajustável; auditar CA/Fringing para evitar duplicação involuntária. |
| Intensidade / máscara / bypass | Mistura global, aplicação localizada e reset próprio. |

Usar distância radial com correção de proporção para que a região seja circular em pixels quando selecionado esse modo. Raio definido em escala normalizada documentada; não converter uma imagem retangular em elipse por usar UV sem correção. Modo elíptico pode ser uma opção artística separada.

### Modelo artístico e limites

Definir um campo de amostragem radial/tangencial e máscara anular contínua. Manter a amostra original exatamente no núcleo cuja máscara é zero, incluindo a composição com desfoque: não calcular um blur global que depois vaze para a região preservada. No centro radial, evitar divisão por zero; parâmetros extremos não podem produzir NaN/infinito.

Arcos secundários usam ramos de amostragem/mistura com pesos explícitos. Documentar normalização e ganho, alpha premultiplicado, bordas e dados ausentes. Sem uma fonte compatível, o preset não inventa um arco de luz. O mapa de refração artístico não é ray tracing de um vidro físico.

Um modo físico futuro exige geometria anular/frontal apropriada, índices por comprimento de onda e suporte aos percursos do elemento. Não apresentar o editor axial de lente atual como suporte já concluído a esse vidro. Uma foto tratada não permite inferir transmissão, curvatura, espessura e dispersão necessárias para calibração.

### Implementação e validação

1. Compartilhar centro, máscara radial e região preservada com os modos de Prismas; definir escala e ordem de pilha.
2. Referência CPU de amostragem e mistura; presets próprios e testes sintéticos de pontos, linhas e grades.
3. GPU e comparação numérica; cache de mapa de amostragem conforme parâmetros/resolução, sem recalcular traçado da lente principal para um ajuste artístico.
4. Alças de centro e raios na imagem, campos editáveis, inspeção do anel, PT/EN/ZH e persistência.
5. Validar núcleo sem efeito, bypass exato, transições sem costura, alpha e limites de coordenadas. A região central pode ser afetada por outros módulos ativos da pilha; a garantia vale para Halo FX isolado.
6. Verificar circularidade em diferentes proporções, escala em 1080p/4K, CPU/GPU, preview/exportação e ausência de arcos artificiais em preto/imagem uniforme.
7. Vídeo: centro/raio contínuos, sem cintilação ou ruído temporal; reset/gestos cancelados não reaplicam respostas antigas.

Candidato ao escopo estável da frente 5 da 1.0 após validação. Presets artísticos inicialmente; equivalência comercial ou cálculo físico dependem de trabalho adicional identificado.

## Kaleidoscope FX — replicações em facetas periféricas

Status: planejado para **Filtros → Prismas → Kaleidoscope FX**, sem implementação no executável. A descrição comercial e as duas imagens são referências visuais; não identificam a geometria física, material ou número exato de facetas do vidro.

### Aparência desejada

Preservar uma região central de passagem direta e distribuir cópias transformadas do frame pelas regiões periféricas. As referências mostram repetições parciais do sujeito e do fundo, com orientação variável, sobreposição e franjas cromáticas mais visíveis em detalhes brilhantes. Não desenhar réplicas fora da imagem original nem confundir cópias 2D com novos ângulos reais da cena.

Evoluir os contratos de região preservada do Halo FX e de replicações do Linear FX. Este modo usa distribuição angular em torno do centro, enquanto Linear FX distribui cópias em um eixo e Halo FX usa refração anular. Não requer detecção automática do sujeito; a região central é posicionada pelo usuário.

### Controles

| Controle | Comportamento planejado |
| --- | --- |
| Centro X/Y e raio preservado | Região central sem alteração deste módulo, ajustável por alças. |
| Quantidade de facetas | Número de setores periféricos; limites definidos após medir custo e qualidade. |
| Rotação da distribuição | Orientação global das facetas ao redor do centro. |
| Alcance / afastamento | Região periférica ocupada e deslocamento das imagens secundárias. |
| Escala e rotação das cópias | Transformação de amostragem por faceta; presets com regras explícitas. |
| Espelhamento | Opcional; replicação de facetas não precisa equivaler a dobrar toda a imagem em simetria. |
| Sobreposição e transição | Limites definidos ou suavizados, com controle do ganho nas interseções. |
| Intensidade e suavização | Ganho e desfoque das secundárias, independentes da imagem central. |
| Dispersão cromática | Opcional e ajustável; sem duplicar inadvertidamente CA/Fringing. |
| Máscara / inspeção | Mostrar setores, região direta e conteúdo replicado. |

Presets próprios propostos: **Facetas nítidas**, **Facetas suaves** e **Facetas cromáticas**. A quantidade inicial de facetas é parâmetro de preset artístico, não identificação dos filtros das fotos. Direção, centro e raio podem ser ajustados diretamente na imagem. Bypass/reset próprios, persistência da ordem e parâmetros da pilha, PT/EN/ZH e blocos recolhíveis.

### Modelo e implementação

1. Compartilhar centro, escala com proporção corrigida, máscaras e alpha com o módulo Prismas.
2. Definir setores angulares e transformações de amostragem com referência CPU; replicar o frame atual, sem atraso temporal.
3. Compor caminhos com pesos explícitos; normalizar sobreposições onde o modo promete preservar ganho. Preservar o núcleo cuja máscara é zero, sem desfoque das secundárias vazando para ele.
4. Implementar GPU, cache dos mapas e máscaras por parâmetros/resolução, comparação CPU/GPU e alças da interface.
5. Validar combinação com demais filtros e integração preview/exportação antes da promoção ao escopo estável.

Tratar origem radial, fronteira angular de −pi/pi, interpolação, alpha premultiplicado e coordenadas fora do frame. Rotação precisa ser contínua; não introduzir uma costura angular involuntária ou amostras inválidas. Espelhamento artístico não constitui reflexão interna fisicamente traçada.

O futuro modo físico exige modelagem de faces inclinadas, índices espectrais, transmissão e caminhos do elemento frontal. Não apresentar este mapa artístico como traçado já suportado pelo editor axial de lente. Informação fora do campo ou oculta continua indisponível sem dados adicionais.

### Validação

- Bypass/ganho zero preservam a saída; região direta mantém o frame de entrada do módulo.
- Chart assimétrico verifica quantidade, orientação, espelhamento e posições previstas das cópias.
- Preto e imagem uniforme não geram highlights artificiais ou ganho inesperado.
- Sem costuras não intencionais entre setores, franja preta no alpha, vazamento no núcleo ou divisão por zero.
- Circularidade/escala coerentes em proporções diferentes e 1080p/4K; CPU/GPU e preview/exportação comparados com tolerâncias registradas.
- Rotação, centro e raio suaves em vídeo; mudanças de quantidade explícitas e sem estado residual; cancelar/reset não reaplica respostas antigas.
- Custo e memória medidos em função das facetas; limites de interface correspondem à capacidade testada.

Candidato à frente 5 da versão 1.0 como modo artístico de Prismas. Equivalência ao vidro comercial depende de calibração separada.
