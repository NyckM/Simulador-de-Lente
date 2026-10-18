# Foco exato no depth

O seletor de foco agora conserva a distância interpretada do pixel selecionado,
sem arredondá-la para uma fatia fixa. CPU, WebGL e CUDA redistribuem as fatias
de distância inversa para incluir exatamente o plano focado. Os extremos Near/Far
são preservados e as distâncias intermediárias continuam interpoladas.

Antes, um pixel entre duas fatias podia receber uma resposta desfocada mesmo
quando o seletor focava na fatia mais próxima. A correção elimina essa mistura
no plano escolhido sem acrescentar sharpening, mascarar o objeto ou remover
aberrações reais da prescrição. Depth Cut sem transição mantém seu contrato de
dois planos. A oclusão por pupila usa a mesma distribuição atualizada.

O cache das máscaras CUDA passa a incluir o plano de foco. A biblioteca CUDA
atualizada é obrigatória; uma biblioteca antiga é recusada e o aplicativo pode
usar seu fallback WebGL. Plugins de outros hosts não são alterados nesta revisão.

Validação: 18 casos de distribuição e reversibilidade; uma textura fina com a
Zeiss Planar teve diferença máxima zero entre depth no foco e plano único,
tanto no CUDA/RTX 4090 quanto no WebGL/Edge SwiftShader. Retornar ao foco
anterior restaurou exatamente o resultado CUDA. Esses testes verificam o
defeito das fatias, não comprovam a causa completa da captura enviada: faltam
a mídia, o mapa MoGe 3 e os parâmetros daquele caso.

Flare óptico integrado, com difração, múltiplas fontes e visibilidade compartilhada,
permanece uma frente separada descrita em [FLARE-OPTICO.md](FLARE-OPTICO.md).
Esta revisão não anuncia esse sistema como concluído.

O reset de lente também limpa pedidos de repetição de layout sem rascunho
ativo; respostas anteriores ao reset não devem manter a fila ocupada. A
regressão passa a aguardar os timers de layout antes de verificar o estado final.
