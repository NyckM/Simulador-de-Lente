# Revisão 1.2.10 (2026-10-17)

Base: versão 1.2.9 deixada pelo outro chat às 21:29 (backup em work/backup-versao-outro-chat-2129). Mantidos: desfoque de borda do vidro, cache de estado WebGL, salvamento com debounce, revisão de CSS e o visor 3D.

## Visor 3D do vidro (web/filter-stack.js)
- Corrigido: eixo óptico era desenhado com o shader errado ("location is not from the associated program").
- Novo pipeline: cena opaca em textura, vidro refratando a cena atrás (lente, grade) com dispersão RGB, fosco desfocando o fundo, realces especulares, franjas de cor só nas bordas rasantes, fundo de estúdio, supersample.

## Desempenho
- gpu.js: MAX_TEXTURE_SIZE / MAX_VIEWPORT_DIMS eram consultados 8× por quadro; cada consulta esperava a GPU terminar. Agora lidos uma vez.
- app.js: arrastar qualquer controle da lente no painel (íris etc.) pedia o atlas completo a cada passo (1–9 s). Agora usa o atlas interativo (~0,13 s) durante o arrasto e refina ao soltar.
- Medido: por mudança de controle, 4 draw calls, sem uploads de textura e sem consultas síncronas.

## Layout (desktop-ui.js)
- Nova aba Depth: os controles de profundidade saíram de Foco (3.400 px → 690 px).

Validação: app real em Chromium headless; os 22 tipos de filtro adicionados, as 8 abas, arrasto no visor; 0 erros/avisos. Paridade GPU×CPU dos prismas mantida (erro médio ≤ 0,0006).
Backups: work/backup-dist-antes-1.2.10 (cópia do .exe), work/backup-versao-outro-chat-2129 (fonte).

# 1.2.11 (2026-10-17, noite)
- Black Mist / Halation / Streak / Star: difusão contínua (fonte selecionada em mipmap, textura com múltiplo de 256), sem cópias pontuais; espalha só a luz acima do limiar (sem buraco escuro no centro). CPU: convolução FFT com o mesmo núcleo.
- Lens Dirt: textura real gerada no navegador (gpu.js, LensDirtTexture) por seed — digitais com cristas/óleo, poeira e fiapos, riscos e marcas de limpeza, fungos ramificados. Desfoque acompanha a abertura (iris_mm × "Desfoque da sujeira"); aparece onde a luz das altas atinge. Novos controles: Marcas de dedo, Poeira, Riscos, Fungos, Desfoque da sujeira. CPU (optics/dirt_texture.py) usa gerador equivalente, não idêntico pixel a pixel.
- Lens Flare: agora na aba Efeitos. Ghosts renderizados como manchas gaussianas com tamanho pela vizinhança na pupila (contínuos, com cáusticas), em vez de 1 pixel por raio. Novo "Intensidade das fontes · EV" (padrão +8 EV) para recuperar luz recortada em imagens LDR.
- Limitação: no .exe o Python está compilado; o caminho CPU de referência só reflete estas mudanças rodando pelo código-fonte (Iniciar.cmd).

# 1.2.12 – 1.2.13 (2026-10-18)
- Lens Flare escurecia o fundo com Lens Dirt ligado: a pirâmide gaussiana do Lens Dirt reutilizava a unidade de textura 7, onde o flare guarda a imagem. buildGaussianPyramid agora restaura a unidade 7.
- Menus: margem interna uniforme de 12 px nos acordeões; barras de rolagem finas no tema.
- Painéis modulares: arrastar abas ou o ⠿ para esquerda/direita/em cima/embaixo, juntar painéis ou criar janela flutuante (⧉); bordas internas redimensionam; layout salvo; "Restaurar layout dos painéis" em Projeto.

# 1.2.14 – 1.2.17 (2026-10-18)
- Starburst físico (|FFT(íris)|² espectral), só em fontes em foco (círculo de confusão pelo depth). Em Efeitos → Lens Flare.
- Recuperar luzes recortadas · EV (padrão 3): só pixels perto do branco em imagens LDR; GPU e CUDA.
- Depth: legenda do mapa mostrava faixa errada (0,8–10 m) na demo (real 2–5 m); vista Profundidade com o mesmo enquadramento da imagem.
- Filtros: amostras fora do quadro espelhadas 6 px para dentro (fim da linha escura no Kaleidoscope e faixa no prisma); espectro do prisma contínuo (13 λ pré-filtradas).
- Menu superior Arquivo/Editar/Efeitos/Exibir/Janela/Ajuda; abas como faixa; Inspeção óptica virou painel modular (Janela → Inspeção óptica, abre à direita).
