# Optica Lab 0.8.7 — Shimmer

Abra Shimmer / camada de brilho e aumente Intensidade para ativar. Controles: distância em metros, escala relativa à largura 1080 px, densidade, limiar linear de altas luzes e distribuição/seed. O botão Focar na camada Shimmer move o foco à distância da camada. Valores são salvos nos perfis e projetos. Desligado por padrão.

Cada amostra da pupila que forma uma luz consulta uma estrutura espacial fixa no plano Shimmer. A mudança de foco altera os caminhos que atravessam esse padrão. Ganho criativo é adicionado somente à parte da radiância acima do limiar e a objetos atrás da camada. Não se usa tempo nem ruído aleatório por frame. Escala relativa à imagem e suavização subpixel evitam depender da resolução de saída.

O shader usa a mesma radiância incidente para calcular a máscara nos passes Base e Highlights; a decomposição se mantém aproximadamente aditiva na precisão HDR da GPU. Composição de depth e eclipse preservam a multiplicação por visibilidade. O resultado segue para difusão e gotas, quando ativadas, e é usado na prévia e exportação de vídeo/frame.

Limites: estrutura procedural e modulação criativa de radiância em espaço de imagem, com propagação de dois planos baseada no atlas. Não é uma microestrutura óptica calibrada, nem simulação espectral de um filtro comercial. Sem evolução temporal automática; o cintilar decorre do foco, da imagem e do movimento.

Teste GLSL real na RTX 4090: gains diferentes para duas luzes; mudança com foco; frame repetido idêntico; regiões abaixo do limiar e luzes à frente da camada intactas; Base + Highlights próximo de Final (erro máximo 0,000275 em luz linear no teste). As 70 regressões existentes passaram. Artefato: ../Shimmer-GPU-0.8.7.png.
