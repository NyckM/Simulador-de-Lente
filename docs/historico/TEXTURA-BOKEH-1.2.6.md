# Etapa 5 — textura interna do bokeh

Aplicativo 1.2.6. Controles em **Efeitos → Caráter criativo**:
- **Textura do bokeh · anéis**: intensidade 0–1.
- **Textura do bokeh · granulação**: intensidade 0–1.
- **Frequência da textura do bokeh**: 0,5–12; valor maior produz detalhes menores.
- **Rotação da textura do bokeh**: 0–360°, principalmente visível na granulação.

Os padrões são procedurais, determinísticos e independentes da máscara da íris,
do número de lâminas e da rotação do diafragma. Ambos em zero desativam a textura.
A textura multiplica os pesos positivos dos raios; os pesos são normalizados
para manter a energia, sem recortar novos buracos no disco nem mudar trajetórias.
A obstrução da lente e as oclusões por profundidade continuam aplicadas.

Esta é uma distribuição editorial de luz, não uma medição de defeitos de uma
lente comercial. Não importa imagens de textura nesta versão. Frequências altas
exigem mais amostras: use qualidade alta para mostrar os detalhes. A aparência
CPU e GPU não é idêntica: o atlas GPU resume as células da pupila e seu campo.

Os quatro controles podem ter keyframes na imagem principal e nas layers A/B/C
em modo imagem, usando os parâmetros `optics.bokeh_texture_*` das layers. JSON
de parâmetros e projetos armazena os valores; não há dependência de assets externos.
Alterar a textura não retraceia a lente. A íris importada continua sendo só a
máscara de abertura. Flares/difração escalar e os passes auxiliares de vidro/drops
mantêm seus caminhos próprios; o padrão não é gravado como textura de coating.

CPU: `optics/bokeh_texture.py` e `Lens.spots` em `optics/core.py`.
WebGL: pesos da composição principal em `web/gpu.js`.
CUDA: pesos do gather em `native/cuda/engine.cu`.

CUDA usa exports v3 com Config de 372 bytes. Adapters v1 (344 bytes) e v2
(356 bytes) desativam a textura e preservam os campos anteriores. Isso permite
manter chamadas antigas sem ler além do buffer. Testados v1/v2, foco v2 e half v2.
Não substitua DLLs de plugins com esquemas próprios sem validar sua integração.

Testes: `tests/test_bokeh_texture.py` e `tests/test_bokeh_texture_browser.cjs`.
Resultados em `research/texture-stage5`. Blender permanece 0.3.2.

