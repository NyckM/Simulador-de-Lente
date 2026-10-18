# Blender 0.4.0 (alinhado ao app 1.2.17)

Novos no compositor (grupo "Bruxos · Artistic Filters", inserido antes da saída Composite, sem editar seus nós):

- **Starburst · difração da íris** (painel Lens Flare / Coating): intensidade, tamanho e raios finos. Lâminas pares dão N raios, ímpares 2N, íris circular dá brilho suave. Fechar o diafragma (f-stop maior) aumenta o efeito. A rotação da íris gira os raios.
- **Lens Dirt** (painel próprio): textura real procedural do app (marcas de dedo, poeira, riscos, fungos), com peso por camada, variação por semente, desfoque proporcional à íris e limiar das altas luzes. A sujeira só aparece onde há luz forte.
- **Prisma com 8 tipos** (Cromático, Triangular, Cunha, Facetado, Replicação linear, Caleidoscópio, Split, Anel radial) e desfoque da borda do vidro.
- **Kaleidoscope** refeito com remapeamento exato por pixel (Map UV): setores espelhados sem emendas escuras nem sobreposições claras.
- **Limiar de luz** ajustável em Black Mist, Halation, Streak e Estrelas.

Mantidos: câmera OSL, presets, foco, bokeh, textura do bokeh, flare por reflexões internas e animação. Projetos 0.3.x abrem com os novos controles neutros (0).

Testado com Blender 4.5.3 (módulo bpy, Cycles CPU): cada efeito renderizado isoladamente. Eevee não roda a câmera OSL; os efeitos do compositor funcionam com qualquer motor.
