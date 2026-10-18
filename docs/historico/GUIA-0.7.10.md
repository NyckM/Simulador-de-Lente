# Optica Lab 0.7.10 — Quality

Amostragem real do bokeh: Draft 24, Fast 48, Medium 96, High 256,
Very High 512 e Extreme 1024 amostras por canal e pixel.

- Prévia: Draft prioriza reprodução; Fast/Medium para trabalhar; High/Very High para revisão. Extreme destina-se a imagens estáticas e pode tornar vídeo muito lento.
- Render: qualidade independente da prévia. Padrão Very High. O tamanho de saída continua independente: 1920, 3840, 4096 ou tamanho original.
- High/Very High/Extreme usam AA 2× na prévia. A exportação usa resolução escolhida e AA 1×, com a mesma quantidade de amostras ópticas do nível selecionado.
- A qualidade permanece fixa durante exportação e gravação. Não é um parâmetro animável.
- Highlight Quality agora também aceita 512 e 1024. Atua quando supera a qualidade principal.
- O atlas RGB foi reorganizado para usar uma camada por amostra, sem consumir três vezes o limite de camadas da GPU.
- A prévia informa amostras efetivas quando limitada pelo hardware ou pelo atlas temporário usado enquanto arrasta a lente. A exportação exige o atlas definitivo e recusa um nível acima do limite da GPU.
- Projetos antigos Equilibrada/Detalhada são lidos como Medium/High. Projetos novos salvam também a qualidade de render.

Use Ctrl+F5 no app aberto para carregar os scripts atualizados.

Validação: testes de energia do atlas até 1024 amostras, migração, empacotamento RGB,
rotas HTTP e GLSL real na RTX 4090. Testes de quadros idênticos, profundidade e
highlights passaram. Isso não mede a reprodução no navegador nem garante ausência
de artefatos em qualquer vídeo ou mapa de profundidade. O render continua sendo
uma aproximação com atlas de raios e filtragem de imagem, não um path tracer completo.
