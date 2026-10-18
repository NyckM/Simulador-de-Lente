# Etapas 1 e 2 — foco e diagnóstico

## Aplicativo 1.2.3

Na aba **Foco → Diafragma e formato**, use **Preservar detalhe no foco** (0 a 1). Zero mantém o resultado óptico anterior; 1 suprime a dispersão residual da PSF no plano escolhido. A correção atua nos deslocamentos dos raios e no footprint de reconstrução, antes de difusão, filtros e composição dos efeitos ópticos. Mantém os pesos de transmissão da pupila.

**Transição do foco · dioptrias** define a largura em diferença de distância inversa: abs(1/Z - 1/foco). A curva smoothstep tem inclinação zero no foco e na borda da faixa. O padrão 0,1 significa, com foco em 2 m, influência aproximadamente entre 1,67 e 2,50 m; fora dessa faixa o desfoque original permanece. Comece com preservação 0,5 e ajuste a faixa conforme a cena. Isto é preservação editorial, não uma lente calibrada.

Os parâmetros são salvos nos projetos e disponíveis para keyframes no principal e nas ópticas das layers A/B/C. Mapas relativos e métricos usam o Z já interpretado. A correção não melhora um mapa com escala errada, não torna a fotografia original mais nítida e não recupera detalhe ausente. Filtros/difusão ainda podem suavizar o resultado.

## Blender 0.3.2

No painel Bruxos, ajuste **Preservar detalhe no foco**. A câmera aproxima a interseção de cada raio primário no plano focal de um alvo comum, calculado por um raio principal verde traçado pela própria prescrição. A resposta segue o enquadramento óptico e não usa um recorte de profundidade. Zero mantém o trajeto anterior; o parâmetro aceita keyframes.

Não há controle de largura em dioptrias no Blender nesta etapa: a cena 3D é renderizada pelos raios modificados, em vez de compor um mapa Z visível. Reflexos internos não recebem a correção dos raios primários. O traçado adicional aumenta o custo quando ativado: no teste CPU de 384×256/512 amostras, os renders passaram de aproximadamente 5,8 s para 20–21 s. Na mesma cena, em OptiX na RTX 4090, os tempos foram 0,87 s (zero), 1,23 s (0,5) e 1,07 s (1). Não generalizar esses tempos para cenas ou máquinas distintas.

## Diagnóstico e limites

Veja [as cenas e medições](research/focus-stage12/README.md). Foram verificados: PSFs em duas construções, aberturas e posições de campo; transição contínua; transmissão; regressão CUDA com controle em zero; WebGL/CUDA com mapas relativos e métricos; controles e keyframes; render Blender CPU e OptiX. A forma atual de preencher o fundo oculto permanece como antes. A etapa 3 ainda está pendente.
