O candidato 1.0.0 implementa a pilha de filtros e seus controles. [Contrato de entrega e limites](VERSAO-1.0.md). O texto abaixo preserva o plano e bloqueadores históricos; o resultado final da validação acompanha o instalador.

# Plano de lançamento — versão 1.0

Revisado em 04/10/2026. Objetivo aprovado: reorganizar o desenvolvimento para a versão 1.0 do aplicativo. Este documento define trabalho e critérios de lançamento; não declara a versão 1.0 pronta. A execução foi autorizada em 03/10/2026. A versão de desenvolvimento é 0.9.30; a 1.0 final continua pendente. [Progresso e evidências](research/EXECUCAO-1.0.md).

## Objetivo do produto

Editar uma lente visualmente, ajustar foco na imagem ou no traçado 3D, interpretar depth e produzir um resultado previsível, sem perder ajustes ao alternar ferramentas ou recuperar a prévia. A versão 1.0 prioriza esse fluxo completo. A integração com os plugins vem depois da estabilização do aplicativo.

## Base existente e pendências

- Lente e foco reunidos: edição 3D, foco na imagem, respostas de bokeh próximas da lente e diagnósticos em aba própria. Geometria cilíndrica/asférica continua com edição numérica; as alças atuais não cobrem todos esses parâmetros.
- Menu: blocos exclusivos por grupo, ajustes avançados recolhíveis e preservação de valores. Ainda precisa passar por revisão do fluxo completo e por validação em diferentes dimensões de janela.
- Recuperação CUDA: servidor com processo CUDA separado, prazo para prévia/upload, encerramento do worker sem resposta e novo envio após recuperação; fallback WebGL e reset descartam respostas antigas. Processo controlado travado e paridade com DLL testados. Não garante recuperação de driver travado.
- Depth: interpretação relativa e em metros, normalização com faixa fixada, MoGe 3, Marigold V2 e inspeção de geometria. Metros estimados pelo modelo não equivalem a uma medição calibrada.
- Render por geometria, frente de onda, PSF espectral e ghosts têm escopos e limites próprios; sua presença na interface não significa que todos estejam integrados ao render principal.
- O caso MoGe 3 foi reproduzido com a foto indicada e nova inferência. Cut com faixa positiva agora usa profundidades intermediárias para variar o desfoque; contornos e oclusões ainda precisam de correção e validação. Não considerar o halo completamente resolvido.
- A imagem lateral do instalador foi substituída pela foto fornecida, com enquadramento sem distorção e recursos em duas resoluções.

## Sequência de implementação

| Ordem | Frente | Entrega | Critério de conclusão |
| --- | --- | --- | --- |
| 1 | Estabilidade da prévia e restauração | Revisar fila, cancelamento, descarte de respostas antigas e recuperação do trabalho em CUDA/WebGL. Avaliar isolamento do worker nativo para permitir reinício quando aplicável. | Sequências rápidas de sliders, modos de depth, troca de mídia e reset terminam no estado mais recente; uma resposta antiga não reaplica ajustes; falhas não mantêm a interface bloqueada. Recuperação nativa deve ser testada separadamente do aborto HTTP. |
| 2 | Depth, alpha e oclusões | Reproduzir o halo MoGe 3, localizar sua origem e corrigir com casos de referência. Conferir interpolação, alinhamento RGB/Z, validade, recortes, composição e alpha. | Casos RGB/depth reais e sintéticos verificados em Automático, Cut e Slicing; comparação CPU/GPU; nenhuma transparência indevida em imagem opaca; regressões de borda cobertas. Limites decorrentes de regiões ocultas ficam documentados. |
| 3 | Interface principal | Consolidar imagem, foco, lente 3D e bokeh em um fluxo simples; separar edição e diagnóstico; padronizar campos editáveis, abas, recolhimento, reset e estado de processamento. | Abrir mídia → gerar/importar depth → editar lente/foco → comparar → exportar funciona sem controles escondidos ou sobreposição; testes de teclado, ponto/vírgula, janelas menores e PT/EN/ZH passam. |
| 4 | Desempenho medido | Medir cálculo óptico, upload, render, transferência e apresentação; otimizar cópias, cache e agendamento conforme o gargalo encontrado. | Benchmark reproduzível antes/depois, incluindo tempo total e memória; saída comparada com referência usando tolerâncias registradas e justificadas; melhoria sem redução silenciosa da qualidade final. |
| 5 | Filtros de difusão | Criar módulo próprio com perfis, força, halo, suavização, máscaras e inspeção; integrar referência CPU e GPU. [Especificação](FILTROS-1.0.md). | Bypass exato, cor/energia/alpha/bordas/escala verificados; CPU/GPU comparados; perfis artísticos e medidos identificados. As referências comerciais não constituem calibração. |
| 6 | Consistência do render | Validar materiais, geometrias, distorção, PSF, efeitos disponíveis e camadas A/B/C com alpha/depth próprios. Explicitar o motor e o modelo usados em cada caminho. | Comparações numéricas e visuais de foco, energia, cromatismo, alpha e bordas; presets identificam origem; funcionalidades experimentais têm indicação clara; nenhum caminho anunciado exige um recurso que não esteja integrado. |
| 7 | Projetos, vídeo e exportação | Conferir salvamento/restauração, migração de projetos 0.9.x, troca de fontes, cache, cancelamento e exportação. | Projetos reabrem com ajustes equivalentes; exportações têm dimensões e formato corretos; vídeo preserva ordem/contagem/FPS no caminho offline que promete isso; uso prolongado e cancelamento não acumulam tarefas ou memória sem limite. |
| 8 | Instalação e candidato final | Revisar instalador, assets, complementos de depth, mensagens e documentação; executar validação completa sobre o pacote final. | Instalação limpa, atualização de 0.9.26 e desinstalação verificadas; pacote e fonte identificados por checksum; ambientes/GPU efetivamente testados publicados; bugs bloqueadores encerrados ou recursos afetados retirados do escopo estável. |

As frentes seguem essa ordem porque uma prévia confiável é necessária para avaliar bordas; bordas corretas sustentam o fluxo de edição; o fluxo definido permite medir o desempenho real. A validação final só começa depois que os caminhos de render e exportação estão definidos.

## Marcos de versão

| Marco | Conteúdo esperado | Condição de passagem |
| --- | --- | --- |
| 1.0 alpha | Frentes 1–3 concluídas: prévia estável, depth revisado e fluxo principal consolidado. | Casos reportados reproduzidos ou pendências explicitamente rastreadas; controles e reset verificados. |
| 1.0 beta | Frentes 4–7 concluídas: otimizações medidas, render consistente e fluxo de projeto/exportação verificado. | Comparações de referência e uso prolongado passam; escopo de funcionalidades está congelado. |
| 1.0 RC | Frente 8 concluída: instalador e aplicação testados juntos. | Matriz de validação executada no pacote candidato, com relatórios e limitações publicados. |
| 1.0 final | Mesmo escopo aprovado no RC, após correções dos bloqueadores encontrados. | Reexecutar os testes afetados por cada correção; validar novamente o pacote final; versão central, documentação e downloads coerentes. |

Os marcos não são datas prometidas. Correções necessárias podem ser entregues sobre 0.9.x durante o trabalho, mantendo a 1.0 como objetivo único.

## Posição e escala dos filtros

Requisito comum da frente 5: campos editáveis e alças para posição X/Y, escala e, quando aplicável, rotação/pivô. Persistência e reset por filtro; nenhuma interferência com foco, pan ou comparação. Implementar o contrato compartilhado antes dos controles específicos. [Especificação](FILTROS-TRANSFORMACOES-1.0.md).

## Split Diopter FX no planejamento da 1.0

Candidato à frente 5: desfoque e refração localizados por divisão rotacionável, mantendo uma região preservada. Primeira entrega artística com máscara, cobertura, alças e reset próprios. Cálculo óptico de dioptria parcial e duplo foco exigem evolução separada. [Especificação e validação](SPLIT-DIOPTER-1.0.md).

## Streak no planejamento da 1.0

Na frente 5, desenvolver **Filtros → Streak** a partir das referências: faixas horizontais/diagonais, núcleo fino e halo amplo, cor da fonte ou coloração artística. Candidato ao escopo estável após testes de GPU, alpha, escala, vídeo e empilhamento. Não equivale a mudar a lente para anamórfica. [Especificação e validações](STREAK-1.0.md).

## Prismas no escopo da 1.0

A frente 5 também inclui **Filtros → Efeitos de prisma**: véu lateral, janela central e duplicação suave, com posição/rotação/cobertura, alças e reset próprios. Inclui **Replicações / Linear FX**, com quantidade, espaçamento, direção, sobreposição e faixas facetadas. Inclui o candidato **Halo FX**, com refração anular, desfoque periférico e centro preservado, sujeito à validação. Inclui **Kaleidoscope FX**, com facetas periféricas e região central preservada, usando os mesmos contratos de máscara e amostragem. A primeira entrega é artística e identificada como não calibrada; traçado de prisma físico exige suporte geométrico adicional. [Referências e validação](PRISMAS-1.0.md).

## Perfis Mist e pilha de filtros

A frente 5 prioriza Black Mist, White Mist, suavização luminosa e suavização de detalhe, com bypass individual, ordem de processamento documentada e comparação global. Perfis próprios vêm primeiro; equivalência a filtros comerciais depende de calibração. Halation, streaks e estrelas são módulos adjacentes sujeitos aos critérios de escopo, não substitutos da difusão. [Referência revisada e validações](FILTROS-1.0.md).

## Fringing no escopo da 1.0

Na frente 6, adicionar **Fringing · franjas de cor** em Efeitos: intensidade, largura, seleção suave por contraste, matiz/saturação/luminosidade e variação centro–bordas. Integrar sem duplicar a CA/dispersão existente; distinguir modo óptico e artístico. Validar alpha, escala, estabilidade em vídeo e CPU/GPU. [Especificação](FRINGING-1.0.md).

## Filtros no escopo da 1.0

A nova opção **Filtros** integra o plano como frente 5, após estabilidade, depth, interface e profiling. Inclui perfis próprios de difusão, controles de intensidade e espalhamento, máscaras e inspeção da resposta. Perfis comerciais serão identificados como referência/artísticos até haver medições e calibração. As promessas do material enviado não são propriedades já validadas do aplicativo. [Implementação e critérios](FILTROS-1.0.md).

## Matriz mínima de validação

- **Interação:** sliders contínuos, digitação, arraste 3D, cancelar gesto, alternar abas/motores, reset durante tarefa pendente e respostas fora de ordem.
- **Depth:** mapa constante, gradiente, descontinuidade, inválidos, bordas de imagem, dados relativos e métricos; resultados reais dos modelos e passes CGI separados.
- **Composição:** RGB opaco, alpha parcial, foreground/midground/background, camadas A/B/C, fundo ausente e regiões ocultas. Não prometer reconstrução de informação ausente.
- **Óptica:** foco central e fora do eixo, antes/depois do foco, abertura, materiais e formas; distinguir referência física, aproximação e efeito artístico.
- **Desempenho:** prévias e exportações em 1080p/4K quando suportadas pelo caminho testado, tempo total, etapas, pico de memória e sessões prolongadas. Registrar hardware, motor e parâmetros.
- **Compatibilidade:** CUDA e WebGL; equipamentos disponíveis com capacidades distintas; Windows e demais plataformas somente quando houver validação do pacote correspondente.
- **Distribuição:** instalação limpa, atualização, persistência de projetos, download/verificação de modelos, interrupção e retomada, checksums e textos nos três idiomas.

Para cada item, registrar caso, parâmetros, resultado esperado, evidência, ambiente e status. Separar testes automatizados, inspeção visual e validação no executável. Uma bateria parcial não substitui a execução completa do RC.

## Bloqueadores registrados antes do candidato 1.0

1. Caso MoGe 3 reproduzido; transição Cut corrigida, mas contorno e oclusões ainda sem correção completa validada.
2. Recuperação por isolamento testada com processo controlado sem resposta; ampliar para sessões reais prolongadas e falha de contexto/driver quando reproduzível.
3. Bateria completa sobre o pacote candidato ainda precisa ser executada; os testes recentes de menu/reset são verificações específicas.
4. Matriz de equipamentos, sessões longas e migração/exportação precisa ser consolidada.

Estado da entrega Windows: CI e instalação/atualização/desinstalação passaram. Contornos de depth estimado e regiões ocultas permanecem limites explícitos; a matriz ampla de equipamentos e falha real de driver não reproduzida continuam sem validação. Não interpretar a numeração como resolução dessas limitações.

A classificação de novos defeitos considera perda de trabalho, travamento persistente, saída incorreta, transparência inesperada e controles essenciais inacessíveis como bloqueadores.

## Depois da 1.0 do aplicativo

Aplicar o contrato estabilizado de lente, depth, alpha e camadas aos plugins. Blender/OptiX: o addon 0.1.3 corrige a ativação indevida de OSL global; erro 2232/2048 e recuperação com materiais nativos foram reproduzidos no Blender 4.5.14 LTS. O limite por grupo continua; validar a cena original e viewport em frente própria. [Evidência e limites](blender/RECOVERY-0.1.3.md). Expansões de óptica ondulatória no render principal, reconstrução de regiões ocultas, aceleração por IA e novos modelos ficam para versões seguintes, salvo necessidade comprovada para corrigir um bloqueador da 1.0.


## Referência de prescrições e flares

O pedido de **flare óptico** compreende reflexões internas, difração e espalhamento associados à lente, à fonte e à sua visibilidade. Streak e Star da pilha artística não cumprem esse pedido. A integração deve compartilhar a resposta óptica com bokeh e glow, considerando a oclusão da fonte antes da geração dos artefatos internos. O sistema integrado permanece pendente; não está incluído no instalador 1.0. [Escopo corrigido e critérios de implementação](FLARE-OPTICO.md).

O catálogo FlareSim foi inspecionado como candidato a uma biblioteca de prescrições auditadas. Importação deve preservar unidades, semidiâmetro/diâmetro, stop, dispersão e proveniência; arquivos incompletos ficam em quarentena. Ghosts por reflexões internas são uma frente distinta de Streak/prismas e não corrigem o limite OSL do OptiX. Nenhum perfil ou renderizador novo foi integrado nesta inspeção. [Auditoria e critérios](research/FLARESIM-LENS-AUDIT.md).

O renderizador FlareSim também foi auditado como referência para uma futura aceleração de ghosts. Usar nosso analisador CPU como referência, distinguir pesos ópticos de ganho artístico, preservar recursos de geometria e validar recuperação sob carga antes de integrar à interface. A sincronização CUDA bloqueante da origem não resolve o congelamento do preview. [Arquitetura, limites e sequência candidata](research/FLARESIM-ENGINE-AUDIT.md).
