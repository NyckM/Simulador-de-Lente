# Optica Lab 0.7.17 — Campo óptico

Em Amostragem e altas luzes, Resolução do campo óptico permite escolher 3 × 3, 5 × 5 (padrão) ou 9 × 9. A opção detalhada traça 81 posições espaciais em vez de 25. Mais posições preservam melhor as mudanças de forma nas bordas; o recálculo do atlas fica mais demorado. As amostras por bokeh (Quality) e os pontos de campo são controles independentes. A edição provisória com 1024 raios mantém um campo 3 × 3; o atlas completo respeita a opção selecionada.

A geometria das superfícies, índices de refração, diâmetros dos vidros e íris geram as aberrações nativas pelo traçado sequencial. Mesmo com Swirl e Coma adicionais zerados, centro e bordas têm PSFs distintas. Astigmatismo separa os planos de menor espalhamento nas duas direções; curvatura de campo desloca o melhor foco das bordas em relação ao centro. O recorte dos raios nas aberturas produz a perda de transmissão e a deformação periférica.

Ao mudar o foco, as posições e direções dos raios são projetadas no novo plano do sensor, sem congelar o desenho do bokeh. Edições nos vidros recalculam o traçado. Os controles criativos Swirl e Coma continuam sendo deformações adicionais dos offsets, sem calibração física. Esta versão não introduz sliders de astigmatismo ou curvatura de campo artificiais.

## Verificar no app

Escolha Double-Gauss · prescrição pública, Resolução do campo óptico 9 × 9 e uma imagem com luzes distribuídas pelo quadro. Varie o foco e a abertura. Para observar os vidros sem modificadores, deixe Swirl, Coma, difusão e esféricas adicionais em zero. Os presets criativos continuam disponíveis.

## Validação

62 testes passaram. Testes de feixes nativos verificam separação dos melhores planos tangencial/sagital, deslocamento do melhor foco entre centro/borda e menor transmissão fora do eixo. O shader real em RTX 4090 renderizou o atlas 9 × 9 com modificadores criativos zerados; mover o foco de 2 para 5 m aumentou o pico central de 0,336 para 18,578 na cena de pontos luminosos a 5 m. A imagem comparativa usa ampliação criativa do bokeh 4 para facilitar a inspeção.

## Limites

A GPU interpola entre posições do atlas, não traça cada pixel individualmente. O gather, a mudança aproximada da distância de origem com depth e a composição por planos continuam sendo aproximações. Aumentar a resolução espacial não transforma o motor em um renderizador completo de cena 3D nem elimina por si só todos os artefatos temporais. As prescrições comerciais dos perfis aproximados permanecem sem calibração medida.
