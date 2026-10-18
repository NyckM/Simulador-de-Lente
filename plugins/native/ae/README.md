# Bruxosdovfx Desfoque — After Effects 0.2.1

Plugin nativo Windows x64 (.aex), em **Effect > Bruxosdovfx > Bruxosdovfx Desfoque**. Recebe imagem, depth externo e camadas; não precisa do standalone, Python ou servidor. Não gera mapas de IA.

## Instalação

Feche o After e execute **Bruxosdovfx-Desfoque-AE-0.2.1-Setup-Windows-x64.exe**. Instala em Adobe MediaCore e pede administrador. Alternativamente, copie **BruxosdovfxDesfoque.aex, optica_cuda.dll e bruxos_layers_cuda.dll juntos** para uma pasta Bruxosdovfx em Support Files/Plug-ins. Use as bibliotecas deste pacote, sem substituí-las pelo DLL do standalone. Reinicie o After.

## Conectar as entradas

Aplique à imagem. Em Mapa de profundidade, selecione **Camada Depth**, ative Usar depth e escolha Canal/Gain/Bias/Inverter. Branco é próximo e preto distante, conforme os limites em metros; Foco (m) usa essa escala. Sem mapa, Distância sem depth define o plano da imagem. A nova opção de usar o canal da própria imagem quando a camada estiver vazia fica desligada por padrão.

Em **Camadas A / B / C**, selecione Layer A/B/C e, opcionalmente, Depth Layer A/B/C. A ordem de composição é imagem→A→B→C. Ative **Layer A is Glitter** e selecione **Glitter Matte** para cintilação nos discos. Ative **Layer C is Distortion** para vidro que refrata tudo atrás. Cada camada tem profundidade própria. Use inputs/precomposições alinhados à fonte, com a mesma duração; mapas devem conservar valores como dados. Evite referências circulares.

Consulte **LAYERS-DEPTH.md** para unidades, alpha acima de 1, normalização, refração e os novos Grow/Feather em pixels. Use Animation > Save Animation Preset para guardar configurações .ffx.

## Validação 0.2.1

Host compilado contra o SDK Adobe: **2619 assertions**, 95 parâmetros; SmartFX float32 com as sete entradas extras, maps, glitter, matte, vidro, Depth Cut e liberação de pixels. Caminhos clássico/SmartFX 8/16 bpc, HDR, alpha, pixels não quadrados e foco/iris/depth passaram. Diferença CPU/CUDA da fixture base: 0,00000024. Diagnóstico confirmou execução do novo kernel CUDA na RTX 4090.

Motor compartilhado testado separadamente para oclusão dentro dos discos, ordem fixa, alpha parcial, glitter e vidro; consulte validation/host-tests.json. **As novas funções 0.2.1 ainda não foram testadas dentro do After real.** O render no After Effects Beta 27.0 em 32 bpc/OCIO foi validado na edição anterior, não serve como validação das camadas novas. Multi-Frame Rendering não é anunciado. Nem todos os 295 perfis foram renderizados individualmente no host.

## Lente e render

295 perfis numéricos; diafragma físico, lâminas, rotação, suavidade, foco, sensor, edição de uma superfície, Swirl, coma, anamórfico, aberrações esféricas, Impression positivo/negativo, apodização, anel, CA, distorção, highlights, exposição, mistura e Shimmer procedural. Nomes comerciais indicam estudos/reconstruções, sem calibração ou certificação dos fabricantes. Metadados em data/.

Draft/Fast/Medium/High/Very High/Extreme usam 32/64/128/256/512/1024 amostras. Automático usa CUDA e recorre à CPU; CPU funciona sem as DLLs CUDA. Runtime incluído, driver NVIDIA externo. Atlas óptico calculado em CPU e reutilizado. Acesso CUDA sincronizado. Limites: 8192 pixels por eixo, 17 MP por frame; pirâmides do novo motor limitadas a 3 GB. Use Proxy para camadas com muitas fatias.

IDs e parâmetros antigos foram preservados. Sem camadas e com Grow/Feather em pixels zerados, usa-se o caminho anterior. Restaurar perfil repõe a lente e o caráter criativo sem desconectar depth/camadas ou alterar o foco.

Código e testes estão em native/ae/, native/ofx/ e native/nuke/. Os geradores históricos não devem ser executados para reconstruir esta edição: os motores gerados têm correções específicas da ABI nativa. Use os scripts build.cmd de cada integração. SDKs são dependências de desenvolvimento separadas, não incluídas no pacote.

## Depth Cut 0.2.1

Cut, Grow (px) e Feather (px) agora estão reunidos na seção Mapa de profundidade. **Depth em metros (mapa / Cut)** lê distâncias métricas após Gain/Bias e usa Cut em metros. Mais perto que Cut é primeiro plano; Gain negativo inverte o sentido dos valores de entrada. Para mapas relativos 0–1, deixe a opção desligada e mantenha a direção/limites do mapa. Os mapas de A/B/C compartilham essa unidade quando presentes. Isso não estima escala métrica de mapas de IA.

Exemplo: mapa com sujeito em 2 m e fundo em 8 m, Cut em 3 m, Grow em 4 px e Feather em 1 px. Anime Foco (m) entre 2 e 8. O primeiro plano conserva sua própria profundidade ao ser estendido além da borda. Os IDs persistidos foram preservados apesar da reorganização da interface.
