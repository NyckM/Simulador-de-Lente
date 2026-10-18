# Optica Lab 0.7 · coatings, ghosts e raios de difração

Abra **Difração, reflexos e coatings** no painel da lente. Os três grupos de controles são independentes:

- **Coating AR:** cobertura de 0 a 100% e comprimento de onda de projeto de 400 a 700 nm. O traçador aplica em cada interface uma camada simples idealizada de quarto de onda, com índice do filme aproximado por `√(n₁n₂)`. A transmissão RGB do atlas e a estimativa de energia refletida mudam com o coating. Não há materiais de filme catalogados, dispersão medida, absorção, coating multicamada ou polarização completa.
- **Ghosts:** ganho visual de 0 a 40. A energia e a cor vêm do produto das refletâncias de pares de superfícies da prescrição. A posição, forma e desfoque são proxies de imagem na GPU: **os trajetos refletidos ainda não são traçados**. Use em planos com luzes fortes e teste a estabilidade em movimento.
- **Raios de difração:** ganho de 0 a 10 e escala visual de 1 a 20. O raio base vem de `1,22 λ f/D` e a orientação segue lâminas/rotação da íris. O padrão desenhado na GPU é uma aproximação filtrada, não a transformada de Fourier da pupila nem uma PSF de onda calibrada. A escala maior que 1 amplia artisticamente um efeito que normalmente seria subpixel na prévia.

Os dois efeitos de imagem funcionam na prévia e na exportação GPU PNG/MP4; a referência CPU `/api/render` não os inclui e emite um aviso. O coating afeta também o traçado CPU. Os controles começam em zero para preservar projetos anteriores. A exportação MP4 continua quadro a quadro, sem áudio, e esta versão **não garante ausência de flicker ou qualidade de produção**. O próximo salto exige traçado não sequencial de reflexões, PSF difrativa por FFT integrada ao render, modelos de coating com dados de materiais e validação temporal em vídeos reais.

## Ajuste 0.7.1 · transições do bokeh

A integração de cada célula do atlas GPU agora aumenta a área filtrada quando a aberração esférica alarga o feixe. Isso reduz as faixas concêntricas e as separações entre amostras sem introduzir ruído que mude a cada frame. Os raios de difração usam uma integral radial mais densa (64 amostras) em lugar de três anéis isolados. Como a fonte é filtrada para preencher as lacunas, regiões muito desfocadas podem ficar mais suaves; a PSF física completa continua sendo trabalho futuro. O mapa de profundidade não estava ativo no caso reportado, então essa correção é no bokeh GPU, não nas camadas de depth.
