# Etapa 3 — extensão do fundo e bordas de profundidade

Aplicativo 1.2.4. Implementação própria nos motores CPU, WebGL e CUDA.

Na composição de profundidade em camadas, a camada mais distante recebe uma
estimativa da cor escondida pelo primeiro plano. WebGL/CUDA buscam suporte na
pirâmide de RGB premultiplicado e cobertura da própria camada, escolhendo a
menor escala com suporte suficiente. A cor é normalizada e estendida ANTES da
integração de cada raio. A referência CPU estende o fundo antes da convolução.
O objeto não é usado como doador e sua opacidade continua separada da cor.

A busca mistura continuamente o suporte local com o doador mais amplo. Não
há suavização global da máscara do objeto, sharpening, nova inversão do depth
ou alteração dos controles de foco da etapa 2. Raios fora da imagem mantêm a
regra anterior; layers transparentes externas e eclipse por pupila mantêm seu
caminho de composição. O ABI CUDA v2 permanece com 356 bytes.

Esta etapa trata a camada de fundo da composição ordenada. RGB+Z não contém
informação real atrás dos objetos: padrões ocultos, grandes regiões sem
suporte, várias superfícies intermediárias e erros do mapa podem continuar
produzindo aproximações. Não substitui deep images ou reconstrução 3D.
Nenhuma nova calibração comercial ZEISS é incluída.

Validação reproduzível em `tests/test_depth_background_extension.py` e
`research/depth-stage3/`. O Blender permanece na versão 0.3.2: cenas 3D têm
geometria própria e não usam este preenchimento de fundo RGB+Z.
