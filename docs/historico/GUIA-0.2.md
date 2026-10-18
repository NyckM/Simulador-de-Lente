# Optica Lab 0.2 — prévia GPU e vídeo

Execute `Iniciar.cmd` e acesse **http://127.0.0.1:8766/**. Requer Python 3.13 e navegador com WebGL2/EXT_color_buffer_float. O launcher reutiliza o ambiente local ou instala as dependências em `.venv`. Mantenha o servidor aberto. A sessão antiga em 8765 foi preservada.

## Uso

- Ajustes atualizam automaticamente. Foco, filmback e modificadores alteram uniforms na GPU. Mudanças da íris, lâminas, dispersão, sensor e distância da fonte regeneram um atlas em segundo plano.
- Foco inicial a 0,8 m e plano a 5 m produzem bokeh visível. Aproxime as distâncias para reduzir o desfoque. Ampliação do bokeh e realce de luzes são artísticos; não recuperam HDR clipado.
- Caráter criativo inclui distribuição de energia da pupila (centro/borda), esférica primária/secundária com sinal, swirl, coma, squeeze e difusão. Mistura em zero retorna a entrada, com a exposição escolhida.
- Imagens PNG/JPEG/WebP e vídeos compatíveis com o navegador, como MP4 H.264 e WebM, são lidos localmente. Vídeo tem play, pause e seek. Não há upload remoto.
- Qualidades: maior lado 512/768/1280 px, 24/48/64 amostras por canal. Exportar frame grava PNG na resolução da prévia.
- Gravar WebM começa no início, **sem áudio**, no tempo de reprodução. Pode perder frames se a máquina não acompanhar. Parâmetros ficam bloqueados durante a gravação. Limite de 500 MB; não é exportação offline com FPS garantido.
- Depth PNG precisa ter dimensões iguais às da mídia. Branco é próximo, preto distante, em distância inversa. Leitura GPU pelo navegador tem 8 bits. Em vídeo o mapa é estático, sem tracking. O demo fixa objeto/luzes em 2/5 m.
- JSON salva parâmetros, não mídia/depth. Projetos v1 são aceitos se os valores estiverem nos limites atuais.

## Como funciona e onde aproxima

`optics/core.py` preserva o ray tracer e compositor CPU. `optics/preview.py` comprime feixes em 64 células de pupila por canal, em nove posições do campo; guarda posição, direção e energia. `web/gpu.js` interpola o atlas e amostra o frame, sem render HTTP por frame. Uma pirâmide RGBA16F em luz linear reduz lacunas entre amostras. Essa filtragem suaviza detalhes da PSF.

A prescrição pública Double-Gauss tem distância focal efetiva de aproximadamente 50,3582 mm. Stop em mm não é diretamente f-number. Dispersão usa Cauchy/Abbe sintético 45, pois não há materiais completos. Estudos Helios/Petzval/anamórfico usam a mesma prescrição: não são réplicas medidas. Esférica extra e pupila são modificadores criativos, não solver de frente de onda.

O render CPU `/api/render` permanece como referência, mas **não aplica todos os controles novos da GPU**. Os diagnósticos de PSF na interface pertencem ao núcleo CPU. A prévia gather não é equivalente à convolução CPU por contribuição da fonte.

## Limites

- Bokeh muito grande, bordas e depth podem perder definição. Sem reconstrução do fundo oculto, oclusão exata ou depth temporal.
- Mídia importada tratada como sRGB; sem OCIO/ACES/Log, EXR ou vídeo HDR profissional. Alfa compõe sobre preto. PNG/WebM são SDR; highlights acima do branco clipam.
- Transmissão relativa ao centro; exposição não varia automaticamente com abertura. Centroide recentrado; warp polinomial separado. Sem breathing físico.
- Sem difração, ghosts, flare físico, coatings, lentes comerciais calibradas, MTF editável, keyframes ou plugins.
- Contador frames/s mede callbacks processados. Tempo GPU mede só a convolução, excluindo decode/upload/pré-filtro. Sem garantia de 4K em tempo real.

## Validação

20 testes numéricos/de integração passaram. Em teste de reprodução de um MP4 sintético 768×480 a 24 fps, o indicador ficou próximo de 24 fps. WebM VP9 exportado foi decodificado pelo ffprobe: 768×480, 193 frames (inclui captura inicial). A gravação é de taxa variável, não exportação determinística. Consulte VALIDACAO.md.

Mantenha a licença MIT/atribuição LensSim em `data/`. Consulte COMPARATIVO.md para o inventário competitivo e os recursos ainda necessários.

### Revisão AA

A qualidade **Detalhada · AA 2×** usa quatro subpixels por pixel final, combinados em luz linear. As demais qualidades também recebem filtragem de redução corrigida. O modo Detalhada exige mais GPU; se o vídeo perder fluidez, use Equilibrada. Antialiasing reduz degraus gerados pelo render, mas não reconstrói detalhes ou serrilhado já presentes na mídia.


## Exportação independente da prévia

Escolha 1920, 3840 (4K), 4096 px ou tamanho original no seletor de exportação. O valor limita o maior lado, mantendo a proporção; fontes menores são ampliadas. Uma fonte 16:9 exportada em 3840 gera 3840 × 2160. A lente é recalculada nessa resolução com 64 amostras, sem ampliar o canvas da prévia. A saída usa AA 1× para conter memória em 4K; a prévia Detalhada mantém AA 2×.

PNG retorna imediatamente à qualidade de prévia após capturar o resultado. WebM usa a resolução escolhida durante a gravação, sem áudio, em tempo de reprodução: pode perder frames se a GPU não acompanhar. Não equivale ainda a exportação offline com FPS garantido.

Validação: exportação pela interface de um demo 768 × 480 para PNG 3840 × 2400; prévia restaurada para 768 × 480. Sintaxe dos dois scripts verificada com Node.


## Estabilidade do bokeh em movimento

A filtragem de cada amostra considera também a extensão do raio e o aumento do espaçamento causado por esférica, swirl e coma. Isso reduz subamostragem de altas luzes em movimento, ao custo de alguma suavização local. Vídeos usam as 64 amostras do atlas em todas as qualidades; a resolução da prévia continua selecionável. Não há mistura de frames anteriores nem compensação de movimento.

Validação GPU: 24 posições subpixel de pontos com energia linear constante, 512 × 256, sem erros WebGL. Soma das diferenças absolutas entre frames: 610693 antes e 509420 depois (redução de 16,6% neste teste sintético; inclui movimento legítimo, não é uma medida universal de flicker). Uploads repetidos de imagem idêntica apresentaram diferença zero. O vídeo do usuário não foi validado nesta rodada. Realce criativo de luzes e variações presentes no próprio material ainda podem causar oscilações.
