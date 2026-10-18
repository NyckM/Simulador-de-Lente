# Referência competitiva e requisitos de controle

Consulta em 21/09/2026. Pesquisa de documentação pública e tutorial oficial, não benchmark dos plugins instalados. O Optica Lab ainda não supera esses produtos em conjunto. Mais sliders só constituem vantagem se controlarem aspectos úteis e verificáveis.

## LensNode: inventário documentado

A documentação identifica a versão 2.0.10. Foram lidas as seções do [guia completo](https://videovillage.com/learn/lensnode/): interface, seleção, controles, cor, qualidade, desempenho, diferenças de hosts e tutoriais. Referências externas foram tratadas como conteúdo, não instruções para executar/instalar software.

- **Perfis:** fabricante/família/variante, lentes capturadas e perfis artísticos. Inclui Helios, Cooke, Canon, LOMO, Petzval, Leica e formas especiais de abertura. A biblioteca medida é uma vantagem que ainda não temos. [Catálogo](https://videovillage.com/learn/lensnode/full-guide/lens-selection).
- **Força:** Master Blend, Overdrive, ganhos individuais estendidos e bypass em zero. [Blend/Overdrive](https://videovillage.com/learn/lensnode/full-guide/master-blend-overdrive).
- **Oito módulos:** distorção radial de dois termos; coma direcional; CA variável pelo quadro; fringe de contraste; blur com formas capturadas; bloom exponencial; vinheta; color cast espacial. [Controles individuais](https://videovillage.com/learn/lensnode/full-guide/characteristics/overview).
- **Combinação:** cada componente pode vir de outro perfil. Misturar características de lentes já existe no concorrente. [Mix & Match](https://videovillage.com/learn/lensnode/full-guide/mix-and-match).
- **Formato/abertura:** largura do sensor escala o caráter. f-Stop Sharpener reduz efeitos a partir do centro, mas não é simulação física de abertura e não altera blur de profundidade. [Sensor](https://videovillage.com/learn/lensnode/full-guide/sensor-size), [Sharpener](https://videovillage.com/learn/lensnode/full-guide/f-stop-sharpener).
- **Criativos:** centro X/Y animável, brilho de bokeh, boost/depth gain, swirl positivo/negativo e MTF baixa/média/alta com ganho mestre. [Creative Settings](https://videovillage.com/learn/lensnode/full-guide/settings-quality/creative).
- **Cor:** ACEScg interno, entradas ACES, Log de várias câmeras, DWG/Intermediate e Rec.709/sRGB. [Input Color Space](https://videovillage.com/learn/lensnode/full-guide/input-color-space).
- **Técnicos:** compensação das bordas da distorção, distorcer depth junto, precisão 16-bit, compressão de gamut, passos de CA/coma, reparo de bloom e defaults. [Technical Settings](https://videovillage.com/learn/lensnode/full-guide/settings-quality/technical).
- **Hosts:** Resolve, Premiere/AE e FCP nos guias, com entradas depth diferentes. FCP tem defaults e resolução adaptativa próprios. [Adobe](https://videovillage.com/learn/lensnode/host-differences/adobe), [FCP](https://videovillage.com/learn/lensnode/host-differences/final-cut-pro).
- **Limites:** recomenda resolução menor/cache quando necessário; não promete 4K irrestrito. Declara não simular flare e reconhece limites da reprodução 1:1. [Performance](https://videovillage.com/learn/lensnode/full-guide/managing-performance), [About](https://videovillage.com/learn/lensnode/about).

## Lenslab: confirmação pelo tutorial

A página [Lenslab](https://colourlab.ai/lenslab/) contém “Lenslab Tutorial”, de Color Intelligence, cerca de 7:26. Foi lida sua transcrição inteira. O antigo link Colourpro redireciona para [Filmlab Ai](https://colourlab.ai/filmlabai/).

O tutorial confirma presets V/A/S (vintage, anamórfico, esférico), intensidade/variantes; MTF por frequências com exemplos de 60/90 linhas por milímetro; suavização/aumento de detalhe; tint quente/ciano/magenta/verde; distorção por família e distância focal, com mistura; e vinheta óptica. O autor explica que simplificou a interface, ocultando parâmetros internos. A suíte anuncia também refração e aberração, sem detalhamento suficiente no tutorial. Grain, bloom, mist, difusão e gestão de cor são apresentados na suíte: não atribuir automaticamente tudo ao Lenslab isolado.

Não foi confirmado inventário público completo dos parâmetros internos, modelo de bokeh/depth ou desempenho local. “Não documentado” não significa “inexistente”.

## Matriz de controle

| Área | Referência | Optica Lab 0.2 | Próximo requisito |
|---|---|---|---|
| Força geral | Ganhos e blend | Mistura geral + modificadores | Bypass/solo/reset por módulo |
| Biblioteca | Perfis capturados no LensNode | Uma prescrição + estudos | Prescrições rastreáveis e capturas reais |
| Mistura de perfis | LensNode já oferece | Ausente | Origem por módulo e procedência visível |
| Bokeh espacial | Formas capturadas | Atlas 3×3 esparso | Atlas adaptativo por campo/foco/abertura/depth |
| Abertura/foco | Sharpener não é f-stop físico | Foco em m, stop em mm, filmback, lâminas | Pupila de entrada e f-number corretos |
| Energia do bokeh | Forma/brilho/swirl | Centro/borda de pupila; esférica ± 3/5 | Curva radial, mapas de abertura, lâminas curvas |
| Frente/atrás do foco | Não demonstrado separadamente | Defocus com sinal na geometria | Near/far independentes e modo físico vinculado |
| CA/fringe | Separados no LensNode | Dispersão proxy | CA lateral/longitudinal e fringe independentes |
| Coma/campo | Coma exposto | Prescrição + coma criativo | Astigmatismo e curvatura de campo assinados |
| Swirl/anamórfico | Swirl já existe | Swirl positivo e squeeze | Swirl ±, cat-eye, rotação e squeeze espacial |
| MTF | Ambos oferecem | Sem editor | Frequências/curvas e dependência de campo |
| Difusão/bloom | Presente nas referências | Difusão simples | Escalas, queda, cor e energia controláveis |
| Vinheta/tint | Ambos documentam | Transmissão relativa | Vinheta óptica/mecânica, tint centro/borda |
| Distorção | Ambos | k1/k2 + p1/p2 | Centro, overscan, STMap, breathing calibrado |
| Depth | LensNode aceita mapas | Mapa estático aproximado | Depth por frame, camadas e bordas confiáveis |
| Animação | Parâmetros do host | Sem keyframes | Timeline, curvas, rack focus, estabilidade |
| Cor/HDR | Pipeline profissional | sRGB; demo HDR interno | OCIO, ACES/Log, EXR float e alfa |
| Flare/ghosts | LensNode declara ausência | Ausentes | Superfícies/coatings e fontes fora do quadro |
| Vídeo/performance | GPU/cache/resolução | Preview GPU, vídeo local | Qualidade adaptativa e exportação offline |
| Plugins | Hosts profissionais | Ausentes | Núcleo portátil validado por host |

## Controle adicional que vale desenvolver

Estes são requisitos propostos, não alegações de ausência nos concorrentes:

1. **Laboratório físico:** superfícies, vidros, stop, grupos móveis e sensor; inspeção de pupilas, spots, PSF/OTF/MTF e transmissão. Origem e incerteza por perfil.
2. **Laboratório de bokeh:** frente/fundo separados, curva de energia centro/borda, apodização, obstrução, abertura customizada, cat-eye e esférica assinada. PSFs simultâneas no centro, meio e cantos.
3. **Curvas espaciais:** centro→borda, radial/tangencial, assimetria, descentramento e máscaras. Ganho global sozinho não substitui uma curva de campo.
4. **Mistura rastreável:** origem por efeito, trava física para manter correlações e modo artístico para desvincular parâmetros. Combinações inventadas não recebem rótulo de lentes medidas.
5. **Vídeo utilizável:** resposta sem botão de render, orçamento de frame completo, contagem de perdas e exportação final determinística com áudio/FPS/metadados.

## Prioridade e aceitação

**P0 — bokeh e resposta:** reduzir lacunas/ruído em PSFs grandes; medir latência p50/p95; comparar GPU/CPU em diversos campos e distâncias; testar vídeos reais. O protótipo ainda aproxima compressão, filtragem e gather.

**P1 — paridade criativa:** oito módulos independentes, solo/reset, MTF, vinheta/tint e variantes por módulo. Cada controle precisa de efeito independente e teste visual verificável.

**P2 — diferencial óptico:** pupila/PSF editáveis, curvas espaciais, depth temporal, materiais e calibração. Bancada com luzes pontuais, cartas, oclusores e rack focus; medir forma, energia e continuidade temporal.

**P3 — produção/plugins:** OCIO/EXR, render offline, áudio e tempo correto; motor compartilhado e adaptadores Resolve/Nuke/Adobe/ComfyUI. Não duplicar matemática divergente por host.

## Estudos enviados

[Neural Bokeh](https://immersive-technology-lab.github.io/projects/neuralbokeh/index.html) orienta PSFs aprendidas de capturas; não foi incorporado como modelo treinado. O [estudo de esférica](https://www.radojuva.com/en/2024/08/spherical_aberration_and_lens_bokeh/) motiva comparar energia e os dois lados do foco; não fornece uma lente comercial calibrada. O [arXiv 1804.03584](https://arxiv.org/pdf/1804.03584) trata de distorção geométrica, pertinente ao warp, não a um algoritmo de bokeh.
