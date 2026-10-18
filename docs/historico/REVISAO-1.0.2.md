# 1.0.2 — Clarear laterais

Em **Diafragma e formato**, o campo e slider **Clarear laterais · compensação óptica %** compensam a queda de iluminação óptica. Comece em 25–50% e aumente conforme a imagem. 0% preserva exatamente a saída anterior; 100% aplica a compensação disponível, limitada a +3 EV.

O ganho é aplicado em RGB linear antes da conversão de saída, na prévia e exportação. Usa a transmissão verde relativa ao centro do atlas de raios e aplica o mesmo ganho aos três canais. Não modifica os raios, a pupila, o recorte cat's-eye, a distância de foco ou o tamanho do desfoque. A vinheta criativa continua independente.

É uma compensação baseada na transmissão calculada na distância de referência e na malha espacial do atlas, não uma calibração fotométrica medida para cada profundidade. Áreas sem raios transmitidos não são recuperadas. Altas luzes podem atingir o limite da saída PNG de 8 bits ao aumentar o ganho.

Projetos anteriores abrem com o novo controle em 0%. O valor é salvo nos parâmetros e perfis. No CUDA, mudar apenas esse controle reutiliza o quadro calculado, sem recalcular o bokeh.

Validação: referência CPU (zero exato, centro preservado, ganho monotônico e limite 8×); WebGL (interpolação e orientação de mapa assimétrico, atualização ao trocar atlas, cobertura e mistura zero); CUDA real (reuso de quadro, alteração visível, retorno exato ao zero e atlas preservado). A comparação WebGL com a fórmula linear ficou dentro de 2 níveis de 8 bits, incluindo quantização e dither.

Mantém a correção de foco da 1.0.1. Esta revisão não acrescenta o sistema integrado de flare óptico.
