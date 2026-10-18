# Arquitetura e continuação

## Profundidade e oclusão — requisitos atuais

O material fornecido pelo usuário estabelece que foco por profundidade e ordem de composição são controles distintos. [DEPTH-E-OCLUSAO.md](DEPTH-E-OCLUSAO.md) registra o contrato, as lacunas verificadas na GPU/CPU e as cenas de validação. A implementação atual ainda não oferece composição A/B/C, depth slicing automático ou Depth Cut com preenchimento de fundo. Esses requisitos orientam a próxima evolução do compositor.

## Atualização 0.2

O atlas em `optics/preview.py` reutiliza o traçado da referência, comprimindo feixes em células de pupila. `web/gpu.js` agora contém matemática de aplicação da PSF e modificadores criativos; portanto a afirmação histórica abaixo de que a UI não contém lógica óptica só se aplica à versão 0.1. Essa duplicação CPU/GLSL é experimental: ainda não existe equivalência de saída nem núcleo binário para plugins. O backend de produção deverá consolidar os dois caminhos e compartilhar parâmetros e testes.

Vídeo é decodificado no navegador, com reprodução por callbacks de frame; frames não trafegam por HTTP. RGBA16F e mipmaps em luz linear ajudam a cobertura de amostras. A captura WebM usa tempo real e é separada do futuro render offline. Veja GUIA-0.2.md e COMPARATIVO.md para limites e prioridades atuais.

## Fronteira atual

`optics/core.py` recebe RGB linear float, parâmetros e depth normalizado opcional, e devolve RGB linear e avisos. Não conhece DOM, HTTP, Nuke, Resolve, Adobe nem ComfyUI. `server.py` faz conversões de entrada/saída e chama o núcleo. A UI não contém a lógica óptica.

Essa separação facilita evolução, mas o núcleo Python ainda **não é uma biblioteca binária pronta para plugins**. Os adaptadores profissionais vão exigir uma implementação portátil e validação nos hosts.

## Destino recomendado

```text
Prescrições + materiais + medições
                 |
       Laboratório de lentes
       DeepLens / Optiland
                 |
       Atlas PSF/OTF + metadados
                 |
   Motor comum C++ + backend GPU
   CPU de referência / API C estável
      |          |          |          |
  App desktop   OFX      Adobe SDK   binding Python
                 |          |          |
            Resolve/Nuke  AE/Premiere  ComfyUI
```

O desenho acima é uma proposta, não componentes já implementados. O atlas precisa guardar a energia transmitida separadamente da forma normalizada da PSF; campo, comprimento de onda, foco, distância do objeto, abertura e estado dos grupos móveis são dimensões relevantes. Não escolher resolução/quantização do atlas antes de medir erro.

## Contrato do motor de produção

- **Frame:** RGB(A) float, espaço scene-linear explícito, stride, dimensões, pixel aspect, premultiplicação, janela de dados e overscan.
- **Depth:** modo e unidade explícitos: metros da câmera, distância inversa normalizada ou camadas/deep. Nunca adivinhar o significado de um canal Z.
- **Lens:** ID, versão/hash da prescrição, fonte, licença, unidades mm, materiais por Sellmeier/catálogo, stop, superfícies e grupos móveis.
- **Render:** instante, parâmetros animados, foco, abertura, formato do sensor, amostragem, seed estável, orçamento de memória, ROI e cancelamento.
- **Result:** frame, estado, avisos, footprint/ROI necessário, erro estimado de amostragem, tempo e versão do motor.
- **Sem side effects:** motor não acessa rede, UI ou disco implicitamente. Leitura de arquivos fica com o aplicativo/host.

IDs e unidades dos parâmetros devem permanecer estáveis entre versões. Salvar presets em JSON versionado com migração explícita. Chaves desconhecidas não podem mudar silenciosamente o comportamento de um render de produção.

## Ordem de implementação

1. **Validar lentes:** comparar o traçado com um simulador independente; importar materiais reais e mais prescrições. Automatizar spots/MTF, throughput, foco, distorção e testes por comprimento de onda. A suíte atual verifica princípios e regressões, não substitui calibração.
2. **Compositor de produção:** buffers float, EXR via biblioteca apropriada, OCIO, tratamento correto de alfa, overscan e oclusão. Começar por sequências de frames antes de codecs de vídeo. Recursos de [OpenColorIO](https://opencolorio.org/) ajudam a manter transformações explícitas entre Log, linear e exibição.
3. **Vídeo e GPU:** PSFs pré-calculadas/cacheadas, interpolação estável e kernels com limites de memória. Adicionar cancelamento, qualidade adaptativa e evitar flicker. Medir diferentes GPUs antes de prometer 4K em tempo real.
4. **Óptica complementar:** modelo de difração usando pupila/OPD, difusão medida, ray tracing não sequencial para reflexos, coatings e fontes fora de campo. Não somar arbitrariamente um flare decorativo à simulação e chamá-lo de físico.
5. **Plugins:** construir adaptadores sobre o motor consolidado e executar a mesma bateria de referência em cada host.

## Adaptadores da segunda etapa

| Destino | Caminho proposto | Validação necessária |
|---|---|---|
| Resolve | Plugin [OpenFX](https://github.com/AcademySoftwareFoundation/openfx) | Depth/entradas auxiliares, ROI, formatos float, gestão de cor e GPU no host alvo |
| Nuke | OFX para base comum; NDK se necessário para canais/deep e integração avançada | Z, premultiplicação, bounds, multithreading e deep; não presumir equivalência automática entre OFX e NDK |
| After Effects | Efeito nativo pelo [C++ SDK](https://ae-plugins.docsforadobe.dev/) | 16/32 bpc, rendering concorrente, buffer/stride, world transforms e GPU |
| Premiere | Adaptador validado no [Premiere C++ SDK](https://ppro-plugins.docsforadobe.dev/), compartilhando matemática e presets | Não assumir que todo efeito AE é compatível; validar pixel formats, GPU e comportamento temporal |
| ComfyUI | Binding Python do motor comum e nós de imagem/depth/lente | Conversão tensor/HWC, batches, device, seed, cancelamento e metadados |

OpenFX é um padrão compartilhado, não garantia de que cada recurso exista igualmente em todos os hosts. Os SDKs e as versões de destino devem ser fixados e testados antes da distribuição.

## Critérios de aceitação antes de vender como lente realista

- PSFs e MTF comparadas com referência independente nos campos central/intermediário/canto, em múltiplas aberturas e focos.
- Materiais e prescrições rastreáveis; nenhum preset comercial anunciado como calibrado sem medições.
- Throughput separado de normalização de PSF; sem criação ou perda acidental de energia.
- Imagens HDR e alfa corretas, halos avaliados em descontinuidades de profundidade, limites de enquadramento explícitos.
- Render temporal determinístico e sem cintilação durante racks de foco e animação da íris.
- Convergência entre CPU/GPU e correspondência entre app e cada plugin dentro de uma tolerância publicada.
- Desempenho medido em cenas representativas, com resolução, hardware, qualidade e footprint de bokeh registrados.

Nenhum prazo fechado ou estimativa de desempenho foi assumido para esses marcos. A prioridade técnica imediata é validar a prescrição e a resposta espectral antes de ampliar a biblioteca de nomes de lentes.
