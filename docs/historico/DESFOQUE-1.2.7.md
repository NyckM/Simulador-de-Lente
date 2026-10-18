# Etapa 6 — desfoque por lado do foco · 1.2.7

Em Foco → Diafragma e formato, ajuste **Desfoque à frente do foco** e **Desfoque atrás do foco**, de 0% a 200%. Os dois em 100% preservam a resposta anterior. Menor distância em metros pertence ao primeiro plano; maior distância, ao fundo. Sem mapa, usa-se a distância do plano. Mapas relativos precisam ter Near/Far e sentido corretos.

Os ganhos escalam o espalhamento dos raios e sua filtragem de reconstrução, sem mudar a prescrição, a íris ou a transmissão. A transição perto do foco usa a faixa existente em dioptrias: smoothstep da diferença entre distâncias inversas. No foco exato, esses ganhos não alteram a resposta. Podem ser combinados com Preservar detalhe no foco. São ajustes editoriais, não calibração de uma lente real. Filtros, difusão e flare continuam independentes; 0% não remove esses efeitos nem recupera detalhe ausente.

Ambos aceitam keyframes no principal e nas layers A/B/C e são salvos nos parâmetros. O render de layers continua no WebGL. CPU, WebGL e CUDA aplicam a mesma curva; CPU scatter e GPU gather não são algoritmos idênticos. Em depth slicing a resolução dos planos depende do número de fatias.

CUDA ABI v4: 380 bytes. Entradas v1/v2/v3 continuam disponíveis e assumem 100% nos novos ganhos. Blender mantém a versão 0.3.2; esta etapa atualiza o aplicativo.
