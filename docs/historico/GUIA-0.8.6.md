# Optica Lab 0.8.6 — eclipse de bokeh

Em Profundidade, ative Usar mapa e Eclipsar bokeh / oclusão por pupila. Atua em Depth Cut ou no modo automático com mapa binário. Permanece desligado nos projetos existentes. Fundo em far_m e objeto próximo em near_m, com separação ajustada por Depth Cut.

Cada amostra do atlas que forma o bokeh do fundo projeta a mesma célula da pupila até o plano próximo. O depth nesse ponto determina a visibilidade. Raios bloqueados não contribuem e sua energia não é renormalizada como se ainda existissem. As contribuições dos dois planos são somadas após esse bloqueio, sem aplicar novamente uma máscara alpha de primeiro plano ao disco inteiro. Diferentes partes do disco podem perder luz; não se trata somente de uma redução uniforme de brilho.

Limites: visibilidade de dois planos em espaço de imagem, com a mesma pupila do atlas e propagação paraxial entre profundidades. Não é traçado completo de uma cena 3D oculta. A extensão conservadora do fundo usada no modo normal é desativada neste modo para não inventar luzes escondidas; regiões sem RGB podem ficar escuras. Em Depth Slicing multiplano a opção ainda não atua. Deformações criativas complexas são aproximações.

Teste GLSL real na RTX 4090: pontos a 5 m, objeto próximo a 2 m, foco a 1 m. Partes do disco ficam bloqueadas e outras conservam a transmissão, com perda total de energia e padrão determinístico. Comparativo em ../Eclipse-GPU-0.8.6.png. As 70 regressões existentes passaram.
