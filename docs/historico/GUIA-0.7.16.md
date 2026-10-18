# Optica Lab 0.7.16 — Deakinizer

Novo preset em Referência e estudos: Deakinizer · centro limpo / bordas alongadas. Ele combina Swirl 1,7 e Coma 0,65 no renderer de bokeh, com íris circular. Não usa textura ou overlay. Esféricas adicionais, difusão e dispersão ficam zeradas para preservar o centro. O alongamento depende da posição no quadro; a orientação acompanha a direção tangencial do campo.

Use uma imagem com pontos de luz fora de foco. Ajuste Swirl tangencial, Coma adicional e distância de foco. Fechar a íris reduz o bokeh. Reset do perfil restaura o preset; Salvar como permite criar variações próprias. O preset preserva a distância de foco e o modo de depth atuais ao ser selecionado.

É uma aproximação criativa sobre a Double-Gauss pública, não uma prescrição ou calibração da lente reconstruída para Roger Deakins. Os modificadores atuais atuam sobre os offsets dos raios do atlas; não são novos vidros traçados nem erros ópticos medidos. A prévia e a exportação GPU usam os mesmos controles. Os limites de profundidade da versão 0.7.15 continuam aplicáveis.

Referência visual: https://higx.net/optics/index.html
