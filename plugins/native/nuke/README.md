# Bruxosdovfx Desfoque — Nuke OFX 0.2.1 beta

Plugin nativo Windows x64. Imagem, depth externo e camadas RGBA com profundidade própria. Não requer standalone, Python externo ou servidor e não gera mapas por IA.

## Instalação

Feche o Nuke e execute **Bruxosdovfx-Desfoque-Nuke-0.2.1-Setup-Windows-x64.exe**. Instala com administrador em C:\Program Files\Common Files\OFX\Nuke. Alternativamente, copie o bundle inteiro para esse diretório ou configure OFX_PLUGIN_PATH para seu diretório antes de abrir o Nuke. Mantenha **BruxosdovfxNuke.ofx, bruxos_nuke_cuda.dll e bruxos_layers_cuda.dll juntos**, em Contents/Win64. Não copie apenas o OFX para .nuke. Reinicie o Nuke.

## Entradas do nó

**Source, Depth, LayerA, LayerADepth, LayerB, LayerBDepth, LayerC, LayerCDepth e GlitterMatte**; as auxiliares são opcionais. O rótulo é Bruxosdovfx Desfoque Nuke, categoria Bruxosdovfx. O ID é exclusivo desta integração.

Conecte Source em luz linear. Para depth.Z de EXR, use Shuffle para levá-lo a RGB ou Alpha e conecte a Depth; não há leitura automática de Z. Use Read Raw para maps, com enquadramento e tempo alinhados. Ative Usar depth, escolha Canal e ajuste Gain/Bias/Inverter e os limites: branco próximo, preto distante por padrão.

A ordem é Source→A→B→C. **Profundidade em metros** usa distâncias positivas; zero/negativos acompanham o foco. Maps por camada substituem a distância constante. A como glitter aceita textura RGBA e matte; C como vidro refrata Source/A/B. Veja **LAYERS-DEPTH.md** para unidades, gate alpha acima de 1, normalização e amostragem por pupila.

O canvas de saída segue Source. Use Reformat para o mesmo enquadramento; camadas fora do canvas são cortadas. Buffers com bounding box deslocado/stride negativo são respeitados. Entrada/saída RGBA: canais auxiliares e deep não são processados; copie-os da fonte após o efeito se necessário. Use Proxy no host para acelerar a prévia.

## Validação 0.2.1 beta

**O Nuke não está instalado nesta máquina.** Interface, carregamento e render no Nuke real permanecem sem validação; não se afirma compatibilidade com versão específica.

Host OFX: **58 checks com CUDA e 56 sem DLL CUDA**, 78 parâmetros e dez clips incluindo Output. HDR, foco, iris, depth, mapas RGBA/Alpha com formatos mistos/stride negativo, entradas A/B/C, glitter/matte, vidro, ROI, Depth Cut/Grow/Feather e liberação de imagens passaram. Diferença CPU/CUDA base: 0,00000024. O novo kernel executou na RTX 4090. Consulte validation/host-tests.json e o teste visual sintético compartilhado.

Referência de instalação: https://learn.foundry.com/nuke/content/comp_environment/configuring_nuke/loading_ofx_plugins.html

## Lente e render

295 perfis numéricos; diafragma físico, lâminas, rotação, suavidade, foco, sensor, edição de uma superfície, Swirl, coma, anamórfico, aberrações esféricas, Impression positivo/negativo, apodização, anel, CA, distorção, highlights, exposição, mistura e Shimmer procedural. Nomes comerciais indicam estudos/reconstruções, sem calibração ou certificação dos fabricantes. Metadados em data/.

Draft/Fast/Medium/High/Very High/Extreme usam 32/64/128/256/512/1024 amostras. Automático usa CUDA e recorre à CPU; CPU funciona sem as DLLs CUDA. Runtime incluído, driver NVIDIA externo. Atlas óptico calculado em CPU e reutilizado. Acesso CUDA sincronizado. Limites: 8192 pixels por eixo, 17 MP por frame; pirâmides do novo motor limitadas a 3 GB. Use Proxy para camadas com muitas fatias.

IDs e parâmetros antigos foram preservados. Sem camadas e com Grow/Feather em pixels zerados, usa-se o caminho anterior. Restaurar perfil repõe a lente e o caráter criativo sem desconectar depth/camadas ou alterar o foco.

Código e testes estão em native/ae/, native/ofx/ e native/nuke/. Os geradores históricos não devem ser executados para reconstruir esta edição: os motores gerados têm correções específicas da ABI nativa. Use os scripts build.cmd de cada integração. SDKs são dependências de desenvolvimento separadas, não incluídas no pacote.

## Depth Cut 0.2.1

Cut, Grow (px) e Feather (px) agora estão reunidos na seção Mapa de profundidade. **Depth em metros (mapa / Cut)** lê distâncias métricas após Gain/Bias e usa Cut em metros. Mais perto que Cut é primeiro plano; Gain negativo inverte o sentido dos valores de entrada. Para mapas relativos 0–1, deixe a opção desligada e mantenha a direção/limites do mapa. Os mapas de A/B/C compartilham essa unidade quando presentes. Isso não estima escala métrica de mapas de IA.

Exemplo: mapa com sujeito em 2 m e fundo em 8 m, Cut em 3 m, Grow em 4 px e Feather em 1 px. Anime Foco (m) entre 2 e 8. O primeiro plano conserva sua própria profundidade ao ser estendido além da borda. Os IDs persistidos foram preservados apesar da reorganização da interface.
