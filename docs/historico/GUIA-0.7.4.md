# Bordas do bokeh — 0.7.4

Em **Íris e formato**, dois controles independentes:

- **Suavizar recortes internos** — ligado por padrão. Aplica uma transição cúbica para dentro da abertura livre de cada superfície, incluindo os recortes fora do eixo que produzem cat’s-eye. Desligar recupera o recorte duro e usa uma reconstrução mais nítida das células na GPU.
- **Suavidade da íris · fração do raio** — de 0,00 a 0,30; padrão 0,00. Em 0,10, suaviza a faixa externa de 10% do raio local do diafragma, circular ou poligonal. Atua no plano da íris, separado dos vidros.

Esses controles alteram os pesos dos raios e o atlas, sem aplicar blur global à imagem composta. São mantidos nos projetos salvos e usados nas exportações PNG, MP4 e WebM. A exportação aguarda a atualização do atlas; os controles ficam bloqueados durante a exportação de vídeo.

## Implementação e limites

O recorte interno usa uma faixa de 2,5% do raio de cada abertura livre, com curva suave de cobertura para dentro. Nenhum raio fora da abertura é admitido. É uma suavização numérica/artística; não representa transmissão medida do vidro nem difração. A largura é independente da qualidade de traçado e do número do frame.

A GPU integra as células esparsas pela pirâmide de imagem linear, com filtragem maior quando a suavização interna está ligada. A faixa de cobertura traçada e a filtragem das células são complementares. A versão continua sendo uma aproximação com 24, 48 ou 64 amostras; este controle não garante um disco perfeito em qualquer desfoque nem resolve a oclusão/depth slicing pendentes em DEPTH-E-OCLUSAO.md.

Não é uma reprodução do algoritmo proprietário da referência. O comportamento solicitado foi implementado no modelo óptico próprio do app.

## Validação

33 testes passaram, incluindo cobertura contínua, ausência de vazamento além da abertura, separação entre vidro e íris, rejeição de parâmetros inválidos, cache e determinismo do atlas, normalização e regressões ópticas/HTTP. `node --check` passou em app.js e gpu.js.

`tests/compare_edges.py` gera uma comparação de PSFs CPU com a mesma escala por linha e sem blur adicional. A cena usa foco em 0,5 m, plano em 5 m e íris de 8,55 mm, no centro e no campo de 14 mm. A imagem é uma visualização do traçado CPU, não evidência da saída GPU.

A checagem visual no navegador desta versão ficou indisponível por falha de inicialização do ambiente de automação Windows (ACL). Portanto a compilação dos shaders e a comparação visual em reprodução de vídeo ainda precisam ser verificadas no navegador.
