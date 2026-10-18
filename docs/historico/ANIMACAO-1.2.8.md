# Etapa 7 — animação e entrega · aplicativo 1.2.8

Na timeline, selecione Principal ou uma layer A/B/C no modo Imagem e o controle. Ajuste o valor, adicione ◆ Keyframe, avance o quadro e repita. Linear, Suave e Constante estão disponíveis. A lista de trilhas agora mostra os nomes dos parâmetros; os identificadores permanecem no tooltip para preservar os projetos.

Preservação de foco, faixa em dioptrias, anéis/granulação/frequência/rotação da textura e intensidades de desfoque anterior/posterior aceitam trilhas independentes no principal e nas layers. Clarear laterais e seu limite em EV são controles do resultado principal. Glitter e vidro têm seus próprios controles, sem trilhas ópticas de imagem.

Os controles das etapas 2–6 permanecem integrados. Em 100%, os ganhos por lado mantêm a óptica anterior; a textura desligada e a preservação em zero mantêm o caminho anterior. Salvar projeto mantém os valores base e trilhas. Remover trilha restaura seu valor base. Projetos antigos sem os controles novos recebem os padrões compatíveis.

Prévia usa a resolução escolhida e pode reduzir amostragem. Exportação usa qualidade/resolução de saída. Para comparar, escolha a mesma resolução e amostragem. CUDA usa float16 na prévia e float32 na exportação; pequenas diferenças de quantização são esperadas. CPU scatter e GPU gather não são idênticos. Layers são compostas no WebGL, com alpha processado junto ao desfoque.

O manifesto data/animation-optics.json registra limites, padrões e targets dos controles. Os testes em research/animation-stage7 verificam valores por frame, repetição, cache, projetos antigos, salvar/reabrir e exportação.

Esta entrega fecha o aplicativo Windows e seus fontes. O addon Blender continua 0.3.2: sua animação de foco, focal, diafragma, swirl e filtros usa as curvas do Blender. Os novos controles de imagem não foram copiados para sua câmera 3D. Resolve/After Effects/Nuke/Photoshop e ComfyUI mantêm os pacotes anteriores; esta versão não altera suas interfaces nem afirma paridade com estes controles.

Validação desta entrega: 10 controles no principal (CUDA/WebGL), 8 controles nas três layers, criação/remoção de keyframes pelos botões reais, salvar/reabrir e migração de projeto estático. PNGs idênticos à prévia em 192×128 com a mesma amostragem; MP4 de três quadros decodificado. 500 mudanças de controles reutilizaram o atlas óptico. A medição usa cena sintética pequena e cache aquecido, sem representar desempenho em 4K.
