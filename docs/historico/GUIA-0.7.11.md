# Optica Lab 0.7.11 — abertura e bokeh

Fechar o diafragma agora altera o tamanho do bokeh já durante o movimento do controle.
Enquanto o atlas recalcula, uma escala paraxial provisória usa a razão entre a abertura
atual e a abertura do atlas. O resultado definitivo volta aos raios traçados pela nova íris.
Essa resposta provisória não reproduz exatamente mudanças de clipping ou cat-eye.

O atlas informa sua abertura em milímetros. A aberração esférica adicional passa a
acompanhar o raio da pupila: termos cúbico e quíntico diminuem ao fechar a abertura.
Isso evita um desfoque artificial de tamanho fixo quando a lente é fechada.
A difração mantém seu comportamento próprio: seu tamanho cresce ao fechar a abertura.
A exposição continua preservada, conforme o comportamento anterior do app.

Validação do shader real na RTX 4090, com foco a 0,6 m e ponto luminoso a 5 m:
- f/2,03: raio RMS de 23,53 px.
- f/4,06: 12,13 px.
- f/8,12: 6,06 px.
- Resposta provisória em f/8,12, ainda usando atlas aberto: 6,11 px.

A validação é sintética e não mede reprodução de vídeo no navegador.
Use Ctrl+F5 para carregar os scripts da versão atualizada.
