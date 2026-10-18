# Composição por profundidade — 0.7.7

Sem depth, a imagem inteira usa a Distância do plano. Com depth, o círculo de confusão depende da distância mapeada de cada pixel e de Focus, que continua em metros. O foco corresponde ao valor do mapa convertido para a mesma distância; não é comparado diretamente ao valor bruto 0–1.

## Channel, Gain e Bias

Selecione Red, Green, Blue, Alpha ou Luminância. Mapas escalares float gerados pelos modelos sempre usam seu único canal, independentemente da seleção RGB. Luminância usa pesos lineares 0,2126 / 0,7152 / 0,0722 sem decodificar sRGB: depth é dado, não cor.

A transformação compartilhada por todas as fatias é `t = clamp(canal × Gain + Bias, 0, 1)`, seguida pela direção de distância. Marcando **Valores maiores = mais longe**, t = 0 significa o limite próximo e t = 1 o distante. Desmarcado, a direção se inverte. Projetos antigos preservam a direção salva; novos começam com valores maiores = longe. Demo interno e modelos IA usam branco próximo; gerar depth configura automaticamente esse sentido e o canal escalar. Gain/Bias atuais são preservados e podem ser redefinidos para 1/0.

A distância interpola em dioptrias (inverso dos metros), coerente com a variação do desfoco. Gain/Bias não transformam uma inferência monocular relativa em uma medida física calibrada. Esta versão não importa EXR com Z em metros. PNG no navegador continua sujeito à precisão fornecida pela decodificação do navegador; o caminho CPU preserva PNG grayscale de 16 bits.

## Três caminhos

- **Contínua**: um passe esparso, rápido, indicado para mapas suaves. Mantém a rejeição aproximada de amostras por diferença de depth; bordas duras ainda podem cortar o bokeh.
- **Depth Slicing**: 4–32 fatias fixas no intervalo de distância, com pesos triangulares que se sobrepõem e somam 1. Cada fatia tem sua distância e PSF aproximada própria. Cor premultiplicada e cobertura são filtradas juntas antes da composição de longe para perto. Não há escolha aleatória de fatias ou troca de bins por frame. Mais fatias custam mais passes, memória e tempo; não há garantia de playback em tempo real.
- **Depth Cut**: dois planos, nos limites distante/próximo, para um sujeito contra o fundo. **Posição** separa os planos e **Suavidade** controla a transição do matte. A posição usa a escala interna de proximidade, depois de Gain/Bias e direção. Superfícies com várias distâncias exigem Slicing.

Esses modos são usados pela imagem, pelo vídeo e pela exportação GPU. Exposição, mistura, difusão e proxies de ghosts/difração são aplicados uma única vez após a composição. O CPU de referência usa as mesmas transformações e máscaras, mas continua um renderer diferente da prévia esparsa; Contínua no CPU aproxima a distribuição por cinco planos interpolados.

## Limites e validação

RGB + Z contém apenas a primeira superfície visível. Nenhum destes modos recupera corretamente um fundo oculto que não existe na entrada. As fatias normalizam cor e cobertura conhecidas para reduzir bordas escuras; isso é uma aproximação perto de oclusões e pode aumentar highlights onde falta fundo. A PSF das diferentes distâncias reutiliza posições/direções do atlas e deslocamento de foco; não é uma cena 3D traçada integralmente. Esta versão não importa mapas separados por camada de composição.

42 testes de unidade/integração passaram. Os novos testes cobrem Channel, Gain/Bias antes da direção, limites, soma das máscaras, distância ordenada e continuidade em fronteiras de fatias.

O teste opcional `tests/render_gpu_depth.py` executou os shaders reais em RTX 4090: Slicing/Cut preservaram campo uniforme comparado à mesma lente (erro máximo 0,00037 em RGB linear); sujeito em foco permaneceu opaco; o bokeh do primeiro plano voltou a se expandir além da borda que o caminho Contínuo cortava. Repetir um frame gerou saída idêntica. A comparação está em `../Depth-GPU-0.7.7.png`. ModernGL é necessário apenas para executar esse teste de desenvolvimento, não para abrir o app.

Os testes são offscreen: não substituem a validação da execução WebGL no navegador nem demonstram ausência de flicker em vídeo ou inferência temporal. O teste de continuidade usa perturbações próximas a uma fronteira de fatia; variações menores que a precisão float16 podem produzir a mesma saída. O padrão das fatias permanece fixo, mas mudanças reais do mapa ou do vídeo continuam alterando a imagem.
