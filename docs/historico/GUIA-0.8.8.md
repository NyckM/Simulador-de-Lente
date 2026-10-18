# Optica Lab 0.8.8 — cobertura cromática do depth

Cada canal de cor agora compõe sua radiância premultiplicada com a cobertura da mesma cor. Antes, vermelho e azul eram divididos pela própria cobertura e multiplicados pela cobertura do verde, gerando contornos artificiais quando os caminhos dos três canais divergiam. A extensão conservadora do fundo também usa a cobertura por canal.

O primeiro passe desenha o fundo. As camadas seguintes usam três passes com máscara de escrita RGB e alpha correspondente; cada passe traça somente seu canal. O verde atualiza a cobertura escalar final. No modo Eclipse, os canais continuam somados diretamente com a visibilidade por raio. Não se remove a aberração cromática nem se aplica um desfoque posterior para esconder a borda.

Regressão GLSL na RTX 4090, imagem uniforme com duas profundidades e aberração cromática acentuada: salto médio máximo na borda caiu de 0,047349 para 0,000680 em luz linear (98,6%). Frames repetidos idênticos. A imagem uniforme evita confundir uma borda real do objeto com uma borda criada pela composição. Verifica também preservação dos três canais e cobertura em uma cena totalmente no primeiro plano. Artefato: ../Depth-Cobertura-Cromatica-GPU-0.8.8.png.

Limites: o atlas traça os elementos da lente, mas a imagem usa amostragem e composição aproximada de RGB+depth. Esta correção não transforma a representação em geometria 3D completa, nem recupera partes do fundo escondidas na imagem original. Mudanças abruptas no depth e divergências físicas entre canais ainda podem produzir franja óptica; a correção trata a cobertura incorreta do compositor.
