# Simulador de Desfoque da Bruxosdovfx 1.0.0

## Uso

Abra uma imagem ou vídeo, escolha a lente e ajuste o foco. Com depth, use **Selecionar foco** para clicar no objeto. O mapa precisa corresponder à imagem: branco/preto são interpretados conforme a direção e a faixa Near/Far. O demo usa seu mapa binário conhecido e restaura sua interpretação ao carregar.

Gain/Bias ou Near/Far podem reduzir um mapa variável a um único plano. A inspeção avisa essa condição; **Restaurar Gain / Bias** recupera 1/0 sem alterar lente, foco ou limites. Um ponto abaixo do foco mínimo da lente é recusado com explicação. Mistura geral em zero desliga o efeito; um aplica a resposta inteira.

## Filtros

Em **Filtros**, adicione até 16 módulos. A ordem é de cima para baixo; as setas mudam a ordem. Há Black Mist, White Mist, suavização de detalhe, Streak, estrelas, véu lateral, janela central, replicações/Linear, Halo FX, Kaleidoscope FX, Split Diopter FX, Fringing e Halation.

São efeitos artísticos próprios. Os nomes descrevem a aparência; não representam medições ou calibração de filtros comerciais. Black Mist redistribui altas luzes; White Mist espalha a imagem inteira. Fringing seleciona contraste e desloca canais. Os prismas usam amostragem e refração artística da imagem disponível.

Streak e Star não constituem o sistema de flare óptico solicitado. Há análise de reflexões internas e PSF de difração em caminhos próprios, mas a integração de flare, glow, bokeh e visibilidade do primeiro plano permanece pendente. [Escopo do flare óptico](FLARE-OPTICO.md).

Todos têm bypass e intensidade próprios. Posição X/Y usa percentuais da imagem: 0% é esquerda/topo, 100% direita/base, limites −100% a 200%. Escala uniforme e por eixo: 5%–400%; rotação: −360° a 360°. O pivô é local, padrão no centro, em unidades de um quarto do lado curto. Alcance do kernel é separado da escala da região. No modo global uniforme, posição/pivô não alteram o espalhamento; a interface informa isso.

Campos aceitam vírgula ou ponto; Enter confirma e Esc restaura. A inspeção é opcional: arraste centro, escala ou rotação na prévia. **Reset da transformação** não muda perfil nem intensidade; **Reset do módulo** é separado. As alças e contornos SVG nunca fazem parte do canvas exportado. Não há keyframes nesta versão.

## Processamento e arquivos

Os módulos novos operam em RGB linear no composto opaco, depois dos efeitos da lente e Lens Dirt e antes da vinheta e codificação de saída. A borda é replicada, sem wrap. Alcance é proporcional ao lado curto da saída. Desativado ou intensidade zero preserva exatamente a entrada do módulo. Os kernels da difusão antiga continuam distintos da nova pilha.

CPU é a referência dos novos módulos; WebGL e o apresentador CUDA usam os mesmos algoritmos em FP16. Editar apenas os filtros reutiliza o frame óptico CUDA e atualiza a apresentação. Isso não equivale a executar os módulos dentro da DLL CUDA.

Salvar parâmetros grava esquema `optica-lab/15` com a pilha e suas transformações. Projetos 1–14 continuam sendo importados; sem pilha, recebem uma lista vazia. O projeto não incorpora a mídia original. PNG e MP4 recebem os efeitos; MP4 é renderizado quadro a quadro e não inclui áudio. WebM captura a reprodução e seu ritmo depende do processamento.

## Limites do pacote Windows

Depth de IA é uma estimativa. A transição Cut positiva varia distâncias intermediárias e desfoque, sem fazer o objeto desaparecer por uma rampa de opacidade. Contornos imprecisos do mapa e regiões atrás do objeto continuam limitando o resultado, sobretudo com grande ganho de bokeh. Uma única foto não fornece as regiões ocultas. Não há promessa de contornos perfeitos ou reconstrução do fundo.

Os novos filtros recebem um composto opaco; não são um pipeline de placas VFX transparentes. Camadas A/B/C têm seu contrato próprio e usam WebGL. Nenhuma equivalência comercial, neutralidade fotométrica de todos os efeitos ou validação em todas as câmeras é anunciada.

CUDA foi validado no equipamento disponível com RTX 4090; WebGL foi comparado em Edge/SwiftShader. O pacote é Windows x64. macOS e outros equipamentos exigem validação própria. O limite OSL/OptiX e a evolução dos plugins Blender continuam fora da entrega do aplicativo 1.0.

Relatórios numéricos ficam em `research/`; o registro consolidado do pacote acompanha o instalador.


## Revisão visual do instalador

Instalador escuro fixo, fundo #101312 e ícone verde da aplicação no cabeçalho. A foto lateral foi preservada. A aplicação permanece 1.0.0; esta revisão muda a apresentação do instalador. Compilação exige Inno Setup 6.7 ou superior, que suporta WizardBackColor. Acessibilidade de alto contraste do Windows e /NOSTYLE mantêm prioridade sobre o tema. Instalação e desinstalação isoladas passaram; captura da tela conferida. [Diretivas do tema](https://jrsoftware.org/ishelp/topic_setup_wizardstyle.htm).
