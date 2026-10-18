# 1.0.3 — Lens Flare por reflexões

Em **Inspeção óptica → Lens Flare**, ative **Aplicar ghosts calculados à imagem**. O ganho começa em 1 ao ativar. O modo automático detecta até 8 regiões de highlights e trata cada uma como fonte pontual. Limiar em luminância linear, número de fontes, raios e pares são editáveis. A fonte selecionada permite posição X/Y em percentual, seleção na imagem e busca do ponto mais brilhante.

O traçado CPU float64 calcula percursos com exatamente duas reflexões entre interfaces da prescrição atual. Refração, reflexão de Fresnel e coating escalar variam com as três linhas espectrais C/d/F. Cada passagem usa os limites dos vidros e o mesmo modelo de íris do bokeh: raio, lâminas, rotação, suavidade e máscara personalizada. Foco, sensor e edições das superfícies invalidam o resultado.

O render aguarda percursos atuais antes de compor o flare em RGB linear. Funciona na apresentação CUDA, no WebGL e no composto final de camadas. A mesma integração é usada na prévia, PNG e render quadro a quadro de vídeo; respostas antigas são descartadas. Fontes ausentes ou transparentes não produzem ghosts. Ganho zero é bypass exato. O proxy artístico de ghosts fica desligado quando Lens Flare físico está ativo, evitando duplicação desse componente.

## Limites explícitos

- A energia de cada fonte é integrada numa janela de 9 × 9 pixels do RGB principal, com alpha. Highlights clipados não recuperam radiância; limiar e ganho são ajustes atribuídos. Regiões extensas são aproximadas por uma fonte pontual.
- Seleção limitada a 8–64 pares, classificados pelo produto de Fresnel em incidência normal; não garante selecionar todos os ghosts visíveis mais intensos. Amostragem finita de 1024 ou 4096 raios por par pode apresentar ruído.
- Coating idealizado escalar, sem calibração comercial medida, polarização ou interferência. Sem reflexão no sensor ou ordens superiores.
- Esta revisão integra **reflexos internos**. Não acrescenta difração física, espalhamento volumétrico ou um solver de visibilidade de pupila por primeiro plano. A fonte visível do RGB/alpha modula a energia; os ghosts não são recortados pela silhueta final. Camadas independentes não fornecem automaticamente uma cena 3D de iluminação.
- O solver é CPU, com cache. O composto roda no WebGL inclusive quando o bokeh usa CUDA. Vídeo recalcula por quadro e pode ser lento; não há promessa de tempo real.

Mantém as correções de foco e o controle Clarear laterais das versões anteriores. Projetos antigos com configuração de ghosts continuam no modo fonte selecionada.
