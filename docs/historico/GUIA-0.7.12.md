# Optica Lab 0.7.12 — diafragma no desenho

O desenho recalcula 81 raios meridionais diretamente no navegador ao mudar a abertura.
Usa interseções com superfícies esféricas/planas e refração de Snell, na prescrição
mostrada. Os raios transmitidos ficam verdes; os bloqueados ficam discretos e terminam
na superfície que os bloqueia, incluindo o diafragma. Fechar a íris reduz a quantidade
de raios transmitidos e a largura do cone depois da íris.

A vista de foco mantém a escala vertical referenciada à abertura máxima. Assim, a
redução do feixe continua visível, sem um zoom automático que anule essa diferença.
A legenda mostra a quantidade de raios transmitidos. Número f, slider, presets,
teclado e arraste dos pontos laranja usam o mesmo desenho atualizado.

Validação: o traçado JavaScript coincide com os trajetos transmitidos do motor Python
com tolerância de 1e-7 mm. Testados f-stops diferentes, lâminas/rotação e alteração
de curvatura do vidro. Isso verifica o modelo; a interação de ponteiro no navegador
não foi medida por automação nesta atualização. O desenho é geométrico, meridional,
no comprimento de onda de referência; não é uma visualização de propagação de ondas.

Use Ctrl+F5 no app aberto para carregar a atualização.
