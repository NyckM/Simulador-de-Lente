# Bokeh e reconstrução — 0.7.6

A prévia antes comprimia o traçado em apenas 64 células por canal. Agora usa até 256, conforme o limite de camadas da GPU. Equilibrada avalia até 96 amostras, Detalhada e exportação até 256. Arrastar a lente ainda usa temporariamente um atlas menor; ao soltar, o atlas completo é recalculado. Vídeo respeita a qualidade escolhida, sem o antigo limite fixo de 64 amostras.

Os níveis de redução da textura usados pelo bokeh agora recebem um filtro gaussiano binomial 5 × 5, com interpolação contínua entre níveis. Isso reduz o contorno quadrado da redução anterior e preenche as lacunas entre células de amostragem. O nível original da imagem permanece intacto, e a composição final não recebe um desfoque global. Soften Internal Cutoff e Iris Softness continuam controlando coberturas ópticas distintas.

O padrão permanece fixo, sem ruído que muda a cada frame. Mais amostras e a pirâmide filtrada aumentam o custo por frame; esta atualização não promete reprodução em tempo real em qualquer GPU ou resolução.

## Verificação

36 testes de unidade e integração. Teste novo compara o segundo momento do atlas com o feixe completo: 256 células recuperam melhor a distribuição traçada que 64. Sintaxe JavaScript verificada.

O teste opcional `tests/render_gpu_banding.py` executa os shaders GLSL reais em uma GPU via ModernGL (dependência somente de desenvolvimento). Validado em RTX 4090: saída finita, sem erros GL, dois renders do mesmo frame exatamente iguais e radiância de campo uniforme preservada em relação ao filtro anterior. Gera uma comparação HDR sintética sem depth em `../Bokeh-GPU-0.7.6.png`. Não mede desempenho WebGL nem testa um vídeo em movimento. A cópia entre níveis da implementação WebGL ainda precisa de verificação visual no navegador.

## Limites

A reconstrução continua sendo gather esparso aproximado. O tratamento atual de depth rejeita amostras por diferença de profundidade; não é composição por profundidade com fundo reconstruído ou múltiplas camadas ocultas. Portanto, contornos e halos causados por oclusão não podem ser declarados resolvidos por esta mudança. A imagem isolada enviada não permite identificar os parâmetros nem confirmar se havia depth ativo. Estabilidade temporal em vídeo também depende do mapa de profundidade e das mudanças de conteúdo; repetir um frame estático não comprova ausência de flicker no vídeo.
