# Transformações comuns dos filtros — versão 1.0

Requisito do usuário: os filtros precisam permitir ajuste de **posição e escala**. Status: planejado, não implementado nesta revisão.

## Controles compartilhados

- **Posição X/Y:** campos numéricos editáveis e arraste na prévia. Referência e limites documentados; possibilidade de deslocar o centro para fora do frame quando suportado.
- **Escala:** campo e slider em percentual; alças na prévia. Escala uniforme por padrão, proporção travada; escala X/Y separada como ajuste avançado quando fizer sentido.
- **Rotação:** campo editável e alça nos efeitos direcionais/facetados.
- **Pivô:** centro de transformação explícito; padrão no centro do efeito.
- **Reset da transformação:** restaurar posição/escala/rotação sem mudar perfil, intensidade, lente ou foco. Reset completo do módulo permanece separado.
- **Inspeção:** contorno da região, centro e alças apenas na interface, nunca gravados na exportação.

Campos aceitam ponto/vírgula conforme contrato do app. Alças e campos permanecem sincronizados; Esc cancela gesto. Coordenadas e escala são salvas no projeto e independentes da resolução de prévia/exportação.

## Significado por módulo

| Módulo | Posição | Escala |
| --- | --- | --- |
| Difusão/Mist | Posicionar máscara ou região de aplicação; no modo global uniforme, translação não muda a resposta e o controle deve indicar essa condição. | Alcance espacial do kernel separado da escala da máscara/região. |
| Fringing | Centro do campo e máscara da região; não deslocar automaticamente o centro óptico da lente no modo físico. | Largura das franjas separada da extensão da região. |
| Streak / Blue Flare | Posicionar máscara/região ou pivô do campo; faixas continuam ancoradas nas fontes. | Comprimento/largura das faixas separados da escala da região. |
| Prismas / Replicações | Centro, origem ou região da transformação; preservar ancoragem da imagem principal conforme preset. | Escala da região e escala das cópias separadas. |
| Halo FX | Centro da região preservada/anel. | Raios e largura do anel; manter proporção circular quando selecionada. |
| Kaleidoscope FX | Centro de distribuição das facetas. | Alcance da distribuição e tamanho das réplicas separados. |
| Split Diopter FX | Posição da divisão/região afetada. | Extensão/cobertura e transição; não alterar potência física em dioptrias como efeito colateral. |

Não movimentar as fontes luminosas originais por arrastar a área de Streak, nem alterar foco da lente por escalar um efeito artístico. Em um eventual modo de vidro físico, posição/escala precisam de unidades e geometria próprias; não confundir coordenadas 2D com translação de vidro em milímetros.

## Interação e implementação

1. Contrato comum de transformações: ordem, pivô, coordenadas normalizadas e escala mínima positiva.
2. Estado por módulo, persistência/migração e reset próprio; alteração de um filtro não move os demais.
3. Campos e alças compartilhados, com seleção explícita do filtro ativo. Gestos não deslocam o divisor antes/depois, não fazem pan da imagem e não acionam seleção de foco simultaneamente.
4. Mapas/máscaras GPU e invalidação seletiva de cache; descartar estados antigos após cancelar/reset.
5. Preview/exportação e mudanças de dimensão usam a mesma transformação. A proporção em pixels deve ser tratada explicitamente, evitando círculos elípticos por coordenadas UV.

## Critérios de validação

- Digitação, slider e arraste produzem o mesmo estado; cancelar restaura valores anteriores.
- Reset da transformação preserva perfil/intensidade; reset do módulo preserva outros filtros.
- Mesma posição relativa e escala em preview/exportação e diferentes resoluções/proporções.
- Alças acessíveis com zoom/pan; bloqueio apenas durante operações que realmente impeçam edição.
- Campos rejeitam NaN/infinito/escala inválida; bordas e transformações fora do frame têm comportamento documentado.
- Nenhum gesto interfere no foco, pan ou wipe; resultados atrasados não reaplicam transformação antiga.

Este contrato é dependência do painel Filtros e dos módulos espaciais da frente 5. Deve ser implementado antes de duplicar controles em cada preset.
