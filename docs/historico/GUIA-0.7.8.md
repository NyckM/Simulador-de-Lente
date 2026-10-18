# Diafragma — 0.7.8

O painel Diafragma e formato agora permite ajustar a abertura em f-stops por número, slider em stops e escolhas rápidas: totalmente aberta, f/2.8, f/4, f/5.6, f/8, f/11, f/16, f/22 e f/32. A faixa permitida depende da prescrição. Na Double-Gauss atual, a máxima abertura paraxial é aproximadamente f/2.03; não é possível escolher f/1.4 sem mudar fisicamente a lente.

O f-number usa o diâmetro paraxial da pupila de entrada, obtido pela matriz dos elementos diante do stop. Não usa simplesmente o diâmetro do diafragma interno. Na lente original, uma íris de raio 8,55 mm corresponde a uma pupila de entrada de cerca de 24,8 mm e f/2.03. Editar os vidros frontais recalcula essa relação. É uma estimativa paraxial nominal do diâmetro externo da abertura; não é T-stop nem uma calibração de exposição de uma lente comercial ou de cada forma poligonal.

Arraste qualquer uma das duas alças laranja junto ao diafragma no desenho. O raio físico, f-number e controles acompanham o movimento. As setas para cima/baixo ajustam o raio quando a alça está selecionada; Shift aumenta o passo. O raio é o parâmetro persistido no projeto, evitando conflito entre dois controles independentes de abertura. Cancelar o gesto restaura o raio inicial.

A vista frontal mostra o tamanho da abertura e sua forma: circular (0 lâminas) ou poligonal (3–16), com a rotação escolhida. Lâminas, rotação, suavidade da íris e suavização dos recortes internos permanecem controles separados. A vista frontal é uma geometria idealizada, não uma animação de mecanismos de lâminas comerciais ou uma visualização da PSF final.

Ao abrir ou fechar, o traçado e o atlas são recalculados. Durante a atualização, os raios anteriores ficam esmaecidos no desenho; o processamento acompanha o gesto em requisições agrupadas, não de forma síncrona por evento de mouse. A imagem usa o atlas mais recente até que o novo esteja disponível. Ao soltar, o atlas completo é solicitado. A abertura afeta bokeh, cobertura e os proxies de difração; a exposição continua manual, sem queda automática de brilho de um stop.

## Validação

45 testes passaram. Novos testes verificam a pupila de entrada, a duplicação do f-number quando o raio é reduzido à metade, a mudança de pupila ao editar os vidros e a correspondência do código JavaScript do controle com os dados ópticos do backend. Testam os limites e o arraste das duas alças. Sintaxe JavaScript verificada e dados de abertura disponíveis por HTTP.

Os testes de interação executam o mesmo modelo JavaScript das alças, mas não um gesto de mouse no navegador. A interação visual completa continua pendente de validação no navegador; as verificações não demonstram ausência de flicker no vídeo nem desempenho em qualquer GPU.
