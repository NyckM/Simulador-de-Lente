# Optica Lab 0.8.4 — contorno de depth

Corrige a normalização sobre buracos da camada de fundo. Ao focar o fundo, a cobertura transparente criada pelo objeto próximo era normalizada na composição final, reforçando a silhueta original no objeto desfocado.

A camada distante agora estende suas próprias cores, premultiplicadas pela cobertura, através da pirâmide gaussiana. Confiança contínua entre níveis evita anéis de transição. O fundo estendido sustenta a composição da cobertura desfocada do primeiro plano, sem puxar RGB do objeto. Preserva a transmissão relativa da lente. A extensão é aproximada: não recupera geometria, detalhes ou luzes escondidas por RGB + Z.

Validação com o GLSL real: objeto de borda diagonal sobre fundo uniforme, primeiro plano a 2 m, foco a 5 m. Maior salto médio na faixa da borda passou de 0,0733 para 0,0155 em luz linear (redução de aproximadamente 79%). Render repetido estável. O teste existente confirma perda de contraste do primeiro plano e nitidez do fundo ao mudar o foco. Sem mudança no wipe.

Prévia comparativa: ../Depth-Contorno-GPU-0.8.4.png. Não se declara ray tracing não sequencial por pixel nem resolve todas as desoclusões de um mapa monocular.
