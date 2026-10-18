# Foco pelo desenho — 0.7.5

Arraste a barra **↔ Arraste para focar**, sob o conjunto de vidros. Todos os elementos e a íris se movem juntos em relação ao sensor fixo. O valor de **Distância de foco** acompanha o arraste, e o resultado da imagem é atualizado. Ajustar o controle numérico ou seu slider produz o mesmo movimento.

O movimento usa a matriz óptica da prescrição atual, incluindo edições nos vidros. Não muda curvatura, diâmetro ou espaçamento interno. As alças individuais continuam editando essas propriedades. O intervalo de foco permanece de 0,3 a 20 m; o arraste para nesse limite. Com a barra selecionada pelo teclado, use as setas esquerda/direita e Shift para um passo maior.

A vista **Formação do foco no sensor** amplia os últimos segmentos dos raios, com o sensor em laranja e o foco paraxial em azul. Permite ver a convergência antes, sobre e depois do sensor, inclusive quando o deslocamento real dos vidros é pequeno na vista geral. A escala horizontal da vista geral fica fixa; a janela ampliada informa a sua largura em milímetros. Raios periféricos podem cruzar em posições diferentes por aberração esférica.

O diagrama carrega independentemente da GPU e a interação não depende do render da imagem. Ele representa foco por translação do conjunto completo segundo o modelo atual. Ainda não representa mecanismos internos ou grupos flutuantes específicos de uma lente comercial. O feixe desenhado corresponde à Distância do plano informada, e não a todos os pixels de uma cena com depth.

## Verificação

35 testes passaram. O teste novo executa o mesmo código JavaScript usado pelo desenho com dados de uma prescrição original e outra editada: conversão entre movimento e distância de foco, sensor fixo, escala fixa, limites, ida/volta sem deriva e comparação com o foco calculado por ray tracing. A sintaxe de app.js e lens-view.js foi verificada. O teste HTTP também confirma que o navegador recebe o módulo de foco com o tipo JavaScript correto.

A automação visual do navegador continuou indisponível por falha de inicialização do ambiente Windows (ACL). A interação de mouse completa ainda precisa de confirmação visual no navegador; os testes acima validam a matemática e não substituem essa checagem.

O aviso decorativo de versão/prévia e os indicadores de status em forma de ponto foram removidos da interface conforme solicitado. A versão permanece disponível em `/api/health` e nesta documentação.
