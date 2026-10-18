# Depth IA — MoGe 3 e Marigold V2 (0.9.18)

Na aba Foco/Depth, selecione MoGe 3 ou Marigold V2. Agora há instalação de ambiente separado, escolha de pasta, download/verificação dos pesos, progresso, cancelamento e diagnóstico. Os modelos não estão dentro do EXE. A instalação automática desta versão atende Windows x64 com GPU NVIDIA/CUDA. Ambientes compatíveis existentes continuam configuráveis manualmente.

## Como usar

1. Escolha uma pasta para os modelos. Reserve 55 GB para instalar Marigold V2 e seus pesos. MoGe 3 também instala PyTorch CUDA em ambiente próprio: reserve pelo menos 10 GB para o ambiente, além dos pesos.
2. Clique **Instalar ambiente separado**. O complemento DA2/DA3/MoGe2/DVD permanece em seu próprio ambiente. Código dos modelos e SDK Python usam versões e hashes fixados; PyTorch CUDA é fixado por modelo, evitando troca acidental por um build CPU.
3. Clique **Baixar/verificar pesos**. Os downloads completos são reutilizados. Downloads interrompidos podem ser retomados. Hashes dos pesos são conferidos, inclusive ao reutilizar arquivos.
4. Clique **Gerar depth** em uma imagem. Somente uma inferência concluída neste ambiente ativa o selo de validação. Verificar imports/CUDA, sozinho, não ativa esse selo.

Para um ambiente existente, expanda **Configurar ambiente do modelo selecionado** e indique seu Python. Para Marigold, indique também o repositório e, se os pesos estiverem em outro disco, a pasta de assets contendo `checkpoints/`. Cache Hugging Face é opcional. Alterações no ambiente invalidam a evidência anterior quando sua identidade muda.

## Faixa previsível — 0.9.16

O painel **Interpretação e inspeção do depth** mostra a distribuição, valores inválidos e percentis. Digite Near/Far com ponto ou vírgula e clique **Aplicar faixa Near / Far**. Near aceita 0,3–100 m; Far aceita 0,4–1000 m. A faixa é salva no projeto. Ela não muda sozinha a cada frame ou ao importar outro mapa.

- **Metros:** **Usar distâncias do mapa** escolhe Min/Max ou a faixa robusta de 1%/99%, após Gain/Bias. O painel mostra as distâncias antes do recorte e quantos pixels ficam abaixo de Near ou acima de Far. Esses pixels continuam válidos e usam os limites; pixels NaN, infinitos, não positivos ou transformados em distância não positiva usam Far. Mapa constante, sem dados válidos ou fora dos limites do app não produz uma faixa automática.
- **Relativo:** **Normalizar e fixar 1% / 99%** fixa os limites numéricos do mapa atual, mantendo Near/Far e a direção selecionada. Isso ajuda a evitar os extremos de preto/branco, sem inventar calibração em metros. Para vídeo, esses limites ficam fixos nos próximos frames.
- **Validade:** branco indica dado válido; magenta indica inválido. O cursor mostra a distância interpretada e o plano discretizado usado pelo compositor. Não confunda essas duas distâncias: slicing e Depth Cut ainda usam planos distintos. Pixels inválidos não servem como máscara de alpha.

Os percentis são estimados por amostragem determinística de até aproximadamente 65 mil posições; Min/Max e contagens percorrem o mapa inteiro. Uma máscara esparsa tem fallback quando o passo de amostragem não encontra valores válidos. No JSON de inspeção, `range_analysis` registra a faixa e os recortes; as unidades de origem continuam explícitas.

## MoGe 3

Modelo oficial: https://github.com/microsoft/MoGe — `Ruicheng/moge-3-vitl`.

O render recebe Z float32 em metros estimados, não o PNG normalizado. O app muda a interpretação para metros e redefine gain/bias para 1/0. Near/Far continuam sendo a faixa de trabalho do simulador. Pixels inválidos usam o plano distante, sem tornar a imagem transparente.

**Baixar geometria do frame** exporta NPZ com depth, máscara, pontos, normais e intrínsecos quando presentes. Coordenadas OpenCV: X direita, Y baixo, Z frente; intrínsecos normalizados. O render principal utiliza Z. A visualização 3D está disponível desde a 0.9.17, com render experimental pela geometria na 0.9.18.

## Geometria 3D — 0.9.17

Após gerar depth com MoGe 3, clique **Ver geometria 3D do frame**. A vista abre o frame atual e pausa a reprodução do vídeo. Arraste para girar, Shift + arraste para mover, roda para zoom, **Enquadrar** para restaurar. **Vista da câmera** projeta os pontos usando os intrínsecos normalizados do próprio modelo, com pixel centers `(x + 0,5)/largura`, `(y + 0,5)/altura`. O formato mantém OpenCV: X direita, Y baixo, Z frente. As distâncias são metros estimados pelo modelo, não uma medição calibrada da cena.

Há cores RGB do frame usado na inferência, cores de normais, distância Z, vetores de normais e o frustum da câmera com eixos RGB (X/Y/Z). A máscara mostra branco válido e magenta inválido. Pontos mascarados, não finitos ou atrás da câmera são excluídos; normais inválidas não geram vetores. Não há pontos artificiais para preencher buracos ou partes escondidas.

O indicador informa contagem válida/inválida e erro RMS de reprojeção em pixels. Esse erro verifica consistência entre pontos e câmera; não mede a precisão da geometria em relação ao mundo real. O viewer exibe até 120 mil pontos; a amostragem é identificada quando aplicada. **Baixar NPZ original** preserva todos os arrays originais, sem as alterações ou a amostragem de visualização. Trocar a mídia limpa o viewer e descarta respostas antigas. Marigold V2 e mapas importados não fornecem essa geometria.

A inspeção usa WebGL2 e desenha somente ao carregar ou interagir. Abrir o viewer não altera lente, foco, depth, cores ou o render final. O desfoque ainda usa Z, não ray tracing da nuvem de pontos.

## Marigold V2

Modelo oficial: https://github.com/huawei-bayerlab/marigold-v2 — `huawei-bayerlab/marigold-v2-0`, `depth/Log-stage2`. Não é Marigold V1.1.

O upstream documenta Linux/CUDA. Nesta versão, o pipeline oficial foi executado com sucesso também no Windows, em ambiente novo instalado pelo aplicativo: Python 3.12.9, PyTorch 2.10.0+cu128 e RTX 4090. Isso verifica esta configuração; não garante funcionamento em toda GPU/driver.

A saída é log-depth relativo, com escala/deslocamento desconhecidos. O adapter inverte a direção e normaliza para branco próximo, sem inventar metros. O backbone tem cerca de 41 GB de arquivos e Log-stage2/embeddings acrescentam aproximadamente 1,9 GB. O encoder de texto não é baixado, pois o modelo usa embeddings fornecidos. A quantização mantém a configuração oficial de 4 bits.

## Validação desta versão

- Inferência real de ambos os modelos em ambientes isolados novos.
- Instalação MoGe 3, incluindo SDK Python e compilação de kernels em cache Triton novo.
- Instalação Marigold V2 pelo mesmo instalador usado pelo app, com repositório e pesos oficiais fixados.
- Marigold: imagem 640 × 425; aproximadamente 49 segundos em execução com cache de disco aquecido; pico de alocação CUDA de 15,5 GB. A primeira execução observada levou aproximadamente 69 segundos. São medidas desta máquina/imagem, não um benchmark universal.
- Mesmo seed/imagem: saída Marigold idêntica nos dois ambientes testados.
- Cache íntegro reutilizado; arquivo corrompido rejeitado; escrita de configuração com conflito transitório; evidência de inferência invalidada após alteração de identidade do runtime.
- Cancelamento real de inferência e testes de encerramento do processo de instalação. Fechar o aplicativo encerra seus processos ativos; downloads concluídos permanecem.
- Controles e mensagens principais localizados em português, inglês e chinês; inspeção de depth, alpha e óptica anterior coberta pelos testes de regressão.

Falta de VRAM, espaço, dependências, CUDA, acesso e falhas de download recebem códigos de diagnóstico e ações sugeridas. O app não reduz resolução ou precisão silenciosamente. A instalação de pacotes usa os índices PyPI/PyTorch e fontes oficiais; não é um instalador offline.

Ambos os modelos continuam monoculares por frame: não garantem estabilidade temporal nem recuperam o fundo escondido atrás de objetos. Limites atuais: 500 MB de upload e 3000 frames. O suporte macOS para esses runtimes CUDA não está incluído; importar mapas continua disponível.

## Render experimental — 0.9.18 (modo aditivo)

Abra **Ver geometria 3D do frame** e role até **Render pela geometria · experimental**. Escolha foco em metros, raio da abertura em milímetros, amostras (16–256) e resolução máxima (256–1024). **Usar foco e abertura do app** copia os controles atuais, sem modificar o render principal. **Renderizar pontos** projeta TODOS os pontos válidos do frame, não a amostragem de 120 mil pontos usada apenas pelo viewer. **Comparar somente Z** reconstrói os pontos pelos intrínsecos e Z e usa a mesma lente fina e amostragem. **Capturar prévia atual do app** captura o render principal para comparação visual, incluindo os efeitos ativos nele.

O modelo experimental é uma lente fina circular com câmera e intrínsecos estimados pelo MoGe. Não adapta o FOV para a lente selecionada nem traça os elementos de vidro. Também não aplica Near/Far, normalização, Gain/Bias ou efeitos criativos do render principal: usa a geometria métrica original. A base conceitual é a [câmera de lente fina do PBRT](https://pbr-book.org/4ed/Cameras_and_Film/Projective_Camera_Models).

Para ponto `P=(X,Y,Z)` e posição `a=(ax,ay)` na abertura, a direção projetada é `(X/Z, Y/Z) + a*(1/F - 1/Z)`, onde `F` é o foco em metros. Os intrínsecos normalizados convertem essa direção em coordenadas da imagem. Em uma câmera sem skew, o raio horizontal do bokeh é `r * fx * largura * abs(1/F - 1/Z)`. No plano de foco, o deslocamento é zero. Usamos amostras determinísticas em pares opostos e pesos iguais; bilinear splats acumulam RGB em luz linear com CPU float64, sem normalizar os highlights pelo número de pontos sobrepostos.

**Limites:** ainda não há teste de visibilidade por amostra (etapa 0.9.19), fundo oculto ou reconstrução de superfícies. Pontos sobrepostos se somam, portanto isto não é composição correta de objetos opacos nem eclipsed bokeh. Os pixels inválidos não são preenchidos. RGB vem do PNG de inferência em 8 bits, não é uma fonte HDR. Alterar a resolução limita a saída, sem descartar pontos de entrada. Render maior e mais amostras aumentam o tempo de CPU.

**Exportar PNG** salva RGBA para visualização, com RGB convertido para sRGB e cobertura limitada a 0–1. O quadriculado indica cobertura incompleta; a máscara não foi usada para recortar a imagem original. **Exportar linear NPZ** preserva `rgba_premultiplied`: RGB linear acumulado e cobertura original, inclusive valores acima de 1. Este é o arquivo adequado para verificar energia; o PNG pode saturar highlights. O status informa energia RGB de saída, perda no recorte, cobertura e tempo. Em frames sem recorte, a soma de energia permanece constante ao alterar abertura/amostras. O resultado é normalizado apenas pela área do pixel de saída e pela quantidade de amostras.

Mudanças no frame ou nos controles invalidam o resultado anterior; cancelar ou fechar o painel sinaliza o worker, que para entre amostras. Dados antigos não substituem a geometria atual. A exportação da geometria NPZ original permanece intacta.


## Oclusão por amostra — 0.9.19

No painel **Render pela geometria**, **Visibilidade → Oclusão por amostra** é o novo padrão. **Aditivo · comparação** mantém o comportamento da 0.9.18. Os dois modos usam a mesma lente fina, intrínsecos e amostras; trocar o modo invalida as exportações anteriores. O render principal do app e os plugins continuam independentes deste experimento.

Para cada posição na abertura, todos os pontos são projetados novamente. Um z-buffer é construído com os quatro fragmentos bilineares de cada ponto. Cada pixel aceita apenas fragmentos na distância Z mais próxima, com tolerância numérica de `max(1e-7 m, Z*1e-5)` para dados float32. A comparação ocorre antes da soma de cor; o buffer é refeito a cada amostra. Fragmentos visíveis de mesma profundidade são combinados pela média ponderada, sem depender da ordem dos pontos. A radiância visível é multiplicada pela cobertura projetada total limitada a 1 por amostra, evitando escurecimento artificial de superfícies opacas ao reduzir resolução. Suportes bilineares podem alargar a borda em aproximadamente um pixel. Assim, um elemento focado na frente pode cortar o disco de um ponto desfocado atrás, e a posição da oclusão muda com a abertura.

O diagnóstico separa **energia bloqueada** de **energia perdida no recorte**. A relação validada é `fluxo de entrada + ajuste de reamostragem = saída + bloqueado + recorte`, dentro da tolerância numérica. O ajuste, exibido separadamente, registra a diferença entre fluxo de pontos visíveis e radiância reconstruída de superfícies opacas. Assim, este modo não promete conservar a soma de fluxos aditivos da 0.9.18. Não há compensação global de exposição pela energia bloqueada; a reconstrução é local por pixel e amostra. O NPZ exporta o modo de visibilidade e as três medidas; o PNG continua sRGB limitado para visualização, com cobertura independente. No modo de oclusão, a cobertura fica em 0–1; no aditivo pode exceder 1. A energia é a soma do fluxo representado por pontos, não uma medida calibrada da radiância da cena.

**Limites:** é um z-buffer de nuvem de pontos com suporte bilinear, não ray tracing de superfícies contínuas. Não há malha, transparência de materiais, reconstrução do fundo escondido ou prescrição de vidros. Mudanças bruscas de depth, pontos esparsos e pixels inválidos ainda podem produzir falhas, buracos ou bordas serrilhadas; reduzir a resolução pode aumentar colisões entre pontos. Em superfícies inclinadas, fragmentos vizinhos podem competir pelo mesmo pixel; a média e a cobertura preservam radiância constante, mas não garantem reconstrução exata de detalhes/texturas. Normais não são usadas para criar superfícies. Este modo não garante remover os halos do render de produção ou recuperar informação ausente. A resolução e o número de amostras são explícitos, sem redução silenciosa.

**Validação 0.9.19:** cena sintética com primeiro plano e fundo em distâncias conhecidas; bloqueio pelo ponto mais próximo; invariância à ordem da nuvem; empate de profundidade; disco de bokeh eclipsado; mudança de visibilidade por posição na abertura; balanço de energia incluindo bloqueio; regiões sem dados preservadas; cancelamento e comparação dos dois modos pela API/interface. Teste nativo separado usa uma geometria real do MoGe 3 já existente, sem repetir a instalação/inferência do modelo.


## Superfícies contínuas — 0.9.20

**Render pela geometria → Visibilidade → Superfícies · malha** é o novo padrão experimental. Os modos **Oclusão por amostra** (pontos, 0.9.19) e **Aditivo · comparação** (0.9.18) permanecem disponíveis. Alterar modo ou limite de salto invalida o resultado e as exportações anteriores. O render principal e os plugins não são substituídos.

A grade original do MoGe gera dois triângulos por célula, conectando somente vértices válidos. Cada triângulo é descartado se `Zmax / Zmin > 1 + salto/100`. **Salto máximo de depth (%)** aceita 0,1–100, com padrão 5; é um limite relativo por triângulo, não uma faixa em metros ou um filtro de suavização. Valores menores podem cortar superfícies inclinadas; maiores podem criar pontes indevidas entre objetos. Nenhuma conexão atravessa pixels inválidos. Não há decimação nem preenchimento do fundo oculto. A comparação por Z reconstrói os vértices pela mesma câmera e aplica a mesma topologia.

Por amostra de abertura, os triângulos são projetados pela lente fina e rasterizados com z-buffer e interpolação de RGB linear corrigida por perspectiva (`barycentric / Z`). Só a superfície mais próxima contribui em cada pixel. A média das amostras produz RGB premultiplicado e cobertura 0–1. Cada amostra avalia o centro do pixel; não há supersampling espacial adicional. Isso reduz buracos internos e competição entre splats de uma superfície contínua, mas não garante bordas sem serrilhado ou bokeh sem ruído com poucas amostras.

O status mostra triângulos aceitos, cortes por depth, cobertura, radiância linear integrada e tempo de CPU. Nesta modalidade, **perda por recorte, fluxo de pontos bloqueado e ajuste de reamostragem aparecem como “—”**, pois a soma de fluxos de pontos não é uma métrica válida para superfícies interpoladas. O NPZ registra `energy_semantics`, modo, limite de salto e contagens de triângulos válidos, descartados por máscara e cortados por depth. O PNG é apenas a visualização sRGB; o NPZ preserva o resultado linear float32, calculado com float64.

**Limites:** a malha é a superfície visível da imagem, sem geometria escondida, transparência de materiais ou vidro real. Termina nos centros dos pixels externos; a borda do frame pode perder cobertura. Highlights menores que um pixel, máscaras esparsas e depth impreciso podem impedir triângulos ou produzir buracos. Se nenhum triângulo for válido, há erro explícito com orientação para usar pontos ou ajustar o limite; não há fallback silencioso. Normais não modificam a malha nesta versão. A rasterização limita os candidatos de pixels por lote e verifica cancelamento dentro dos lotes; resolução e amostragem continuam explícitas.

**Validação 0.9.20:** superfície inclinada texturizada; referência independente de interpolação por perspectiva; superfície mais próxima independente da ordem; cortes de depth e buracos de máscara; triângulo maior que o viewport; cancelamento; rejeição de malha vazia; integridade do NPZ original; igualdade de topologia pontos/Z; controles em três idiomas, decimal com vírgula, exportação e execução nativa com geometria real MoGe existente. Sem reinstalar ou executar novamente os modelos de IA.


## Integração dentro do pixel — 0.9.21

Em **Superfícies · malha**, **Amostras por pixel** oferece 1, 4, 9 ou 16 avaliações em uma grade quadrada centrada. O painel usa 4 por padrão; a API conserva 1 como padrão para requisições antigas. **1** reproduz a rasterização central da 0.9.20. Este controle só atua na malha; ao selecionar pontos/aditivo fica desabilitado e a requisição usa 1. Valores não suportados são rejeitados, sem redução silenciosa.

Para cada posição da abertura, cada subpixel possui seu próprio teste de visibilidade e interpolação de radiância por perspectiva. RGB linear premultiplicado e cobertura são integrados juntos, com pesos iguais. Não é um blur aplicado depois do render, nem uma suavização da máscara de depth. Isso permite cobertura parcial nas bordas de superfícies opacas e reduz parte dos serrilhados e da perda de detalhes pequenos por amostragem central.

**Amostras da abertura** e **Amostras por pixel** são custos distintos: 64 × 4 são 256 avaliações por pixel. O status, progresso e NPZ registram `samples`, `spatial_samples`, `effective_samples` e o padrão fixo `spatial_pattern`. Alterar qualidade invalida as exportações anteriores. Cancelamento é verificado entre subpixels e dentro dos lotes de triângulos. A mesma grade determinística é reutilizada nos frames, sem jitter aleatório; isso não garante estabilidade temporal quando a geometria muda.

**Validação:** cobertura analítica de borda (70%, estimada como 75% com 16 amostras contra 100% com uma); integração de primeiro plano/fundo após visibilidade; RGB/alpha premultiplicados; preservação de radiância constante; equivalência exata do modo 1 ao anterior; determinismo, opções inválidas e cancelamento entre subpixels. Interface, API, PNG/NPZ e executável são verificados com o mesmo caminho de produção.

**Limites:** custo aproximadamente proporcional à quantidade de amostras espaciais; sem aceleração GPU nesta etapa. Uma grade finita ainda pode produzir aliasing, ruído de bokeh ou perder detalhes menores que seus intervalos. Não recupera geometria escondida, não corrige depth incorreto, não aplica a prescrição dos vidros e não substitui o render principal nem os plugins. A cobertura na borda externa do frame continua limitada pela malha original. As configurações 0.9.20 com amostra única continuam disponíveis para comparação.


## Reutilização e profiling — 0.9.22

Em **Superfícies · malha**, **Motor da geometria → CPU · reutilização** é o novo padrão do painel. **CPU · referência** executa o caminho sem cache e sem eliminar repetições, para comparação. A API mantém referência como padrão para clientes anteriores. Os modos de pontos permanecem no caminho de referência; o seletor fica desabilitado. Isto não ativa CUDA nem IA no render de geometria.

O cache de geometria preparada usa conteúdo SHA-256 dos arquivos de geometria e RGB, caminho do job, representação e limite de salto de depth. Foco, raio, resolução e amostragem podem reutilizar os vértices, cores e topologia preparados. Alterar conteúdo, representação ou limite de corte invalida a entrada correspondente. O cache de resultado também inclui todos os controles de render. Repetir a mesma requisição reutiliza o array linear float32 já calculado, sem recalcular a malha ou reduzir qualidade. As exportações continuam sendo geradas para o novo render; logo, um cache hit ainda tem custo de hash e de PNG/NPZ.

Ambos os caches são locais ao processo, sem gravar pesos ou resultados adicionais em disco. Guardam no máximo quatro entradas cada, com orçamento de arrays de 128 MiB para geometria e 64 MiB para resultados, usando remoção da entrada menos recente. Entradas maiores não são guardadas. Os budgets não representam a memória total do app, nem os buffers temporários de rasterização. Dados em cache são somente leitura. Encerrar o app libera o cache.

Quando o raio é exatamente zero, todas as posições da abertura produzem a mesma projeção; no modo de reutilização cada subpixel é rasterizado uma vez. O mesmo vale quando TODOS os vértices estão exatamente no plano de foco. Não são descartadas posições distintas nem reduzidas amostras em outros casos. O status preserva a amostragem solicitada e mostra **rasterizações / reutilizadas**. A reassociação da soma float64 pode alterar os últimos bits numéricos; a referência fica disponível. Os testes com abertura finita e cache hit exigem float32 idêntico; a otimização de projeções idênticas usa tolerância de 1e-7.

O diagnóstico informa hash de entrada, preparo, render e exportação em milissegundos, cache de resultado/geometria e tempo total. Na API, `performance` distingue os custos da requisição atual; o render da malha também mede projeção, rasterização e acumulação. O NPZ registra os tempos de cálculo disponíveis antes de ser escrito; os tempos de exportação são adicionados ao status da API depois das escritas. Não há medição de transferência GPU porque esse caminho usa CPU.

**Validação:** referência/otimizado com abertura finita; resultado de cache idêntico; reutilização após mudança de foco; invalidação de topologia após mudança do salto; substituição de RGB com o MESMO tamanho e timestamp; orçamento/remoção LRU; arrays somente leitura; cancelamento, opções inválidas e profiling; abertura zero com 256 rasterizações solicitadas e somente 4 distintas. Tempos são medidas de cenas/configurações específicas, sem promessa de aceleração universal. Alterar foco com abertura finita ainda exige um novo render de todas as posições distintas.

O modelo continua lente fina circular com geometria visível MoGe, sem prescrição de vidros, fundo oculto, reconstrução temporal ou alterações nos plugins. Cache e profiling não corrigem um mapa de profundidade incorreto.


## Kernels comparáveis — 0.9.23

Em **Superfícies · malha → CPU · reutilização**, **Kernel da malha** oferece **Ordenação · referência** (padrão) e **Agrupamento e redução** (experimental). Em **CPU · referência** e nos modos de pontos o seletor fica desabilitado e usa ordenação. A troca invalida o resultado anterior, sem alterar abertura, resolução, amostras ou máscara. O cache de resultado inclui a escolha de kernel; a geometria preparada pode ser reutilizada entre os dois.

O caminho anterior ordena por pixel, profundidade e índice de triângulo. A alternativa faz agrupamento estável por pixel e redução da menor profundidade, mantendo o primeiro triângulo nos empates. Os fragmentos são gerados na ordem dos índices de triângulo por lote, portanto o desempate permanece equivalente ao anterior. Só os vencedores recebem interpolação RGB; os demais ainda participam da seleção exata de profundidade. A seleção entre lotes também compara a profundidade e o índice original. Não há mudança na tolerância, precisão float64 ou contagem de amostras.

O status/NPZ registra `kernel_used`, `candidate_pixels`, `accepted_fragments` e `color_fragments`. Os candidatos incluem pixels do bounding box; os fragmentos de depth ficam dentro do triângulo; o contador de cor registra as interpolações efetivamente calculadas ao longo dos lotes/amostras, não apenas os pixels finais. Um vencedor de lote ainda pode ser encoberto por outro lote. Em cache hit os contadores de trabalho atual são zero.

**Validação:** comparação exata dos buffers float64 e do render float32; cenas aleatórias com 1, 100 e 2200 triângulos; lotes com mais de 200 mil candidatos; vencedores entre grupos de triângulos; empates, distâncias float64 adjacentes, valores RGB acima de 1, projeção inválida, cancelamento e opções inválidas. Na cena de planos sobrepostos, a alternativa reduz as interpolações de cor sem modificar o resultado.

**Desempenho observado:** na cena real MoGe com 102.268 triângulos, 512 × 320, 16 amostras de abertura e 4 por pixel, o ganho de tempo não foi consistente entre medições. Por isso, a ordenação continua padrão. A redução fica disponível para avaliação por cena, sem promessa de aceleração. Ambos continuam CPU; não há IA, CUDA ou mudança nos plugins nesta etapa. O benchmark separado registra tempos brutos e configurações, comparando renders novos sem usar o cache de resultados.


## Forma da pupila — 0.9.24

Em **Render pela geometria → Superfícies · malha**, **Lâminas da íris** oferece **Circular** (padrão) e polígonos regulares de 3 a 11 lados. **Rotação da íris (°)** aceita −180 a 180, inclusive digitação com vírgula. O raio informado é o raio circunscrito do polígono. A rotação positiva segue X direita/Y baixo da câmera, aparecendo no sentido horário no desenho. Os controles ficam desabilitados nos modos de pontos; a rotação também fica desabilitada para a abertura circular.

A forma controla as posições na abertura usadas para projetar a malha e testar a visibilidade, portanto afeta o bokeh antes da composição. Não é um polígono estampado no resultado. O contorno da pupila é mostrado antes do render; depois, os pontos amarelos vêm de `pupil_samples_mm`, as posições realmente executadas pelo backend. Se a reutilização de projeções idênticas usar só uma posição, o desenho mostra essa posição representativa. O NPZ/status também registra forma, lâminas, rotação, vértices e área geométrica em mm².

A circular conserva exatamente a sequência anterior de amostras. Nos polígonos, setores triangulares de área igual são amostrados com transformação `sqrt(u)`, sequências determinísticas e pesos iguais. Polígonos pares usam amostras opostas para manter o centro em zero; polígonos ímpares têm pequeno erro de centro/distribuição com contagem finita. Não existe randomização por frame. Mais amostras reduzem parte desse erro, sem garantir bokeh ou vídeo livres de ruído. A amostragem espacial e a oclusão continuam iguais às versões anteriores.

A área registrada é `πR²` para círculo e `n R² sin(2π/n)/2` para polígono. **A exposição permanece normalizada** pela quantidade de amostras, sem simular a variação de throughput ao trocar a área. A íris é uma pupila ideal plana da lente fina; não modela lâminas curvas, espessura, vinheta dos vidros, difração ou a prescrição real da lente selecionada. Também não representa uma lente anamórfica.

Alterar lâminas/rotação invalida o resultado mostrado e entra na chave do cache de render. Os vértices e triângulos preparados podem ser reutilizados. Os clientes antigos da API conservam `blades=0, rotation_deg=0`. Valores não suportados são rejeitados sem fallback silencioso.

**Validação:** sequência circular idêntica; pontos dentro de cada polígono; segundo momento de área contra referência analítica; centro das formas pares; rotação consistente; repetibilidade; raio zero; projeção de desfoque; radiância/exposição de plano focado; área e amostras exportadas; controles inválidos. API/interface validam rotação negativa com vírgula, desenho das amostras reais, modos anteriores, cache, PNG/NPZ e cancelamento. O teste nativo usa a geometria real MoGe já existente, sem repetir a inferência.


## Pupila oval e orientação — 0.9.25

Em **Render pela geometria → Superfícies · malha**, **Proporção da pupila X/Y** aceita 0,25–4 (padrão 1), inclusive vírgula. Valores menores que 1 alongam a pupila verticalmente; maiores que 1, horizontalmente. **Rotação da pupila (°)** passa a atuar também na abertura oval sem lâminas. A transformação alonga X por `sqrt(proporção)` e Y por `1/sqrt(proporção)` antes de girar; a rotação positiva segue X direita/Y baixo da câmera. O raio é o raio circular ou circunscrito original, antes desta transformação. Assim, no limite 4, o semieixo X pode chegar a duas vezes o raio informado. Nos polígonos, o alongamento acontece antes da rotação.

A transformação tem determinante 1 e conserva a área geométrica da pupila: `πR²` para elipse e `nR²sin(2π/n)/2` para o polígono transformado. A exposição continua normalizada pelas amostras. A proporção não altera FOV, intrínsecos, imagem em foco ou topologia. O efeito vem das posições transformadas na abertura, projetadas antes do teste de visibilidade de cada amostra, e não de um alongamento posterior do resultado. A relação aparente do bokeh em pixels também depende de `fx*largura` e `fy*altura` da câmera.

O desenho mostra o contorno oval/poligonal e as posições executadas, com enquadramento adaptado aos semieixos. NPZ e status registram `pupil_aspect`, semieixos antes da rotação, contorno (96 pontos para círculos/elipses), vértices poligonais, posições executadas e área. Os controles são independentes do render principal e dos plugins; pontos/aditivo ficam desabilitados e usam a abertura circular anterior. Proporção 1 conserva exatamente as sequências da 0.9.24; círculo sem alongamento mantém rotação zero na API. Mudanças invalidam o resultado, preservando o cache da geometria preparada quando aplicável.

**Limites:** isto é uma pupila ideal oval de lente fina, não uma prescrição anamórfica. Não simula squeeze/desqueeze da imagem, superfícies cilíndricas, foco XZ/YZ independente, vidros, vinheta, difração ou fundo oculto. Amostragem finita pode produzir ruído ou perder detalhes; não há redução silenciosa de qualidade nem novo motor GPU.

**Validação:** compatibilidade exata em proporção 1, suporte e covariância analíticos da elipse, rotação após alongamento, área constante, exposição em foco, efeito na imagem antes da visibilidade, igualdade dos kernels CPU, invalidação de cache, NPZ, cancelamento, limites e controles nos três idiomas. Teste nativo do código e do EXE com geometria real MoGe já existente, sem reinstalação ou nova inferência.


## Inspeção do ponto de luz — 0.9.26

**Render pela geometria → Superfícies · malha → Inspecionar ponto de luz** mostra três previsões geométricas em uma escala comum: ponto em `F/2`, no foco `F`, e em `2F`. Usa abertura, lâminas, proporção X/Y, rotação, quantidade de amostras, foco e resolução atuais, mais os intrínsecos originais do MoGe. Não executa rasterização da cena, altera configurações do render principal ou ocupa o worker do render. Pontos/aditivo não disponibilizam esta inspeção. Alterações do frame/controles invalidam a previsão; respostas antigas são descartadas.

Os pontos amarelos são as mesmas posições determinísticas da abertura usadas na malha, projetadas como deslocamentos em pixels de saída por `(1/F − 1/Z)`. Pesos iguais somam 1. O contorno é o suporte geométrico ideal, não uma distribuição de brilho. Círculos/elipses usam 96 segmentos para desenhar o contorno; os diâmetros X/Y usam o suporte analítico exato da elipse, inclusive rotação e skew. Polígonos usam seus vértices transformados. Os três quadros preservam a mesma escala de pixels; o enquadramento muda entre inspeções conforme a extensão necessária. No foco, todos os pontos colapsam em zero. Antes do foco o sinal inverte; em F/2, a extensão é duas vezes a extensão em 2F. O tamanho aparente também depende da escala de intrínsecos em pixels.

**Exportar diagnóstico JSON** conserva configuração, câmera, dimensões de entrada/saída, distâncias, offsets, pesos e diâmetros. Este diagnóstico é de lente fina ideal: não é PSF radiométrica ou de difração; não inclui aberrações, vinheta por vidros, oclusão ou variação da PSF pelo campo. A malha da cena ainda é necessária para avaliar eclipsed bokeh. A inspeção não prevê correções para depth incorreto nem recupera regiões ocultas.

**Validação:** diâmetro circular contra fórmula independente, colapso exato no foco, inversão de sinal, proporções perto/longe, abertura zero, suporte de polígonos, elipse girada com skew, determinismo e amostras iguais ao motor. API não modifica arquivos/caches; interface valida três vistas na mesma escala, JSON, três idiomas, vírgula, limites, respostas antigas e troca de frame. Executável é testado com geometria real MoGe existente e render/exportações da malha.

## Área óptica unificada — 0.9.26

A aba **Lente · vidros e foco** reúne as quatro respostas de bokeh acima do editor 3D, seleção/edição dos vidros e controles de foco/íris sincronizados com o app, também ao ampliar o 3D. A vista lateral com alças, tabela e editor alternativo fica em uma seção expansível na mesma aba. **Diagnósticos ópticos** reúne distorção física, frente de onda, PSF espectral e ghosts sem alterar seus cálculos.

O addon Blender 0.1.2 evita trabalho OSL em frames com parâmetros idênticos; a mudança de foco reposiciona os vidros de inspeção sem recriar a malha quando a prescrição/unidade não muda. **Usar lente óptica em CPU** mantém a câmera OSL para avaliar cenas que ultrapassam o limite do OptiX. **Restaurar câmera original** remove o shader/bytecode próprios e os vidros gerados, restaura as propriedades registradas e desliga atualização automática. Desativar o addon também tenta restaurar câmeras gerenciadas. Não remove materiais ou objetos da cena do usuário. Instalações antigas sem snapshot não recuperam configurações anteriores já perdidas.

O limite de dados OSL do OptiX não foi removido: esta versão oferece menor trabalho redundante e recuperação explícita; não garante que uma cena arbitrariamente complexa renderize em OptiX ou que reiniciar o processo GPU após uma falha seja dispensável. CUDA continua sem executar a câmera OSL. Testes de estado/compilação executados em Blender 5.3 Alpha; o cenário complexo relatado pelo usuário não foi reproduzido.
