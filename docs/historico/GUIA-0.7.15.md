# Optica Lab 0.7.15 — Foco por profundidade

O render com depth map separa cor e cobertura antes de filtrar e compõe os planos do fundo para a frente. Isso evita que a filtragem de uma imagem inteira espalhe a cor do objeto nítido pelo fundo. Quando o foco passa para o fundo, o primeiro plano perde nitidez e seu bokeh pode ultrapassar o recorte, como esperado para um objeto desfocado.

## Usar

Recarregue o app com Ctrl+F5. Na seção de profundidade, use Foco perto, Foco fundo ou arraste o novo controle pelo intervalo do mapa. Esses controles também ativam o mapa. A cena de demonstração usa 2 m para o objeto e 5 m para o fundo. Mapas próprios usam as distâncias perto/fundo configuradas; confira inversão, canal, ganho e bias.

Automática usa dois planos para mapas estritamente binários e composição em fatias para mapas contínuos (12 por padrão, ajustável). Projetos antigos com o modo contínuo recebem automaticamente esta composição. Depth Cut e Depth Slicing continuam disponíveis para configuração manual.

## Validação e limites

Teste com o shader real em uma RTX 4090: os detalhes do primeiro plano perdem contraste ao focar no fundo, a luz distante recupera nitidez e o objeto em foco não adiciona um halo verde ao fundo. Repetir o mesmo frame produz resultados idênticos. As regressões de highlights e composição de profundidade também passaram.

A composição continua sendo uma aproximação por planos a partir de imagem e depth map. Ela não reconstrói superfícies escondidas nem equivale a renderizar uma cena 3D completa. Mapas contínuos podem exigir mais tempo de processamento e mais fatias. A estabilidade de um vídeo específico também depende da estabilidade temporal de seu depth map; os testes desta versão não substituem essa avaliação.
