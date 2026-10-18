# Camadas e profundidade — plugins 0.2.1

Esta edição adiciona camadas ao After Effects e ao Nuke, e preenchimento de fundo ao Depth Cut no Resolve. A referência de comportamento é [Layers and Depth Map](https://higx.net/optics/guide/layers.html). O código é uma implementação própria; não usa o plugin Optics nem pressupõe equivalência óptica com ele.

## After Effects e Nuke: imagem → A → B → C

Cada camada RGBA chega com sua transparência. A ordem é fixa: imagem, A, B, C. A profundidade decide o desfoque, sem reordenar essas entradas. Todas são amostradas com a mesma posição na pupila e compostas antes da integração da luz. Assim, um elemento na frente pode recortar uma parte de um disco de bokeh atrás dele.

**Profundidade em metros** vem ativada: valores positivos são distâncias da lente; zero ou negativos acompanham o plano de foco. Desativada, as profundidades são deslocamentos em metros em relação a **Distância sem depth (m)**: zero coincide com esse plano e valores positivos ficam atrás. Esta unidade de deslocamento é a convenção desta implementação. **Foco (m)** altera o desfoque de todas as camadas.

Os mapas **Depth Layer A/B/C** substituem a distância constante de cada camada. Usam o mesmo Canal, Gain, Bias, Inverter mapa e limites próximo/distante do depth principal. A convenção existente foi preservada: branco próximo, preto distante, salvo inversão. Gain/Bias são aplicados antes da inversão e limitados a 0–1. Um depth relativo precisa ser ajustado à escala métrica; seus valores não são metros automaticamente.

Mapas variados usam 4–32 fatias, conforme o controle existente de fatias; um mapa constante usa um único plano. As fatias são compostas do fundo para a frente dentro de cada entrada. A correção de contorno guiada pela imagem foi mantida para bordas de duas superfícies locais; não altera rampas contínuas ou bordas ambíguas.

## A como glitter

Conecte uma textura RGBA à Layer A e ative **Layer A is Glitter**. Ela deixa de ser uma camada normal e acrescenta variação de luz às amostras dos discos principais, na sua própria profundidade. B e C continuam na frente dela. **Ganho do glitter** regula a contribuição.

Conecte **Glitter Matte**, branco onde os highlights devem cintilar e preto onde não devem. Alternativamente, use alpha acima de 1 na imagem principal, em float32: alpha 2 dá a mesma ativação de uma matte branca. Essa indicação é lida antes da filtragem; a opacidade resultante continua limitada a 0–1. Para 8/16 bits, use a matte. RGB e alpha dos inputs devem respeitar a premultiplicação declarada pelo host.

**Normalize Glitter** compensa a energia adicionada usando a média de luminância da textura ponderada pelo alpha. É uma normalização aproximada; não garante exposição idêntica em qualquer corte, oclusão ou textura. O glitter de A substitui o Shimmer procedural enquanto estiver conectado e ativado. Texturas coloridas podem colorir a contribuição; use textura branca para cintilação neutra.

## C como vidro

Conecte uma textura de vidro/gotas à Layer C e ative **Layer C is Distortion**. As variações de luminância multiplicadas pelo alpha refratam a imagem, A e B. C deixa de ser composta como cor. A textura é amostrada na profundidade de C: aproximar o foco do vidro muda a definição da refração.

**Distorcao do vidro (px)** limita o deslocamento em pixels na resolução plena. Zero desativa a refração sem exibir a textura. O deslocamento é comum aos canais RGB; a dispersão da lente permanece um controle separado. É uma refração visual baseada no gradiente da textura, sem simulação da geometria completa de uma gota.

## Resolve: Depth Cut, Grow e Feather

O plugin Resolve continua com Source e Depth, sem entradas A/B/C. Ative **Usar depth**, conecte o mapa e escolha **Depth Cut** ou **Depth Cut + Eclipsed bokeh** em Composição de profundidade.

**Cut**, **Grow (px)** e **Feather (px)** ficam em Mapa de profundidade; no OFX, dentro do subgrupo Depth Cut. **Depth em metros (mapa / Cut)** vem desligado para preservar projetos antigos. Desligado, o Cut opera no mapa normalizado 0–1 depois de Gain/Bias e Inverter mapa, com a direção próxima/distante já configurada. Ligado, o mapa após Gain/Bias representa distância da lente e o Cut é uma distância em metros. Menor distância fica no primeiro plano. Gain negativo faz valores maiores na entrada corresponderem a distâncias menores. Isso também vale para os mapas das camadas A/B/C; suas distâncias constantes têm o controle separado Profundidade em metros.

Exemplo métrico: sujeito em 2 m, fundo em 8 m, Cut em 3 m. Use limites que contenham essas distâncias e Foco em 2 m para manter o sujeito focado. No Cut métrico, o fundo preenchido e a extensão do primeiro plano preservam os valores de profundidade; não são substituídos pelos limites próximo/distante. No modo métrico, a faixa interna é ampliada para conter as distâncias válidas do mapa; o limite distante antigo não muda a classificação de um pixel em 20 m quando Cut está em 15 m. A distância mínima do traçado continua em 0,3 m. As fatias configuradas determinam a aproximação de superfícies com profundidade variável.

O controle antigo **Transicao do corte (mapa)** permanece separado por compatibilidade, em unidades normalizadas internas. **Feather (px)** é a suavidade espacial da matte original. Gain/Bias não extraem metros de um mapa relativo de IA.

Os controles novos **Grow (px)** e **Feather (px)** trabalham no contorno da imagem. Grow exclui uma faixa ao redor do objeto ao buscar pixels conhecidos para preencher o fundo; Feather suaviza a matte do primeiro plano. A cor e a profundidade do primeiro plano são estendidas além da silhueta para seu desfoque não tomar a cor do fundo. O preenchimento usa pixels próximos do fundo e não recupera detalhes ocultos de uma fotografia.

O Cut métrico, Grow ou Feather em pixels maior que zero ativa o novo motor de camadas para o Depth Cut. Com a unidade métrica desligada, ambos em zero preservam o caminho anterior quando não há camadas extras. Os mesmos controles existem no After e Nuke. O padrão zero mantém projetos existentes.

**Depth da Source se pin vazio** (After: **Depth da imagem se camada vazia**) permite ler o Canal escolhido da imagem principal quando o depth externo está vazio. É opt-in, exige Usar depth, e não gera profundidade por IA.

## Alinhamento, qualidade e limites

After: use precomposições no mesmo formato/enquadramento da imagem para camadas e mapas transformados. Nuke: use Reformat/Transform para alinhar os inputs. O canvas de saída é o da Source; áreas de camadas fora dele são cortadas. Buffers OFX com origem deslocada ou linhas negativas são respeitados. Dados de depth não devem passar por LUTs ou conversões de cor. O glitter e vidro têm a mesma duração e sincronização da cena.

O processamento mantém RGB linear HDR e alpha premultiplicado. Use a gestão de cor do host para entregar luz linear. Mais amostras e fatias aumentam o custo. Comece com Fast, campo 3×3 e Proxy/menor resolução. O limite por frame é 8192 pixels por eixo e 17 megapixels. As pirâmides de camadas têm limite de 3 GB; o total de RAM/VRAM pode ser maior devido a buffers auxiliares e às cópias do host.

A biblioteca **bruxos_layers_cuda.dll** deve acompanhar o plugin e a biblioteca CUDA anterior. Automático usa CUDA em NVIDIA compatível e recorre à CPU em caso de indisponibilidade; CPU pode ser escolhida explicitamente. O Toolkit não é necessário. Os buffers entram pela CPU e são transferidos para CUDA, sem interop GPU específico dos hosts.

IDs existentes do efeito e parâmetros foram mantidos; os novos foram acrescentados. Restaurar perfil preserva conexões e controles de camadas/depth. Não há geração de depth, OptiX, DLSS ou render de geometria 3D completa. A edição standalone permanece separada.
