# Revisão de realismo — 1.2.11 a 1.2.15 (2026-10-18)

## Corrigido (era fisicamente errado)
| Item | Antes | Agora |
|---|---|---|
| Borda de prismas/split/janela | linha reta nítida | borda desfocada pela abertura (vidro fora de foco) |
| Black Mist / Halation / Streak / Star | 24 cópias pontuais da luz (pontinhos); buraco escuro no centro | difusão contínua; espalha só a luz acima do limiar |
| Lens Dirt | ruído de pontos | digitais, poeira, riscos, fungos; desfoque da sujeira acompanha o diafragma; só aparece onde a luz atinge |
| Lens Flare (ghosts) | 1 pixel por raio (chuvisco) | manchas com tamanho pela vizinhança na pupila: ghosts contínuos com cáusticas |
| Flare + Lens Dirt | apagava a imagem | somado corretamente |
| Starburst | 8 riscos fixos, sem relação com a íris | |FFT(íris)|² espectral: lâminas pares N raios, ímpares 2N, redonda = anéis; cresce ao fechar; só em fontes em foco (círculo de confusão pela lente e depth) |
| Altas luzes recortadas (JPG/PNG) | bokeh de lâmpadas apagado; "Realce" aumentava também paredes e céu | "Recuperar luzes recortadas · EV" (padrão 3 EV): só pixels perto do branco; em foco continua branco, fora de foco o bokeh ganha o brilho real |

## Já era físico (mantido)
- Bokeh por atlas de raios traçados na prescrição real (vidros, curvaturas, íris com lâminas/máscara, vinheta mecânica, cat-eye).
- Ghosts: duas reflexões entre superfícies, Fresnel/coating, mesma íris do bokeh, distância da fonte pelo depth.
- Foco e profundidade de campo pelo depth (oclusão por camadas).

## Aproximações que continuam (documentadas)
- Dispersão cromática: as prescrições não trazem Abbe/vidro; a dispersão é um proxy de Cauchy ajustável.
- Starburst: forma e cor físicas, mas o tamanho é artístico (a escala física real fica abaixo de 1 px; a cauda visível depende do brilho da fonte).
- Flare/starburst em imagens LDR dependem de "Intensidade das fontes · EV" para recuperar a energia recortada.
- Caminho CPU de referência (Python) no .exe é o compilado anterior; pelo Iniciar.cmd está atualizado, exceto a recuperação de altas luzes (só GPU/CUDA).
