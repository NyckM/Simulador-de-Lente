# Streak — referências e especificação 1.0

Status: planejado para **Filtros → Streak**; não implementado no executável. As quatro imagens enviadas são referências visuais. Não identificam sozinhas a construção do filtro nem constituem medição de sua resposta óptica.

## Aparência desejada

- Retrato com decoração brilhante: faixas diagonais estreitas atravessando highlights, com halo suave adicional.
- Cena urbana: faixas horizontais longas; fontes vermelhas permanecem vermelhas e fontes claras aparecem claras/ciano.
- Decoração colorida: faixas centradas em pequenas luzes, com cores locais preservadas e possíveis direções cruzadas.
- Close desfocado: faixas diagonais extensas, sobrepostas, com halo e largura maiores.

O efeito deve nascer dos highlights da imagem. Não desenhar linhas decorativas desconectadas das fontes nem confundir as faixas observadas com streaks já aplicados à própria imagem de entrada.

## Controles

| Controle | Resultado |
| --- | --- |
| Liga/desliga e intensidade | Bypass próprio e força do efeito. |
| Ângulo | Horizontal, vertical ou diagonal, ajustável continuamente. |
| Comprimento e largura | Extensão ao longo da direção e espessura transversal, em escala normalizada. |
| Queda de intensidade | Caudas suaves; evitar término abrupto das faixas. |
| Núcleo e halo | Faixa estreita e espalhamento amplo controlados separadamente. |
| Cor | Cor da fonte por padrão; matiz escolhido e mistura cromática como opções artísticas. |
| Resposta aos highlights | Sensibilidade e transição suave; controle criativo identificado. |
| Direções adicionais | Ramo cruzado opcional e controlável, sem duplicar o futuro módulo de estrelas. |
| Máscara / inspeção | Separar seleção de fontes e área de aplicação; exibir fontes selecionadas. |

Presets próprios: **Horizontal fino**, **Diagonal suave**, **Faixas largas** e **Cruzado**. Não declarar equivalência a filtro comercial sem calibração. Campos e slider aceitam edição; projeto salva parâmetros, versão e ordem na pilha; reset afeta somente Streak. PT/EN/ZH, blocos recolhíveis exclusivos.

## Modelo planejado

No modo artístico, aplicar kernel direcional à contribuição selecionada das fontes em luz linear. Definir curva suave de seleção, núcleo, cauda e halo; preservar RGB da fonte quando não houver coloração escolhida. Mistura e ganho precisam ter contrato explícito para não criar aumentos de energia involuntários ao empilhar efeitos. O limiar de highlights é um recurso criativo, não prova de resposta física de vidro.

Um modo óptico medido poderá utilizar resposta ao ponto calibrada, sem limiar arbitrário, com componente direta e componente espalhada e tratamento de transmissão. A semelhança de uma faixa horizontal não demonstra que uma lente é anamórfica: não alterar o squeeze, o foco ou a geometria da lente apenas por ativar Streak.

Auditar proxies de difração/ghosts existentes antes de integrar; não duplicar automaticamente essas contribuições. Trabalhar com alpha premultiplicado, amostragem de bordas e política para luz fora do enquadramento. Não recuperar radiância perdida em fontes saturadas. As fotografias já tratadas servem para avaliar aparência, não para extrair uma calibração física confiável.

## Sequência de entrega e validação

1. Definir cor, escala, alpha, seleção de fontes e ordem no pipeline de Filtros.
2. Referência CPU com pontos sintéticos e quatro presets próprios.
3. GPU com kernel direcional, cache e comparação numérica; medir custo total para faixas longas e diagonais.
4. Interface, máscara de inspeção, persistência, bypass e reset.
5. Testes: fonte pontual isolada, várias fontes coloridas, linhas/áreas claras, preto, imagem uniforme, HDR, alpha, bordas e proporções variadas.
6. Comparar 1080p/4K, preview/exportação e CPU/GPU; verificar largura/comprimento normalizados, ausência de degraus diagonais e costuras.
7. Vídeo e gestos contínuos: limiar sem cintilação abrupta, ângulo sem saltos, reset durante tarefa pendente e ausência de padrões aleatórios no tempo.

Critérios: zero preserva a saída; cores e posições das fontes correspondem aos streaks; áreas não selecionadas não ganham fontes artificiais; combinações com difusão e prismas têm ordem registrada. Streak torna-se candidato à 1.0 na frente 5 e só passa ao escopo estável após essas validações. Calibração comercial é uma entrega separada.

## Referência adicional — Blue Flare FX

A imagem enviada mostra, no quadro inferior, faixas azuis aproximadamente horizontais junto às fontes luminosas e um véu luminoso mais amplo. O quadro superior contém o rótulo “NO FILTER” e o inferior “BLUE FLARE FX FILTER”; esses rótulos são contexto da referência, não instruções nem comprovação de resposta física.

Os quadros têm enquadramento, posição da pessoa e disposição aparente das fontes diferentes. Não usar esta captura para medir diferenças de exposição, contraste, energia ou resposta ao ponto do filtro.

Adicionar o preset artístico **Blue Flare**:

- Direção horizontal inicial; rotação disponível.
- Cor azul/ciano escolhida, com mistura ajustável entre coloração e cor original da fonte.
- Intensidade, comprimento, largura e queda de cauda independentes.
- Halo/véu amplo opcional, separado da faixa direcional e da difusão geral.
- Seleção suave de highlights, máscara de fontes e bypass próprio.

A cor azul é parte do preset; não deve alterar o balanço de branco da imagem inteira. Testar fontes brancas, quentes e coloridas: preservar controle sobre o quanto cada fonte recebe coloração. Não interpretar o preset como mudança da lente para anamórfica.

Para comparação quantitativa futura, obter o mesmo enquadramento e fonte sem/com filtro, em captura linear com exposição, lente, abertura e processamento documentados. O preset inicial é artístico e não calibrado.
