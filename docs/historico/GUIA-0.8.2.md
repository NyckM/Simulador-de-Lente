# Optica Lab 0.8.2

Correção do viewer: a validação WebGL rejeitava o atlas 9 × 9 que o servidor oferece, deixando o lado Lente vazio quando selecionado. Agora aceita 3, 5 e 9. O app só adota o novo atlas após o upload GPU concluir.

Regressão com os atlas reais do servidor carregados pelo método setKernel da interface para os três campos. Renderização do GLSL real no campo 9 × 9 na RTX 4090, com foco em 2 m e 5 m, confirmou imagem não vazia e mudança de foco. Nenhuma alteração na posição do wipe.
