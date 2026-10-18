# Flare óptico — correção de escopo

Referência do usuário em 04/10/2026: a luz produz uma resposta da lente que se integra a glow, bokeh e primeiro plano. Streak, Star e filtros de prisma não constituem essa entrega. Esta especificação corrige a interpretação anterior; não adiciona um recurso ao executável 1.0.0.

## Referências e seus papéis

- [Realflare](https://github.com/beatreichenbach/realflare): referência de render de flare baseado em traçado espectral na GPU. O README declara OpenGL 4.3 com compute shaders. Examinar implementação e comparar numericamente antes de escolher ou integrar um backend. Não foi instalado, executado ou incorporado nesta revisão.
- [Sapphire S_LensFlare](https://borisfx.com/documentation/sapphire/ofx/lensflare/): referência de aparência, edição e composição. Documenta hotspot, pivô, elementos, máscaras de oclusão, raios, atmosfera e composição Add/Screen. Isso não demonstra que seja um simulador físico equivalente ao Realflare.
- As duas imagens enviadas são referências visuais: núcleo intenso, caudas difusas, raios com estrutura e transição contínua de energia. Não fornecem a prescrição óptica, espectro, radiância ou pupila necessários para calibrar uma lente.

## Contrato do módulo

**Flare óptico** pertence à resposta da lente/inspeção óptica, separado de **Filtros**. Fonte luminosa, pupila e geometria da lente devem alimentar os componentes. Flare não é sinônimo de difração: reflexos internos, difração e espalhamento são mecanismos distintos.

1. **Fonte:** posição X/Y editável e arrastável, inclusive fora do frame; RGB/intensidade linear, tamanho angular e distância. Em fotografia LDR, permitir intensidade atribuída e mostrar que não é uma medida recuperada de highlights clipados. Detecção por luminância e fontes manuais devem compartilhar o mesmo contrato.
2. **Lente:** usar a prescrição atual, materiais, stop, foco e sensor. Ghosts vêm de percursos refletidos e transmitidos entre interfaces; não de círculos posicionados arbitrariamente.
3. **Pupila e difração:** calcular intensidade a partir da pupila complexa por comprimento de onda, incluindo abertura, fase/defocus e aberrações no domínio suportado. Bokeh geométrico e PSF de difração precisam de um critério comum de composição, evitando duplicar o núcleo de uma mesma fonte. A análise paraxial existente não é automaticamente válida para toda prescrição/campo.
4. **Espalhamento/glow:** integrar caudas amplas da luz com pesos explícitos. Sem dados medidos de superfícies ou partículas, identificar o componente como aproximação; aparência convincente não estabelece calibração física.
5. **Composição:** manter energia em RGB linear/HDR até a saída. Não clipar cada componente antes da soma. Ganho/escala criativos ficam separados de parâmetros ópticos. Visualizações: composto, fontes, ghosts, difração e espalhamento.

## Primeiro plano e oclusão

O objeto de primeiro plano bloqueia a luz incidente **antes** de ela gerar a resposta da câmera. A visibilidade da fonte deve modular os componentes associados. Bloqueio parcial da pupila pode modificar a forma do flare, além de sua energia.

Não recortar automaticamente os ghosts pela silhueta final do objeto: esses reflexos se formam dentro da lente e podem aparecer sobre a imagem do primeiro plano enquanto a fonte ainda é visível. Glow atmosférico, por outro lado, exige um tratamento de profundidade/volume próprio. Uma máscara 2D de fonte é uma aproximação controlada; depth monocular não fornece sozinho a visibilidade completa da pupila nem regiões ocultas.

Fonte, bokeh, flare e camadas devem usar o mesmo instante e a mesma visibilidade. Em vídeo, ausência de fonte ou fonte ocultada deve reduzir sua contribuição de forma estável; não reaproveitar uma análise antiga como se ainda correspondesse ao frame.

## Base existente e lacunas

| Componente | Estado no aplicativo |
| --- | --- |
| Ghosts por duas reflexões | CPU float64, três linhas espectrais, fonte pontual única; aplicação WebGL após cálculo explícito. |
| PSF espectral por Fourier | Análise escalar/paraxial de pupila transportada; não integrada ao render principal. |
| Difração/ghosts artísticos atuais | Proxies de imagem; não substituem o módulo óptico solicitado. |
| Streak/Star/Mist | Filtros artísticos independentes; permanecem com seus próprios nomes. |
| Fontes múltiplas e vídeo | Integração óptica automática ainda ausente. |
| Visibilidade comum com camadas | Ainda ausente para os percursos refletidos; não declarar oclusão física completa. |

Reutilizar `optics/ghosts.py`, `optics/wavefront.py` e `optics/spectral_psf.py` como referências numéricas. Unificar fonte/visibilidade e domínios de validade antes de adicionar outro solver desconectado. Usar execução isolada, lotes e invalidação por revisão para não bloquear a prévia. A escolha OpenGL/CUDA de um backend separado não resolve o limite OSL/OptiX do plugin Blender.

## Critérios de aceitação

- Fonte livre, parcialmente bloqueada e totalmente bloqueada; bloqueio altera energia sem recortar artificialmente ghosts no plano de saída.
- Abertura circular e poligonal: escala de difração e estrutura dos raios consistentes com a pupila e o comprimento de onda.
- Alterar foco, abertura, posição da fonte e superfície atualiza a resposta correspondente; reset não conserva resultados obsoletos.
- Zero/bypass exato, soma linear, preservação do contrato de alpha e unidades físicas explícitas.
- Comparação CPU/GPU para percursos e PSF, com tolerâncias e limites de amostragem registrados.
- Mesma fonte/visibilidade em preview, PNG e vídeo; não substituir exportação física por um proxy silenciosamente.
- Cena semelhante às referências com foreground cruzando a fonte, sem pulsação temporal ou dupla contribuição de glow/bokeh/difração.

Atualização 1.0.3: reflexos de duas interfaces foram integrados ao render, com fontes múltiplas, atualização automática, coatings e íris compartilhada. Ver `REVISAO-1.0.3.md` para uso e limites. O conjunto completo descrito acima, incluindo difração e espalhamento físicos e visibilidade 3D da pupila, permanece pendente.
