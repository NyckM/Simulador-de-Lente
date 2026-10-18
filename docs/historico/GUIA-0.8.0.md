# Optica Lab 0.8.0 — Ray tracing Vulkan

## O que roda em Vulkan

O novo motor nativo C++ executa um compute shader por raio. Ele calcula interseções analíticas com as superfícies esféricas/planares, corte pelos diâmetros dos vidros e pelo diafragma, refração de Snell, transmissão de Fresnel, suavidade de bordas, dispersão criativa e coating idealizado. Campos e canais são enviados em lotes, com amostragem fixa. Não é uma máscara nem uma chamada simulada: os testes executaram a biblioteca Vulkan na RTX 4090.

O traçado alimenta o atlas usado na prévia e na exportação GPU. A organização do atlas, a interpolação espacial, a convolução da imagem e a composição RGB + depth não foram migradas integralmente para Vulkan. O renderer da imagem permanece WebGL; a referência de render CPU permanece separada. A biblioteca usa compute convencional com superfícies analíticas ordenadas, sem VK_KHR_ray_tracing_pipeline, BVH ou aceleração RTX de interseções. Vulkan compute é uma API real de GPU; não equivale por si só ao pipeline de hardware RT.

## Usar

Recarregue com Ctrl+F5. Em Amostragem e altas luzes → Traçado dos vidros, escolha Vulkan automático ou CPU referência. O aviso do app informa o motor efetivamente usado. O modo Vulkan também permite fallback para CPU se o dispositivo ou a biblioteca não estiver disponível. A versão distribuída inclui native/vulkan/bin/optica_vk.dll e lens.spv; o usuário precisa de Windows x64 e driver Vulkan compatível, sem instalar o SDK para executar esses arquivos.

A opção de motor faz parte da configuração salva e dos perfis pessoais. O foco move a projeção dos raios sem recalcular o atlas; mudanças nos vidros, abertura, campo e parâmetros que afetam a transmissão recalculam os raios. Aumentar Quality altera as amostras do atlas e da imagem, não apenas a seleção do motor.

## Medições nesta máquina

Benchmark local, RTX 4090, mediana de três execuções, Double-Gauss aberta, campo 9 × 9 e 128 amostras: CPU 4.428 ms; Vulkan 870 ms; ganho 5,09× na construção completa do atlas. Campo 5 × 5: CPU 1.432 ms; Vulkan 273 ms; ganho 5,25×. Ambos os caminhos usam o agrupamento de pupila otimizado nesta versão, que substitui varreduras por célula por somas ponderadas vetorizadas.

Para 262.144 raios, a chamada de traçado inteira, incluindo preparação/transferência/leitura, mediu 1.399 ms na CPU e 69 ms em Vulkan. O dispatch GPU isolado foi 2,15 ms; não deve ser apresentado como custo completo do app. Esses números não são FPS de vídeo, não medem 4K e não garantem o mesmo desempenho em outra máquina ou configuração. O JSON de benchmark acompanha o pacote.

## Validação

Comparação CPU/GPU para centro, fora de eixo, distância curta, íris poligonal, rotação, suavidade, dispersão e coating. Limites dos testes: até um raio classificado diferentemente entre 8.192; erro absoluto de posição ≤ 0,0005 mm, direção ≤ 0,00001 e transmissão ≤ 0,002. Repetição dos mesmos dados deve ser idêntica. 66 testes passaram, incluindo seleção CPU/fallback e agrupamento ponderado. As regressões do shader de foco/depth e de highlights também passaram. Shader validado com spirv-val e testes executados com VK_LAYER_KHRONOS_validation.

## Desenvolvimento e limites

Fontes e Build.ps1 estão em native/vulkan. Compilar exige CMake, Visual Studio C++ x64 e SDK Vulkan com glslc. A DLL é compilada com runtime C++ estático. A biblioteca mantém dispositivo, pipeline e buffers para reutilização; um lock serializa os dispatches. Os lotes limitam a memória temporária, mas mapas/campos muito densos continuam tendo custo.

O motor ainda é experimental: migração do renderer de imagem, apresentação nativa e processamento de vídeo inteiro permanecem trabalho separado. Os limites anteriores de depth por planos, fundo oculto não reconstruído, atlas interpolado e prescrições comerciais não calibradas continuam. Vulkan não corrige automaticamente esses limites nem garante ausência de flicker em material real.

Documentação técnica: https://docs.vulkan.org/guide/latest/extensions/ray_tracing.html
