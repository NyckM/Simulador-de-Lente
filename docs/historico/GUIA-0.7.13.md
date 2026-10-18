# Optica Lab 0.7.13 — biblioteca de lentes

O seletor inclui ZEISS Planar T* 2/50 ZM e Helios-44-2 58 mm f/2.
A troca altera o modelo óptico, a focal calculada, o tamanho físico dos vidros,
a abertura máxima, o diafragma e os parâmetros de aparência. Edições do vidro são
aplicadas ao modelo escolhido; caches de modelos diferentes ficam separados.
A troca limpa as edições anteriores dos vidros. Foco, fonte e mapa de profundidade
são mantidos. Projetos no formato v05 guardam o modelo, suas edições e a qualidade.

## Origem e fidelidade

São perfis aproximados de modelos comerciais reais. A geometria deriva da
prescrição Double-Gauss licenciada do LensSim, escalada para 50 ou 58 mm, com a
abertura máxima ajustada para f/2. Não são prescrições de fabricação ZEISS/KMZ.
Não se ajustou o motor às curvas MTF nem a medições de PSF de exemplares reais.

- ZEISS: focal 50 mm, f/2–f/22, foco mínimo 0,7 m e construção 6/4 constam na documentação da ZEISS/Cosina. O perfil usa 10 lâminas e coating aproximado, sem comprovação específica desses coeficientes; não reproduz o coating T* proprietário.
- Helios: focal nominal 58 mm e f/2–f/16 constam no manual ZENIT-E. O perfil usa 8 lâminas, swirl, esférica e coating de caráter vintage. Esses coeficientes são escolhas criativas, não dados medidos.
- Os controles do app permitem ultrapassar os intervalos nominais de foco/fechamento para experimentação; o limite de abertura máxima respeita o modelo.

Fontes acessíveis também sob o seletor:
- https://www.cosina.co.jp/zeiss/zm/planar-t2-50-zm/
- https://www.zeiss.com/content/dam/pno/downloads/photo-lenses/datasheets/zm-lenses/datasheet-zeiss-zm-planar-250-en.pdf
- https://www.zenitcamera.com/mans/zenit-e/zenit-e-eng.html
- https://www.zenitcamera.com/archive/lenses/helios-44.html

Os estudos Petzval e anamórfico continuam separados da biblioteca identificada.
O perfil genérico preserva a prescrição de referência anterior.

Use Ctrl+F5 no app local para carregar a biblioteca.
