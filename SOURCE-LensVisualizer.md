# Prescrições numéricas: LensVisualizer

Fonte: https://github.com/ronbuening/LensVisualizer/tree/main/src/lens-data
Consulta: 2026-10-01. Foram examinados 849 arquivos .data.ts. Esta versão acrescenta 283 modelos esféricos compatíveis; 7 arquivos já tinham modelos correspondentes na biblioteca.

O pacote contém a nossa conversão dos valores numéricos de superfícies (raio, espaçamento, índice e abertura) e metadados de identificação das prescrições. Não inclui código TypeScript, interface, desenhos, textos de análise ou auditorias do projeto fonte. O repositório não declara uma licença geral; esta importação não assume uma licença de software para esses materiais. Cada perfil conserva o endereço do arquivo fonte, identificador de patente e SHA-256 do arquivo consultado.

São reconstruções numéricas, não medições de lentes comerciais. Quando fornecidos como estimativas na fonte, os diâmetros permanecem modelados. Focal e stop são normalizados pelo nosso motor. Dispersão continua sendo um proxy criativo: os valores Abbe e os catálogos de vidro do projeto fonte não foram integrados ao traçador. As configurações variáveis de foco/zoom são mantidas no estado numérico fixo da tabela importada.

A importação não executa TypeScript. Somente valores literais, superfícies esféricas, diafragma planar em ar e meio final em ar são aceitos. Também são verificados EFL, abertura nominal, transmissão axial e cálculo de foco/desenho. Modelos asféricos, expressões dinâmicas, focal variável, prescrições que não passam nos testes e focais fora de 5–500 mm foram excluídos. O relatório LensVisualizer-import-report.json registra os motivos.

Reconstrua a conversão com tools/import_lensvisualizer.py apontando para uma cópia local do repositório, depois execute tools/update_library.py. As fontes originais não são executadas nem incluídas no aplicativo.
