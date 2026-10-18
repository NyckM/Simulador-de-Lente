# Viewer com zoom — 0.7.2

- Arraste o controle de zoom acima da imagem, use os botões `−`/`+` ou a roda do mouse sobre a imagem. A roda aproxima em torno do cursor; o limite é 800%.
- Com zoom ativo, arraste a imagem para navegar. Entrada e resultado se movem juntos.
- Arraste o divisor vertical para comparar. `Shift` + arraste em qualquer ponto também move o divisor. Sem zoom, arrastar a imagem move o divisor como antes.
- Clique no valor percentual ou dê duplo clique na imagem para voltar a 100%.
- A prévia de uma imagem ou vídeo pausado tenta renderizar mais pixels quando o zoom ultrapassa a resolução de prévia escolhida, até o menor limite entre a resolução original e 3840 px no lado maior. Isso não recupera detalhe ausente na fonte. A reprodução de vídeo mantém a qualidade de prévia selecionada para preservar a fluidez.
- Zoom e pan afetam apenas a inspeção no viewer. A exportação usa o quadro completo e a resolução de exportação selecionada.
