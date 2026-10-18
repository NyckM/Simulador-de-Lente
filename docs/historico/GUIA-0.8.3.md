# Optica Lab 0.8.3 — gotas

Em Gotas / plano refrativo, aumente Mistura das gotas para ativar. Escolha distância, raio, densidade, intensidade de refração e seed. Focar nas gotas sincroniza a distância de foco com esse plano. Raio usa a largura de referência 1080 para manter o tamanho relativo ao exportar 4K.

As gotas são elipses procedurais com perfil de calota e borda suavizada. O shader desloca as coordenadas da imagem já formada e amostra 32 posições da pupila traçada no plano das gotas. O foco e a abertura alteram o desfoque dessa distorção. A distribuição é fixa entre frames. O passe roda localmente na GPU, após composição de depth e highlights e antes de converter para sRGB; também é usado nos renders de vídeo e frames.

Com depth, superfícies mais próximas que as gotas permanecem intactas. Sem depth, usa-se a distância do plano da imagem. Mistura geral zero também desativa as gotas. A distribuição está nos perfis/projetos, sem textura externa.

Limites: refração em espaço de imagem e calotas procedurais, sem geometria líquida 3D, múltiplas interfaces ar/água/vidro, cáusticas ou reconstrução de regiões ocultas. Não representa uma simulação calibrada de gotas nem uma reprodução da referência.

Validação: shader real na RTX 4090; distorção mais detalhada em foco do que fora dele; renders repetidos idênticos; camada desativada e objetos em frente preservados; 70 regressões existentes passaram. Comparativo: ../Gotas-GPU-0.8.3.png.
