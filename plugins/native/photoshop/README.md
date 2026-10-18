# Simulador de Desfoque da Bruxosdovfx — Photoshop

Beta 0.1.1 · Windows x64 · Photoshop 2024 (25.0) ou mais recente

Esta edição é um painel UXP com motor óptico nativo independente. Não precisa do aplicativo standalone, Python ou modelos de inteligência artificial. Recebe o mapa de profundidade de uma camada do documento; não gera depth.

## Carregar a beta

1. Extraia este ZIP para uma pasta permanente. Mantenha a pasta `plugin` inteira, inclusive `engine`.
2. Instale o **UXP Developer Tool** pelo Creative Cloud Desktop. Habilite **Developer Mode** no UXP Developer Tool e em Photoshop > Preferências > Plugins. Reinicie o Photoshop se necessário.
3. No UXP Developer Tool, clique em **Add Plugin**, selecione `plugin/manifest.json` e clique em **Load** com o Photoshop aberto.
4. Abra o painel **Desfoque da Bruxosdovfx** no menu Plugins do Photoshop.
5. Clique em **Iniciar motor**. O Photoshop pode pedir consentimento para executar o motor nativo; esse diálogo pertence ao Photoshop. Se o botão não iniciar, abra manualmente `plugin/engine/BruxosPhotoshopEngine.exe`. O motor funciona em segundo plano, sem janela.

Este ZIP é a distribuição de desenvolvimento. Não é um instalador CCX ou filtro 8bf. Depois de validar no Photoshop, o UXP Developer Tool pode empacotar a pasta `plugin` em CCX: menu de ações do plugin > **Package**. Não basta renomear este ZIP para CCX.

Referências Adobe: [carregar e instalar UXP](https://developer.adobe.com/uxp/guides/how-to/distribution/install/), [empacotar com UDT](https://developer.adobe.com/uxp/guides/how-to/distribution/package/).

## Usar

- Abra a fotografia. Escolha sua camada em **Imagem**.
- Coloque seu mapa de profundidade como outra camada no mesmo documento, alinhada e no mesmo tamanho da fotografia. Pode deixá-la oculta. Escolha-a em **Mapa de profundidade**.
- Em **Mapa de profundidade**, use **Usar depth**, selecione o canal e ajuste as distâncias. Por padrão, branco é próximo e preto é distante. **Inverter mapa** troca esse sentido.
- Se não tiver depth, desative **Usar depth** e ajuste **Distância sem depth**.
- Busque uma lente, ajuste o foco em metros e o diafragma em f/. Abra os grupos de efeitos e qualidade conforme necessário.
- Clique em **Aplicar em nova camada**. O resultado aparece como uma camada de pixels; a imagem original permanece intacta. Compare desligando a visibilidade da camada resultante. Cada aplicação cria uma nova camada e uma única entrada no histórico.
- Para outra aplicação, continue usando a camada original como fonte. O painel conserva essa escolha enquanto o documento permanece aberto. O motor recusa aplicar se o documento mudar durante o cálculo.
- Dê um nome em **Nome do meu perfil** e clique em **Salvar meu perfil**. Pode salvar até 100 configurações próprias. Salvar com o mesmo nome atualiza aquela configuração.
- **Restaurar lente** devolve os parâmetros ópticos padrão de uma lente da biblioteca, preservando foco e depth. Em um perfil próprio, devolve a configuração salva completa.
- Ao terminar, use **Encerrar motor**. Ele também encerra após 30 minutos sem receber pedidos.

## Controles desta edição

295 presets de lentes, incluindo ZEISS e Helios; ajuste de superfície, curvatura, espaçamento, diâmetro e índice; foco, sensor, diafragma, lâminas e rotação; depth slicing/cut e oclusão de bokeh; swirl, coma, anamórfico, aberração esférica, Impression positivo/negativo, apodização, anel, aberração cromática, distorção, exposição e mistura; Shimmer com profundidade própria; seis níveis de qualidade e três grades ópticas; CUDA automático com fallback em CPU, ou CPU explícita.

Os valores comerciais são referências de prescrições e reconstruções numéricas, não medições certificadas de cada exemplar comercial. Consulte `data/SOURCE-LensVisualizer.md` e os metadados das prescrições.

## Limites e estado de validação

- O Photoshop não está instalado na máquina de desenvolvimento. A interface e a integração Imaging/UXP ainda **não foram testadas dentro do Photoshop**. Esta entrega é uma beta para validação no host.
- Foram aprovadas 23 verificações reais do motor com CUDA disponível, 23 com o DLL CUDA ausente (fallback em CPU), e 25 verificações de protocolo, buffers, interface e histórico com APIs simuladas. A diferença máxima CUDA/CPU no caso testado foi inferior a 0,000002 nos casos testados.
- Limite desta beta: **8.388.608 pixels por documento**, até 8192 pixels por lado. 3840 × 2160 cabe; fotografias maiores precisam ser reduzidas em uma cópia antes de usar. Não há render em tiles nesta edição.
- O resultado é uma camada rasterizada. Não é um Smart Filter; mudar parâmetros exige aplicar novamente. Perfis salvos ficam nos dados locais do plugin, não incorporados ao PSD.
- Gotas, Dirty Lens, geração de depth, vídeo e inspeção interativa dos vidros do standalone não fazem parte desta primeira edição para Photoshop.
- NVIDIA CUDA é opcional e depende do driver NVIDIA. CPU funciona sem CUDA; as qualidades mais altas aumentam o custo do cálculo. Não há promessa de velocidade superior ao WebGL em todos os casos.
- O motor aceita somente conexões locais em `127.0.0.1:8769`, não envia as imagens para a internet e não recebe caminhos de arquivo. Outro programa ocupando essa porta impede a conexão. Não abra a porta no firewall para redes externas.

## Diagnóstico e exemplo

A pasta `exemplo` contém uma imagem e seu depth alinhado. Abra `imagem.png`, coloque `depth.png` como camada e experimente foco próximo em 0,8 m e distante em 10 m. Os arquivos em `validacao` registram os testes realizados; imagens de render do motor não constituem provas de render dentro do Photoshop.

Código da integração: `outputs/OpticaLab/native/photoshop`. Reconstrução: execute `generate.py` a partir de OpticaLab, depois `build.cmd`. Os motores ópticos compartilhados ficam em `native/ae`; nenhum SDK Adobe é redistribuído neste pacote.

## Correção 0.1.1

O depth agora recebe um refinamento local nas transições entre duas superfícies planas quando a cor fornece evidência para alinhar a borda. Isso evita que uma borda suavizada do depth envie cores do personagem para camadas desfocadas. Gradientes contínuos e bordas ambíguas são preservados. Não é uma reconstrução de geometria oculta; um mapa desalinhado ou muito impreciso ainda pode produzir artefatos. A correção foi testada nos motores, ainda sem validação no host Photoshop.

Para atualizar de 0.1.0: encerre o motor, substitua a pasta `plugin` antiga pela desta versão, e no UXP Developer Tool use Unload e Load. O ID do plugin permanece igual para manter os perfis salvos.
