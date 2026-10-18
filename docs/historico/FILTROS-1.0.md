# Filtros de difusão — especificação para 1.0

Status: planejado; esta revisão não adiciona o novo painel ao executável. O controle de difusão existente é um modificador criativo não calibrado. As imagens e o texto enviados são referências de aparência e produto, não medições de filtros nem evidência de equivalência física do aplicativo.

## Posição e escala — requisito comum

Todos os filtros espaciais terão posição X/Y e escala com campos editáveis, slider/alças na prévia e reset próprio. Rotação e pivô quando aplicáveis. Separar escala da região, alcance do efeito e tamanho das cópias; filtros globais indicam quando a translação só atua na máscara. [Contrato compartilhado e validações](FILTROS-TRANSFORMACOES-1.0.md).

## Interface

Adicionar uma aba **Filtros**, com blocos recolhíveis exclusivos, seguindo o menu atual. PT/EN/ZH. O fluxo principal é escolher perfil, força e comparar na imagem.

| Controle | Comportamento planejado |
| --- | --- |
| Ativar / desativar | Bypass exato; não altera lente, foco ou depth. |
| Perfil | Famílias de resposta próprias inicialmente; perfis de filtros reais somente com origem e estado de calibração identificados. |
| Força | Mistura contínua e graus do perfil, quando definidos. Graus 1/8, 1/4, 1/2, 1, 2 e 3 não têm equivalência universal entre marcas ou famílias. |
| Halo / dispersão | Intensidade e alcance das caudas da resposta ao ponto. |
| Suavização de detalhe | Componente estreito da resposta, separado do halo amplo. |
| Contraste / véu | Controle separado; não simular todos os filtros apenas somando glow. |
| Resposta às luzes | Curva suave de seleção por luminância; controles artísticos de highlight separados da resposta óptica calibrada. |
| Máscara | Separar máscara das fontes que espalham luz da máscara que limita a aplicação do resultado. |
| Escala | Raio em unidade normalizada da imagem/sensor definido no perfil; o mesmo projeto mantém aparência ao mudar a resolução. |
| Inspeção | Prévia antes/depois, resposta ao ponto e gráfico de espalhamento em escala linear/logarítmica. |

Controles avançados começam recolhidos. Reset do filtro restaura apenas os ajustes do filtro. Salvar o perfil, parâmetros, versão do modelo e configuração de máscara no projeto. Animação/keyframes exige suporte real no fluxo de vídeo; não apresentar como disponível antes disso.

## Biblioteca de referência

As famílias enviadas — Black Diffusion FX, Black Frost, Black Pro Mist, Classic Soft, Fog, Glimmer Glass, Hollywood Black Magic, LoCon, Mitchell Diff, Pearlescent, Pro Mist, Radiant Soft, Satin, Scatter, Smoque e Soft FX — entram como referências para estudo e calibração, não como catálogo de emulações já comprovadas.

Começar com perfis próprios: difusão com halo contido, névoa ampla, suavização de detalhe e redução de contraste. Registrar parâmetros e proveniência. Um perfil inspirado deve dizer “artístico / não calibrado”; um perfil medido deve identificar filtro, grau, captura, exposição, lente e método de ajuste. O guia oficial Tiffen distingue efeitos sobre detalhe, halo e contraste; ele não fornece sozinho kernels numéricos para estes perfis:
https://tiffen.com/pages/diffusion-guide
https://tiffen.com/products/black-pro-mist-filter

## Modelo e integração

1. Definir entrada em luz linear, primárias/espaço de cor, escala de luminância e posição no pipeline. Usar o resultado composto da lente/camadas antes do tone mapping para o caminho óptico planejado. Uma etapa após a gradação é um uso artístico distinto e deve ser identificada.
2. Estabelecer uma referência CPU para resposta ao ponto. Um modelo inicial proposto é K = (1 − s) delta + s soma(w_i K_i), com kernels não negativos, pesos somando 1 e cada K_i normalizado. A convolução preserva uma imagem constante no interior sob condições de contorno apropriadas. Isso é uma base de aproximação, não uma identificação de filtro real.
3. Derivar suavização local e caudas amplas de kernels/curvas medidos quando disponíveis. Um filtro óptico passivo, em um modelo linear de espalhamento, não precisa de limiar arbitrário de highlights. Dependência de radiância deve ter evidência ou ser apresentada como ajuste artístico; verificar antes se vem de clipping, tone mapping ou captura da referência.
4. Tratar alpha premultiplicado e condições de contorno explicitamente. Não convoluir RGB reto ignorando alpha. Separar aplicação sobre composição opaca e efeito sobre elemento transparente: espalhamento físico pode expandir cobertura; preservar alpha é uma alternativa de composição, não equivalência automática. Dados fora da imagem são desconhecidos e o tratamento de borda deve ser documentado.
5. Implementar GPU a partir da referência CPU. Avaliar kernels separáveis/multiescala ou FFT conforme tamanho, erro e custo medidos. Não escolher um método rápido que altere a cauda da resposta sem quantificar a aproximação. Cache de kernels depende de perfil, força, escala, resolução e versão; máscara e imagem têm invalidação própria.
6. Integrar CUDA e WebGL, recuperação de falhas, preview e exportação. Indicar motor efetivo e diferenças suportadas. Só anunciar aceleração integral após medir todos os estágios; processamento de arquivo, transferência e codificação continuam podendo custar CPU.

A difusão desta frente não substitui a PSF de foco/difração já existente. Efeito de espalhamento amplo também não deve ser limitado por depth de forma automática: aplicar uma máscara de oclusão geométrica a um halo de filtro pode mudar sua natureza.

## Calibração e validação

- Respostas de pontos e bordas, múltiplas exposições em linear, preto, imagem constante e saturação; verificar positividade, energia, neutralidade e clipping.
- Comparação sem/com filtro físico em condições controladas; fundo escuro com fontes pontuais, chart e pele/texturas. Controlar exposição, foco, abertura, distância focal, iluminação e processamento.
- Comparar núcleo e caudas, alcance, contraste e detalhe; verificar canais separados. Captura saturada não recupera o pico original da resposta.
- CPU/GPU com tolerâncias justificadas e registradas; bypass deve preservar a saída; mudanças de força devem ser contínuas.
- 1080p/4K e diferentes proporções; consistência de escala, bordas, máscara e alpha; sem costuras ou mudança de aparência causada apenas pela resolução.
- Vídeo: sem padrões aleatórios que tremam; animação de parâmetros contínua quando suportada; efeitos de alterações de exposição documentados.
- HDR/SDR: mesmo processamento óptico linear pode ter aparências distintas após tone mapping. Validar cada transformação de saída; não prometer equivalência entre imagens recortadas e radiância original.
- Medir tempo total, memória e transferências; alterações rápidas não bloqueiam reset nem reaplicam resultados antigos.

Promessas como “fisicamente preciso”, “empiricamente mapeado”, “sem perda de luz”, “completamente neutro” ou “consistente em qualquer câmera/lente” só entram na descrição final quando sustentadas por validação. Ausência de ghosts, reflexões ou textura de bokeh pode ser uma decisão do modelo virtual; não demonstra reprodução completa do filtro físico.

## Entrega em ordem

1. Contrato de cor, alpha, escala e lugar no pipeline.
2. Referência CPU + perfis próprios + testes de resposta.
3. Motor GPU, cache e comparação numérica.
4. Aba Filtros, inspeção e persistência do projeto.
5. Comparações visuais, vídeo e exportação.
6. Calibração dos perfis reais conforme disponibilidade de dados.

Para 1.0: módulo funcional com perfis próprios claramente identificados e validações completas dos caminhos anunciados. A biblioteca comercial inteira e a equivalência medida de cada filtro não são condições automaticamente satisfeitas por esta entrega; só anunciar os perfis efetivamente calibrados.

## Referência adicional: Mist e efeitos empilháveis

O material sobre Pulse Color foi revisado em 03/10/2026. É referência funcional e comercial; não revela o código ou comprova a precisão fotométrica das emulações. A página do fornecedor anuncia efeitos combináveis, toggles individuais e processamento dos filtros em CPU; isso não serve como evidência de aceleração GPU do nosso aplicativo.
Fonte: https://pulseedit.com/pulse-color.html

### Perfis prioritários e controles

- **Black Mist:** núcleo de detalhe e halo contido, com menor véu amplo como objetivo visual. Não forçar as sombras a ficarem matematicamente inalteradas: luz espalhada pode atingir regiões escuras próximas. “Só brilha onde há luz” é uma simplificação visual, não uma condição de limiar do vidro.
- **White Mist:** resposta de espalhamento mais ampla e maior efeito de véu/contraste como objetivo visual, sujeito a calibração.
- **Glimmer / suavização luminosa:** perfil próprio de halo suave e retenção aparente de detalhe; nome comercial e equivalência apenas com referência documentada.
- **Suavização de detalhe:** perfil próprio com halo mínimo. Não chamar de detecção de pele sem segmentação implementada; não declarar equivalência a Black Satin sem calibração.

Cada efeito terá bypass individual e parâmetros próprios. O projeto registra a ordem da pilha; a comparação global permite desativar todos. Inicialmente documentar e fixar a ordem de processamento, em vez de permitir reordenação sem testar o resultado. Grau nominal e ganho contínuo ficam separados: 0,25 pode representar o rótulo 1/4, mas isso não demonstra que a resposta é um quarto da intensidade de um filtro grau 1.

### Correções técnicas ao texto enviado

1. **Limiar + blur + Screen é uma aproximação artística.** Screen(A,B) = A + B − AB no domínio normalizado; não equivale à soma de radiância linear e não é um modelo geral de transporte óptico. Com valores HDR acima de 1, essa expressão também perde a interpretação habitual de clareamento. A referência CPU usa resposta ao ponto em linear, componente direta e componente espalhada; a curva de highlights é opcional e identificada como artística.
2. **Black Mist não garante sombras intactas.** O guia oficial descreve alterações de contraste e espalhamento. Medir caudas e véu, em vez de preservar o preto artificialmente e anunciar fidelidade física. Fonte: https://tiffen.com/pages/diffusion-guide
3. **Uma LUT convencional .cube não gera halo espacial sozinha.** Ela não acessa vizinhos; pode integrar transformação de cor em um pipeline que também tenha processamento espacial. Blur, streaks e estrelas exigem processamento adicional.
4. **Emulação pós-captura tem limites.** Clipping, fontes fora do enquadramento, resposta espectral/câmera e dados ocultos restringem equivalência com o vidro. Formas semelhantes de halo não provam reconstrução da luz original.
5. **Film Look Creator é divulgado entre os recursos do Resolve Studio.** Não repetir a afirmação do texto de que funciona gratuitamente como recurso nativo do Resolve Free. Fonte: https://www.blackmagicdesign.com/products/davinciresolve/studio

### Efeitos adjacentes e limites do escopo

Halation de filme, streak anamórfico e estrelas 4/6/8 pontas ficam registrados como módulos distintos, com origem e pipeline próprios. O app já tem proxies de reflexos/difração: auditar e reaproveitar contratos antes de adicionar controles que duplicam esses efeitos. Halation não é sinônimo de difusão de vidro. Uma estrela pode ser modelada por kernel direcional no modo artístico; chamá-la de filtro físico exige resposta medida/modelo de abertura apropriado.

Para a 1.0, priorizar a pilha funcional de difusão e os perfis próprios validados. Os efeitos adjacentes entram somente após os critérios de estabilidade e qualidade, sem transformar a biblioteca inteira do produto de referência em requisito automático de lançamento. Integração com Resolve e outros plugins segue a fase posterior ao aplicativo.

### Testes adicionais

- Fontes pontuais idênticas sobre fundos de diferentes níveis: medir halo e véu; não inferir física apenas da aparência em display.
- Rampa de exposição HDR sem clipping: checar linearidade do modo óptico, comparando saídas em radiância antes do tone mapping. Modo artístico com limiar tem teste separado.
- Pilha, toggles e reset: bypass de um módulo não altera os parâmetros dos demais; persistência da ordem; não duplicar CA, diffraction ou ghosts.
- Suavização de detalhe e halo medidos separadamente; não prometer preservação de resolução quando o kernel reduz contraste de frequências altas.

## Efeitos de prisma

A aba Filtros também terá **Efeitos de prisma**, com refração localizada, duplicação suave e véu periférico, preservando uma região ajustável. As três referências visuais foram traduzidas em presets próprios e critérios de validação. Modo artístico e futuro traçado físico ficam separados. [Especificação](PRISMAS-1.0.md).

## Streak: referências recebidas

Adicionar **Filtros → Streak** como candidato à frente 5: faixas originadas dos highlights, com ângulo, largura, comprimento, queda e cor da fonte. Quatro referências traduzidas em presets próprios; modo artístico distinto de resposta óptica medida. Promoção ao escopo estável depende de validação. [Especificação](STREAK-1.0.md).

O módulo Streak inclui o preset artístico **Blue Flare**, com faixa azul/ciano horizontal, coloração misturável à cor da fonte e halo/véu controlado separadamente. A referência recebida tem enquadramentos distintos e não é um ensaio de calibração.

O módulo Prismas também inclui o modo planejado **Replicações / Linear FX**: múltiplas imagens deslocadas, sobreposição suave ou faixas facetadas, com quantidade, espaçamento, direção e ganho ajustáveis. Usa o frame atual; não é rastro temporal nem geração de novas vistas. [Detalhes](PRISMAS-1.0.md).

**Halo FX** amplia o módulo Prismas com região anular refratada/desfocada e centro preservado, centro/raios ajustáveis na imagem, arcos derivados do conteúdo e dispersão opcional. É distinto de Mist e halation. [Especificação](PRISMAS-1.0.md).

**Kaleidoscope FX** adiciona replicações em facetas periféricas, com centro preservado, quantidade, rotação, alcance, escala, espelhamento opcional e dispersão. Compartilha os contratos de Halo/Linear FX e é distinto de dobrar toda a imagem em simetria. [Especificação](PRISMAS-1.0.md).

## Split Diopter FX

Adicionar bloco próprio com divisão rotacionável, cobertura, inversão de lado, desfoque/refração locais e região preservada. Compartilhar contratos com Prismas; potência óptica e intensidade artística permanecem separadas. [Especificação](SPLIT-DIOPTER-1.0.md).
