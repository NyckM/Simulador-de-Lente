# Bruxosdovfx Desfoque — Resolve OFX 0.2.1

Plugin nativo Windows x64, categoria Bruxosdovfx. Recebe Source e Depth externo; não gera depth e não depende do standalone, Python ou servidor.

## Instalação

Feche o Resolve e execute **Bruxosdovfx-Desfoque-Resolve-0.2.1-Setup-Windows-x64.exe**. Instala com administrador em C:\Program Files\Common Files\OFX\Plugins. Alternativamente, copie o bundle inteiro para essa pasta. Em Contents/Win64, mantenha **BruxosdovfxDesfoque.ofx, bruxos_ofx_cuda.dll e bruxos_layers_cuda.dll juntos**. Reinicie o Resolve.

## Depth Cut com fundo preenchido

No Fusion, conecte imagem a Source, mapa a Depth e saída a MediaOut. Use Loader/MediaIn sincronizado e alinhado; preserve depth como dados sem LUT. Ative Usar depth, ajuste Canal/Gain/Bias e limites próximo/distante: por padrão branco próximo e preto distante. Foco (m) usa essa escala.

Escolha **Depth Cut** ou **Depth Cut + Eclipsed bokeh** em Composição de profundidade. Ajuste Cut e, nos novos controles de contorno em pixels, **Grow (px)** e **Feather (px)**. O fundo é preenchido com seus próprios pixels próximos antes do desfoque; o primeiro plano tem cor/profundidade estendidas na borda. Isso evita que o fundo desfocado tome a cor do objeto. O preenchimento é uma aproximação do fundo oculto.

Grow/Feather em pixels maiores que zero ativam o novo motor; zero preserva o comportamento anterior. Cut, Grow e Feather ficam em Mapa de profundidade > Depth Cut. Com **Depth em metros (mapa / Cut)** ativado, o mapa após Gain/Bias e o Cut usam metros, e cada lado conserva sua profundidade no desfoque. Desativado, Cut permanece em 0–1 após Gain/Bias e inversão, por compatibilidade. Grow e Feather sempre usam pixels. A transição antiga do corte continua normalizada e separada da suavidade em pixels. A opção **Depth da Source se pin vazio**, desligada por padrão, permite ler o Canal da Source quando o mapa externo estiver vazio e Usar depth estiver ativado.

O Resolve continua com apenas Source e Depth; não expõe A/B/C. Na página Color, entradas auxiliares dependem da página/versão. Consulte **LAYERS-DEPTH.md** para unidades, preenchimento, oclusão e limites.

## Validação 0.2.1

Host OFX: **43 checks com CUDA e 42 sem DLL CUDA**, 68 parâmetros e três clips incluindo Output. Testados Depth Cut/Grow/Feather, execução do novo kernel, fallback do canal da Source, HDR, foco, iris, 8/16/32 bits, maps RGBA/Alpha, alpha desfocado, stride negativo, origem deslocada e liberação de buffers. Diferença CPU/CUDA base: 0,00000024.

**As funções 0.2.1 não foram exportadas dentro do Resolve real.** Na edição anterior, o carregamento do nó Source/Depth foi conferido no Resolve Studio 21.0.3.7 headless, mas a exportação falhou também na composição de controle. Esta é uma edição para teste; não se afirma validação no Resolve Free ou em outras versões. Consulte validation/host-tests.json.

## Lente e render

295 perfis numéricos; diafragma físico, lâminas, rotação, suavidade, foco, sensor, edição de uma superfície, Swirl, coma, anamórfico, aberrações esféricas, Impression positivo/negativo, apodização, anel, CA, distorção, highlights, exposição, mistura e Shimmer procedural. Nomes comerciais indicam estudos/reconstruções, sem calibração ou certificação dos fabricantes. Metadados em data/.

Draft/Fast/Medium/High/Very High/Extreme usam 32/64/128/256/512/1024 amostras. Automático usa CUDA e recorre à CPU; CPU funciona sem as DLLs CUDA. Runtime incluído, driver NVIDIA externo. Atlas óptico calculado em CPU e reutilizado. Acesso CUDA sincronizado. Limites: 8192 pixels por eixo, 17 MP por frame; pirâmides do novo motor limitadas a 3 GB. Use Proxy para camadas com muitas fatias.

IDs e parâmetros antigos foram preservados. Sem camadas e com Grow/Feather em pixels zerados, usa-se o caminho anterior. Restaurar perfil repõe a lente e o caráter criativo sem desconectar depth/camadas ou alterar o foco.

Código e testes estão em native/ae/, native/ofx/ e native/nuke/. Os geradores históricos não devem ser executados para reconstruir esta edição: os motores gerados têm correções específicas da ABI nativa. Use os scripts build.cmd de cada integração. SDKs são dependências de desenvolvimento separadas, não incluídas no pacote.

## Depth Cut 0.2.1

Cut, Grow (px) e Feather (px) agora estão reunidos na seção Mapa de profundidade. **Depth em metros (mapa / Cut)** lê distâncias métricas após Gain/Bias e usa Cut em metros. Mais perto que Cut é primeiro plano; Gain negativo inverte o sentido dos valores de entrada. Para mapas relativos 0–1, deixe a opção desligada e mantenha a direção/limites do mapa. Os mapas de A/B/C compartilham essa unidade quando presentes. Isso não estima escala métrica de mapas de IA.

Exemplo: mapa com sujeito em 2 m e fundo em 8 m, Cut em 3 m, Grow em 4 px e Feather em 1 px. Anime Foco (m) entre 2 e 8. O primeiro plano conserva sua própria profundidade ao ser estendido além da borda. Os IDs persistidos foram preservados apesar da reorganização da interface.
