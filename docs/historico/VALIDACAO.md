# Validação da versão 0.2

Executada em 21/09/2026. **20 testes passaram**: os 16 anteriores e quatro testes do atlas/plano paraxial. Verificam plano de foco contra ray tracing, translação do sensor contra interseções diretas, energia/positividade/determinismo do atlas, cache independente do foco e entradas inválidas. Não constituem calibração contra uma lente real.

UI WebGL2: shaders compilados, ausência de erros/warnings observados, demo orientado corretamente, ajuste de bokeh aplicado sem botão e controles sincronizados. A compressão inicial produzia amostras isoladas; células de pupila coerentes e pré-filtro linear melhoraram a cobertura. Ainda não foi estabelecido limite quantitativo do erro da PSF GPU contra CPU.

Vídeo: clipe sintético H.264 768×480, 24 fps, 8 segundos. Importação, reprodução e gravação WebM concluíram. Indicador observado: aproximadamente 24 fps. Arquivo VP9 exportado de 1.652.824 bytes, 768×480, 193 frames decodificados pelo ffprobe (captura inicial incluída). MediaRecorder gerou taxa variável, sem duração de container reportada; não é render offline com contagem/FPS garantidos. O campo r_frame_rate nominal do container não mede throughput real.

O tempo GPU informado mede apenas a convolução; exclui decode, upload e pré-filtro. Não houve benchmark 4K, múltiplas GPUs ou vídeos longos. Depth GPU usa 8 bits pelo navegador; o teste de preservação 16-bit abaixo pertence exclusivamente ao caminho CPU.

## Histórico: versão 0.1

Executada em 21/09/2026, Windows, Python 3.13, NumPy 2.5.3, SciPy 1.18.1, Pillow 12.3.0.

**16 testes passaram**, executados com `python -m unittest discover -s tests -v`.

- Lei de Snell vetorial comparada com a forma escalar; reflexão interna total rejeitada.
- Distância focal efetiva comparada com uma implementação independente de matrizes ABCD.
- Spot menor no foco; abertura menor reduz spot em plano desfocado.
- Normalização e positividade das PSFs no centro e fora do eixo.
- Referência acromática e alteração pelo proxy de dispersão.
- Linearidade, imagem preta, determinismo e round-trip sRGB.
- Depth constante equivalente ao plano único; rejeição de mapas com dimensões erradas.
- Preservação de depth PNG 16 bits e proporção no redimensionamento.
- Render via HTTP de imagem + depth; PNG de saída válido e com dimensão esperada.
- Rejeição de origem HTTP externa.

Também passaram a verificação de sintaxe JavaScript (`node --check web/app.js`) e a compilação Python (`compileall`).

Na interface, foram verificados carregamento da cena de teste, render concluído, imagem antes/depois, sincronização de campo numérico e slider, diagrama de raios e PSFs. Uma imagem importada também foi observada renderizada com sucesso, com os modificadores criativos e os avisos correspondentes. Os ajustes em uso foram preservados.

Observações de desempenho, sem garantia de benchmark: prévia do demo 768×480 em cerca de 3,38 s e render observado de imagem importada 640×640 em 1,88 s. Incluem custos do adaptador de imagem e variam com parâmetros, hardware e carga.

O modo final também foi executado diretamente no núcleo: demo 1600×1000, grade 5×3, 8192 amostras-base por PSF, aproximadamente 10,43 s, saída com todos os valores finitos e sem avisos. Esse tempo não inclui codificação PNG nem criação do demo e não é comparável diretamente aos tempos HTTP acima.

Esses testes verificam consistência e funcionamento, não equivalência a uma lente comercial medida. Não houve validação em Zemax/CODE V, nem testes de plugins, GPU, vídeo, EXR, OCIO ou difração, que ainda não estão implementados.

## Correção de antialiasing (0.2, revisão AA)

Filtro de minificação agora inclui derivadas das coordenadas após deformação. Mistura com a entrada usa uma pirâmide linear própria, sem realce de highlights. O modo Detalhada renderiza em 2× por eixo e resolve quatro subpixels em luz linear antes de codificar sRGB (mais custo de GPU).

Teste WebGL de diagonais de período 3, redução 2048×1024 para 512×256, bypass da lente: desvio-padrão espacial caiu de 29,698 para 6,128 (~79%); média mudou de 85 para 156,333, próxima da referência linear sRGB para 1/3 de luz. Isso mede esse padrão sintético, não melhora universal de 79% em qualquer vídeo. Teste com lente ativa, esférica/swirl/coma e troca 512→1280→512 também passou: sem erros GL, saída não preta e resultado repetível ao retornar à qualidade anterior. O vídeo original do recorte do usuário não estava disponível para comparação quantitativa.

Na UI, também foi corrigido um bloqueio por distâncias near/far inválidas quando depth está desativado: o atlas óptico e seus diagnósticos não dependem desses limites. Verificado com parâmetros salvos, saída visível e sem erros WebGL observados.
