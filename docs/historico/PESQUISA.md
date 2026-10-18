# Pesquisa para um simulador de lentes fotográficas

Consulta em 21/09/2026. Avaliação de READMEs, licenças indicadas pelos repositórios, documentação primária e referências visuais. Isso não é uma auditoria completa de todos os códigos nem uma certificação de exatidão óptica.

## Conclusão técnica

É viável construir o aplicativo, mas “tudo que uma lente tem” exige mais de um modelo. A arquitetura recomendada combina um modelo de prescrição e materiais, PSFs que dependem do campo, foco e comprimento de onda, um compositor com profundidade, e módulos próprios para difração, espalhamento e reflexos internos. O livro [PBRT, Realistic Cameras](https://pbr-book.org/3ed-2018/Camera_Models/Realistic_Cameras) é uma referência útil para geometria composta, pupilas e formação de imagem.

Minha recomendação é usar **DeepLens como candidata principal para pesquisa e geração de PSFs**, **Optiland/RayOptics como referências de análise e validação**, e desenvolver um motor de aplicação de PSFs independente para o produto. Isso é uma decisão de arquitetura derivada da pesquisa, não uma afirmação de que uma dessas bibliotecas já entregue um plugin de pós-produção pronto.

O protótipo entregue usa uma implementação própria menor para validar a experiência e as convenções, sem instalar PyTorch/CUDA ou amarrar o produto à dependência de um framework de pesquisa.

## Avaliação dos projetos enviados

| Projeto | O que oferece e onde ajuda | Decisão / atenção |
|---|---|---|
| [DeepLens](https://github.com/vccimaging/DeepLens) | Óptica diferenciável, análise e PSFs dependentes de campo/profundidade; inclui modelos geométricos e híbridos raio/onda. | Melhor candidata para o laboratório óptico. Apache-2.0. O README também separa extensões internas ainda não públicas: não assumir que toda aceleração anunciada está no código aberto. |
| [AutoLens](https://github.com/AI4Optics/AutoLens) | Projeto de lentes via otimização diferenciável, construído sobre DeepLens. | Útil para criar ou ajustar desenhos ópticos, menos direto para aplicar uma lente a footage. README e arquivo LICENSE indicam Apache-2.0; a API do GitHub retornou NOASSERTION, por isso o arquivo foi consultado. |
| [LensAI](https://github.com/HarrisonKramer/LensAI) | Notebooks de pesquisa de ML para óptica usando Optiland, incluindo modelos substitutos de ray tracing. | Laboratório de pesquisa para acelerar a resposta óptica no futuro. Não é o renderizador completo do app. MIT. |
| [Optical Design Skill](https://github.com/lq1229477734-sys/optical-design-skill) | Conhecimento e automação de Zemax, LightTools, FDTD, COMSOL etc. | Referência metodológica. Não é motor de render nem licença de uso dos simuladores comerciais. Não foi instalado nem suas instruções executadas. Licença do repositório não identificada. |
| [Opt-Sim](https://github.com/Opt-Sim/Opt-Sim) | Demonstrações interativas de lentes simples em HTML/JS. | Útil para ensino e ideias de visualização; insuficiente para simular caráter de lentes compostas em imagens. MIT. |
| [4F Optical Correlator](https://github.com/apetsiuk/4F-Optical-Correlator-Simulation) | Simulação MATLAB de um correlator 4F e propriedades de Fourier. | Apoio ao estudo de propagação e filtragem, não uma base direta de câmera virtual. MIT. |
| [Sequential Optical System Simulation](https://github.com/YiChenLai/Sequential_Optical_System_Simulation) | MATLAB, ray tracing, OPD, PSF, MTF e solução paraxial; apresenta comparações com CODE V. | Boa referência para validação. Portar seria necessário para distribuição sem MATLAB. MIT. O link duplicado foi contado uma vez. |
| [CSCianz Optical-Simulation](https://github.com/CSCianz/Optical-Simulation) | Experimentos educacionais com lentes, espelhos, prismas e fibras. | Não priorizar como motor. GPL-3.0 identificada: avaliar compatibilidade antes de incorporar código em um produto com outra licença. |
| [DCC-Lab RayTracing](https://github.com/DCC-Lab/RayTracing) | Matrizes ABCD, elementos com diâmetros finitos, stops, campo e feixes gaussianos. | Bom para checagens paraxiais; não resolve sozinho aberrações de ordem alta e bokeh de lentes reais. MIT. |
| [Optical-Ray-Tracer](https://github.com/barnabysandeford/Optical-Ray-Tracer) | Experimento de traçado de raios através de lentes e meios. | Referência exploratória; README curto e licença não identificada. Não incorporado. |
| [Simulator of Optical Quality](https://github.com/flp3/Simulator-of-Optical-Quality) | PSF, MTF, difração e aberrações via Zernike. | Útil para testes e futura camada de óptica ondulatória. Apache-2.0. |
| [Hawk Anamorphic Nuke](https://github.com/SlavaSexton/Hawk-Anamorphic-Nuke) | Gizmo com breathing, suavidade nas bordas, CA e vinheta; o autor relata uso de dados capturados. | Referência de calibração e UX. É aplicado depois do DOF e requer nós de distorção 3DEqualizer; não substitui o motor. MIT do gizmo não concede automaticamente direitos sobre dependências. |
| [MyLensArchive](https://github.com/WubinPang/MyLensArchive/blob/master/LensDesignArchiveWubin.pdf) | PDF de 13 páginas com famílias de sistemas, diagramas, especificações e curvas. | Extração textual das 13 páginas e inspeção visual de páginas de lentes fotográficas. As páginas inspecionadas apresentam resultados/layouts, não uma tabela completa pronta de raios, espessuras e vidros. Não presumir que baste copiar uma imagem do desenho para obter uma prescrição. Licença do repo não identificada. |
| [Nuke LensFX_GQ](https://github.com/gquelch/Nuke-LensFX_GQ) | Controlador de conjuntos de lentes que integra ZDefocus e ferramentas externas; permite workflow de camadas. | Excelente referência para conjuntos de presets e controle consistente. Não é um novo traçador óptico. Licença não identificada. |

“Licença não identificada” não significa domínio público. Na versão entregue, somente a prescrição explicitamente MIT do LensSim foi incorporada, junto com o aviso original.

## Novas referências encontradas

- [LensSim](https://github.com/yumcyaWiz/LensSim): C++ com ferramentas Python para lentes fotográficas, PSF geométrica, exemplos espectrais e flare. MIT. A prescrição pública Double-Gauss 50 mm foi usada no protótipo; seu arquivo fornece índices `nd`, mas não os vidros/Abbe necessários para uma dispersão fiel.
- [RayOptics](https://github.com/mjhoptics/ray-optics): análise geométrica de sistemas formadores de imagem, aberrações e importação de formatos ópticos. BSD-3-Clause. Boa referência independente para comparar focos, spots e sinais.
- [Optiland](https://github.com/optiland/optiland): plataforma de projeto e análise óptica, com materiais, toleranciamento e opções diferenciáveis. MIT. Vale comparar com DeepLens antes de escolher uma dependência central.
- [ComfyUI Optical Realism](https://github.com/skatardude10/ComfyUI-Optical-Realism): referência adjacente de fluxo RGB+depth e pós-processamento. Não foi auditado nem incorporado; não usar o nome “physics-based” como evidência suficiente de correspondência a uma lente medida.
- [Blackhole-rt](https://github.com/space55/blackhole-rt): referência exploratória encontrada na pesquisa de renderização/flare. Nenhuma dependência ou código desse projeto foi incorporado.

## Leitura das referências visuais

As imagens fornecidas mostram Higx Optics, uma seleção Double-Gauss 50 mm f/2, controles de sensor/filmback/foco e seções de aberrações, íris, filtro e profundidade. Elas orientam a organização dos controles; não revelam o algoritmo interno. O vídeo do X não pôde ser reproduzido pelo acesso de pesquisa, portanto não foi usado para inferir desempenho ou implementação.

O artigo [Analyzing optic and filmic effects in WebGL](https://medium.com/@josecastrovaron/analyzing-optic-and-filmic-effects-in-webgl-47abe74df74e) foi localizado como referência de efeitos em tempo real. A decisão do motor foi baseada nas fontes primárias de óptica acima; técnicas visuais em WebGL não provam correspondência a uma prescrição real.

## Fenômenos que precisam existir no produto final

| Fenômeno | Modelo necessário | Estado no protótipo |
|---|---|---|
| Desfoque e bokeh | Pupila/stop, foco, profundidade, PSF espacial | Implementado geometricamente, com grade e camadas aproximadas |
| Coma, aberração esférica, astigmatismo, curvatura de campo | Propagação pela prescrição, análise por campo e foco | Surgem da geometria; ainda sem medição e controles físicos independentes |
| Cat-eye e vinheta mecânica | Oclusão da pupila pelos elementos e barril | Recorte pelos diâmetros implementado; barril detalhado e radiometria completa pendentes |
| Swirl de lentes antigas | Aberrações e orientação tangencial das PSFs fora do eixo | A base varia com o campo; controle adicional é criativo e não calibrado |
| CA lateral e longitudinal | Dispersão real dos vidros; espectro e resposta do sensor | Proxy de Cauchy explícito, sem vidros reais |
| Fringe | CA + captura/saturação/espalhamento conforme causa | Proxy cromático; não é modelo completo de sensor |
| Difração / estrelas de diafragma | Pupila complexa, OPD, propagação e amostragem espectral | Pendente |
| Difusão / veiling glare | PSF/BSDF de espalhamento medida ou parametrizada | Mistura de halo aproximada, com energia normalizada |
| Ghosts / flare | Caminhos refletidos entre interfaces, coatings, luz fora do quadro | Pendente |
| Anamórfica real | Superfícies cilíndricas/anamórficas e pupila específica | Squeeze de PSF criativo; modelo óptico pendente |
| Distorção / breathing | Mapeamento do raio principal e posição dos grupos móveis | Pendente; PSF verde recentrada |

Halation de película e grain são fenômenos de captura/suporte, não propriedades da lente; devem ser módulos separados. “Diffusion” óptica também não é um modelo generativo de difusão.

## Biblioteca de lentes clássicas

Começar por famílias com prescrições abertas e rastreáveis: Double-Gauss, Cooke triplet, Tessar, Petzval e uma teleobjetiva. Uma família óptica não identifica automaticamente um produto comercial específico. Para anunciar uma Helios 44-2, por exemplo, será necessário obter prescrição/material compatível e/ou calibrar um exemplar, registrando foco, abertura, sensor e variação entre unidades.

Cada preset final deve declarar um nível: **prescrição documentada**, **medido/calibrado** ou **inspiração artística**. A biblioteca atual contém uma prescrição documentada e três estudos artísticos explicitamente rotulados; não contém réplicas comerciais validadas.

## Limite fundamental da pós-produção

Uma imagem RGB já desfocada ou clipada não contém a cena original. RGB+Z permite uma aproximação de reimagem, mas não fornece fundo oculto, radiância fora do quadro nem espectro completo. Para resultados melhores: entrada linear HDR, overscan, camadas/deep quando disponíveis e depth confiável. IA de profundidade pode ajudar, mas produz estimativas, não geometria medida.

O próximo critério de sucesso deve ser uma comparação lado a lado entre imagens de bancada reais e renders, em diferentes focos, aberturas e campos. Um visual convincente isolado não valida a física.
