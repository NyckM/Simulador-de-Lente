# Versão 0.3.3

Textura do bokeh com keyframes na câmera OSL. Leia [o guia](UPDATE-0.3.3.md).

# Versão 0.3.2

Preservação editorial do detalhe no plano focal, com keyframes. Leia [o guia](UPDATE-0.3.2.md).

# Versão 0.3.1

Presets de caráter e foco por ponto/alvo animado. Leia [o guia da atualização](UPDATE-0.3.1.md).

# Versão 0.3.0

Lente em mm, abertura em f-stop, sete tipos de bokeh, swirl e 15 filtros no compositor. Leia [o guia atualizado](UPDATE-0.3.0.md).

# Bruxos Physical Lens — Blender 0.2.0 beta

Correção 0.1.3: a câmera deixa de ativar OSL global nos materiais. Inclui recuperação para cenas antigas. [Uso, reprodução e limites](RECOVERY-0.1.3.md).

A edição 0.1.1 adicionou **Bokeh espectral · arco-íris** à câmera óptica do Blender. Com dispersão ativa, o shader amostra 12 comprimentos de onda entre 420 e 700 nm e refrata cada banda pelas mesmas superfícies da lente. A resposta RGB sobreposta permite transições de cor além das três franjas RGB da edição anterior.

## Instalação e uso

1. No Blender 4.5+, abra Edit > Preferences > Get Extensions > menu > Install from Disk e selecione **Bruxos-Physical-Lens-0.3.2-Blender-Addon.zip**. Atualize a edição anterior e ative a extensão.
2. Use Cycles com CPU ou OptiX. Abra o painel Bruxos na sidebar da Viewport.
3. Ative **Bokeh espectral · arco-íris** e aumente **Dispersão**. Dispersão zero mantém o traçado monocromático anterior.
4. Ajuste o foco, a abertura e o Abbe de cada vidro. Abbe menor aumenta a separação das cores; a forma e o sentido da borda dependem da prescrição, do campo e de qual lado do foco está a luz.
5. Desative Bokeh espectral para comparar com o modo de três bandas RGB. Não é necessário recompilar para alternar: o controle atualiza um parâmetro OSL.

A interface inclui Português, English e 简体中文. As superfícies esféricas, os vidros para inspeção, a importação de prescrição JSON e os caminhos Gaussian Splatting da versão 0.1.0 são mantidos. Splats nativos requerem uma versão do Blender com GAUSSIAN_SPLAT (testado anteriormente na 5.3 alpha); proxies volumétricos funcionam no Cycles 4.5. Addons de splats com render externo não recebem automaticamente os raios OSL.

## Cena de exemplo

**Bruxos-Rainbow-Bokeh.blend** contém luzes brancas e um exemplo criativo de vidro com Abbe 12 e deslocamento de 2 mm na primeira superfície. Esses valores deliberadamente acentuam a dispersão e a assimetria, sem alterar a prescrição padrão do addon. Não representam uma lente comercial medida. CPU/OptiX, foco 0,8 m, luzes a 4 m, íris 8,5 mm, dispersão 1 e abertura circular.

As imagens neutral.png, rgb.png e rainbow.png são a comparação de três modos na prescrição padrão; rainbow-arc.png é o exemplo acentuado. Quanto menor a fonte de luz e maior a dispersão, mais amostras podem ser necessárias para reduzir o ruído. A cena de exemplo usa 32.768 amostras sem denoising, para preservar as bordas coloridas.

## Limites e validação

São 12 bandas discretas e uma resposta RGB aproximada, normalizada para preservar a exposição de branco quando as bandas têm transmissão igual. Materiais e luzes continuam RGB: não há reconstrução de espectros, resposta de sensor medida ou render espectral completo. O modelo do vidro é Cauchy ajustado a nd/Abbe. A prescrição original não fornece Abbe; o valor padrão 55 continua sendo hipótese editável. A forma específica de um arco não é garantida para toda lente, foco ou luz colorida.

O shader segue refração primária, transmissão Fresnel e, na 0.2.0, caminhos de exatamente duas reflexões internas com coating idealizado de película única. Não inclui reflexão no sensor, ordens superiores, scattering nem difração de onda. Os meshes de vidro são para inspeção e ficam ocultos no render, pois a câmera traça as mesmas superfícies analiticamente.

Nesta versão foram verificados registro, compilação OSL, render real dos três modos, normalização dos pesos RGB e bordas coloridas no Blender 4.5.14 / OptiX / RTX 4090. Um teste CPU de menor resolução também compilou e renderizou as 12 bandas. O relatório spectral-validation.json registra o teste final. A integração com splats já foi verificada na 0.1.0; não foi repetida nesta edição.

- [Câmera Custom OSL — Blender](https://docs.blender.org/manual/en/4.5/render/cycles/osl/camera.html).
- [Gaussian Splats — Blender 5.3](https://developer.blender.org/docs/release_notes/5.3/rendering/).

Código GPL-3.0-or-later; prescrição de referência LensSim com atribuição MIT em bruxos_physical_lens/data/LICENSE-LensSim.txt. Esta atualização é do addon Blender; o app, os plugins de composição e o Unreal não são alterados pelo ZIP.

## Lens Flare e coatings — 0.2.0

Ative **Lens Flare · reflexos internos** e ajuste ganho, força do coating e comprimento de onda. A câmera amostra a transmissão primária e pares de reflexão pelas superfícies da prescrição; os caminhos atravessam o mesmo diafragma do bokeh, com a mesma rotação e lâminas. Os reflexos vêem a cena pelos raios da câmera, incluindo oclusões reais da cena. Coatings são um modelo AR idealizado, não dados medidos de fabricante.

O flare usa amostragem por hash dos samples contínuos da câmera e pode exigir muito mais samples para reduzir ruído, sobretudo com muitas superfícies. Ganho 0 mantém o caminho primário. A energia é importância ponderada, sem normalizar cada ghost para brilho constante. CPU e OptiX foram testados em Blender 4.5.14 com uma placa óptica: ganho zero, aumento de energia de reflexos e redução por coatings. Também passou a regressão da câmera com material nativo de 203 nós. Não foi repetida a validação de splats nesta edição.

Na 0.3.0, os 15 filtros são aproximações pelo compositor nativo, separadas da câmera OSL. O clareamento lateral é um ajuste artístico em EV. O addon não gera MoGe3. A correção de não forçar OSL global dos materiais está preservada; o limite OSL de grupo OptiX continua existindo.

Propriedades da câmera podem receber keyframes pelo Blender e são atualizadas pelo handler de frame. Isso é animação do host; a timeline por layers do aplicativo é um recurso separado.
