# Optica Lab 0.3 — depth, aberração cromática e MP4

Abra a mídia e expanda **Profundidade**. Escolha Depth Anything V2 Large, Depth Anything 3 Base, MoGe 2 ou DVD 1.1 e clique em **Gerar depth da mídia**. A inferência é local, em processo separado, com progresso e cancelamento. Os primeiros downloads de pesos podem demorar. Esta instalação já gerou mapas com os quatro modelos na RTX 4090.

Para vídeo, o app decodifica todos os frames (até 3000 frames e 500 MB), calcula mapas com até 640 pixels no maior lado e armazena a sequência no diretório `cache`. A mesma normalização 1–99% é aplicada a toda a sequência. Os mapas são relativos, não metros calibrados; os controles próximo/distante definem a escala usada pelo desfoque. A interface usa os timestamps decodificados e carrega mapas float em textura R16F. PNG importado continua sendo mapa estático em 8 bits. Alterar sliders da lente não executa a IA novamente.

DVD executa janelas de 21 frames com sobreposição de 5 e alinhamento afim. Usa o motor oficial EnVision/DVD e os pesos DVD 1.1, com uma adaptação nativa da lógica indicada no nó ComfyUI. Não instala nem altera seu ComfyUI. DA2, DA3 e MoGe usam inferência monocular por frame nesta versão; a escala global não elimina variações temporais do próprio modelo. Não foi integrada a modalidade multiview/streaming do DA3. Oclusões do desfoque ainda são aproximadas.

**Caráter criativo** contém três controles novos: CA lateral vermelho/ciano, CA lateral azul/amarelo e CA longitudinal (diferença de foco RGB). São modificadores artísticos independentes da dispersão Cauchy da prescrição. Zero desativa cada modificador. A dispersão existente continua disponível; não há calibração por catálogo de vidros.

Para exportar vídeo, use **Exportar vídeo MP4** na barra de reprodução. Escolha resolução e FPS antes. O app busca, renderiza e envia cada quadro ao FFmpeg/H.264, com progresso e cancelamento. Não depende da velocidade do Play. Resoluções 1920/3840/4096 referem-se ao maior lado mantendo a proporção; fontes menores são ampliadas. Dimensões ímpares recebem padding de um pixel para H.264. A saída atual é sem áudio e de 8 bits. Exportar frame PNG e Gravar WebM são operações separadas. WebM continua sendo captura durante a reprodução.

Foi adicionado dithering espacial fixo na conversão final para 8 bits, para suavizar contornos de quantização sem mudar o ruído a cada frame. Isso não garante eliminação de todos os artefatos do atlas de 64 amostras ou dos presentes na mídia.

A prévia de vídeo agora usa 64 amostras e AA 2×, inclusive nas resoluções menores. A exportação continua usando 64 amostras e AA 1× na resolução final para limitar memória.

Validação: 20 testes existentes e 4 testes de jobs passaram; DA2/DA3/MoGe/DVD produziram mapas finitos não constantes em uma imagem fornecida; DA2 e DVD produziram 12 mapas para um clipe de 12 frames. O teste da interface carregou o mapa 6 em 0,25 s. MP4 320×180 e 3840×2160 confirmados pelo ffprobe: H.264, 24 fps, 12 frames, 0,5 s. Material sintético, sem garantia de equivalência ao vídeo original do usuário. DVD inicialmente encontrou erro 1455 de memória virtual com outras inferências; passou isoladamente. O app permite um job de inferência/exportação ativo por servidor.

Os motores estão no ambiente isolado `work/depth-env`; DA3, MoGe e DVD referenciam clones em `work`. Não mover apenas a pasta do app para outro computador sem instalar esse runtime. Os pesos ficam no cache Hugging Face local. Arquivos de mídia/cache não são enviados a serviços externos. Os downloads de pesos usam os repositórios oficiais.

Fontes e licenças:
- https://github.com/DepthAnything/Depth-Anything-V2 — pesos Large: CC-BY-NC-4.0; verificar antes de uso comercial.
- https://github.com/ByteDance-Seed/Depth-Anything-3 — Base: Apache-2.0.
- https://github.com/microsoft/MoGe — código MIT; modelo selecionado: Ruicheng/moge-2-vitl-normal.
- https://github.com/EnVision-Research/DVD — Apache-2.0; base Wan2.1 e pesos FayeHongfeiZhang/DVD.
- https://github.com/chettilaura/ComfyUI-DVD-Depth — referência de integração indicada pelo usuário.

O editor interativo da geometria do vidro ainda não faz parte desta versão.

Teste cromático GPU: ativar CA alterou a imagem; voltar os controles a zero restaurou exatamente os pixels de referência.
