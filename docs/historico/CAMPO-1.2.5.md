# Etapa 4 — bokeh por campo e compensação da luz

Aplicativo 1.2.5. O traçado da lente continua calculando obstrução, transmissão
e forma do bokeh nos pontos do atlas. A composição principal CUDA/WebGL agora
interpola a posição e a direção de cada célula ponderando sua energia da pupila.
Células sem raios não puxam os raios válidos para posições ou direções arbitrárias.
A energia e a transmissão continuam separadas dos momentos geométricos.

Em **Foco → Diafragma e formato**, ajuste:
- **Clarear laterais · compensação óptica %**: zero mantém a luz original.
- **Limite do clareamento · EV**: de 0 a 6; padrão 3. Define o teto do ganho.

A correção é acromática, baseada na transmissão relativa ao centro, e pode
ser animada na imagem principal. Uma transição contínua reduz o ganho junto
a campos efetivamente bloqueados. Não abre a pupila, não aumenta o disco de
bokeh e permanece separada da vinheta criativa. Limite 0 também é bypass.
O CUDA usa o mesmo apresentador WebGL para a compensação e o limite; o frame
nativo é reutilizado ao alterar apenas estes controles. A referência CPU usa
a mesma curva de ganho. O ABI CUDA v2 continua com 356 bytes.

A comparação óptica em `research/field-stage4/bokeh-centro-borda.png` usa a
prescrição Double-Gauss 50 mm: a relação dos eixos cresce de 1,00 no centro
para 1,97 no campo (17,10) mm e a transmissão cai de 0,439 para 0,135. O
clareamento não modifica essas PSFs. Esses valores são desta prescrição e
configuração; não representam medições comerciais ZEISS.

O atlas ainda é uma aproximação finita. A nova interpolação cobre o bokeh da
composição principal; passes auxiliares de vidro/drops/glitter e reflexos têm
seus próprios caminhos. O fundo estimado da etapa 3 e o foco da etapa 2 permanecem.
Blender continua 0.3.2; esta entrega atualiza o aplicativo de imagens.

Testes: `tests/test_field_stage4.py`, `tests/test_field_stage4_psf.py` e relatórios
em `research/field-stage4`. Não há novas texturas internas do disco nesta etapa.
