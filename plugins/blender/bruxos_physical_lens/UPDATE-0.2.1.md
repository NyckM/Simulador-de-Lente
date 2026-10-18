# Bruxos Physical Lens 0.2.1 — painel simplificado

Instale o ZIP em Edit > Preferences > Add-ons > Install from Disk. Atualize a versão anterior pelo novo ZIP e reinicie o Blender. A câmera óptica requer Blender 4.5+ e Cycles CPU ou OptiX.

1. Selecione a câmera no painel Bruxos.
2. Escolha um dos 12 presets e clique **Aplicar preset**. Isso carrega a prescrição e cria/atualiza a câmera; trocar apenas a seleção não sobrescreve a lente atual.
3. Ajuste foco em metros, raio da íris em mm e exposição.
4. Use **Leve** para trabalhar: mantém o bokeh óptico e desliga o flare só na prévia. O render final usa o flare habilitado no módulo, incluindo render por CPU e OptiX. Use **Completa** para inspecionar o flare na viewport.

**Bokeh**: lâminas, rotação, dispersão e resposta espectral.
**Lens Flare / Coating**: habilitação, ganho e coating idealizado.
**Avançado**: sensor, importação JSON, recuperação da câmera e opções de materiais. **Superfícies** e **Gaussian Splats** ficam recolhidos aqui.
**Gerar vidros 3D** cria apenas as malhas de inspeção, ocultas no render. Elas não são necessárias para a câmera funcionar e não são criadas automaticamente.

Atualização automática espera uma pausa de ~0,45 s no ajuste. Desligue-a para aplicar manualmente pelo botão. O foco e o shader são armazenados em cache; exposição, coating, rotação e ganho não recalculam o foco. Animar foco/íris continua exigindo atualização do cálculo óptico. O modo leve não reduz amostras da cena nem altera configurações de render do usuário. Flare completo continua podendo exigir muitas amostras.

Presets: Double-Gauss, ZEISS Planar 50, Helios 58, Tessar 50, Biotar 50, Sonnar 50, Canon 1956 50, Kino-Plasmat 100, Orestor 135, Heliar 100, Nakamura 22 e Sigler 250. São modelos aproximados, não calibrações de exemplares comerciais. ZEISS e Helios usam uma base Double-Gauss escalada; o swirl artístico do aplicativo não é portado por esse preset. Os demais usam as tabelas disponíveis no projeto, normalizadas para a distância focal nominal.

Validação: 12 presets, cache sem recompilação em parâmetros de execução, malhas opcionais e restauração da câmera no Blender 4.5.14 LTS. Render final Leve/Completa comparado em CPU e OptiX (64×48, 16 amostras). Essa cena pequena verifica a preservação do resultado; não mede desempenho em projetos complexos.
