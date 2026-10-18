# Optica Lab 0.8.1 — biblioteca óptica

O catálogo contém os 19 modelos pedidos, organizado por uso: padrão, retrato, cinema e grande-angular/tele. Busca por nome ou distância focal e botão Usar. A apresentação e os textos são próprios; nenhuma imagem ou descrição da Higx foi incorporada. Não se alteram valores ópticos apenas para disfarçar a origem.

## Disponíveis

Double-Gauss (referência LensSim), Tessar 50/2.8, Biotar 50/1.4, Sonnar 50/1.5, Canon 1956 50/1.2, Kino-Plasmat 100/2, Orestor 135/2.8, Heliar 100/4.5, grande-angular Nakamura 22/2.8 e teleobjetiva Sigler 250/5.6.

As nove novas construções têm superfícies, raios, espessuras e índices independentes. O editor e o atlas usam essa geometria tanto no CPU quanto no Vulkan. Escala uniforme para a distância focal nominal e fechamento da íris para o f-number nominal calculado pela pupila de entrada. Orestor inicia com 15 lâminas; demais novas reconstruções começam com abertura circular, sem inventar a mecânica original. O controle aceita até 32 lâminas.

As tabelas públicas não comprovam a reprodução de um exemplar comercial. Na maioria dos novos perfis, diâmetros mecânicos e posição/abertura do stop foram modelados na tabela de origem. Não são réplicas calibradas; vidro dispersivo, coatings e reflexos continuam aproximados. A resposta de campo resulta da refração através dos elementos, mas a imagem ainda interpola o atlas WebGL.

## Pendentes

Speed Panchro, Petzval, Helios-44, Aero-Ektar, Triplet, Kapella, Tair-11, Jupiter-9 e Goerz/Primoplan. Estão visíveis no catálogo, sem botão Usar. Faltam dados completos e suficientemente conferidos para ligar estes nomes a uma prescrição. Os perfis antigos Helios-44-2, Planar e estudos criativos continuam em um grupo separado de aproximações; não substituem os modelos pendentes.

Reset do perfil, edição dos vidros, salvar/importar/exportar perfis e projetos funcionam com as novas construções. Os limites de diâmetro e espessura do editor acompanham lentes grandes; o desenho ajusta a escala vertical.

## Origem e verificação

`data/lens_profiles.json` registra fonte, hash do arquivo consultado e associação a patente quando fornecida pela fonte. `data/prescriptions/` usa nosso esquema de superfícies; não incorpora o código de renderização das referências. `data/lens_catalogue.json` separa inventário de modelos realmente implementados. `tools/update_library.py` mantém o catálogo e o seletor consistentes.

- Valores numéricos históricos: [LensVisualizer](https://github.com/ronbuening/LensVisualizer/tree/main/src/lens-data), fonte secundária, sem confirmação independente de todas as associações comerciais/patentes.
- Grande-angular e tele: [dados PBRT](https://github.com/mmp/pbrt-v4-scenes/tree/master/lenses).
- Double-Gauss: arquivo LensSim já distribuído com sua licença MIT.
- [Lista Higx consultada](https://higx.net/optics/guide/lenses.html): somente inventário de modelos, sem copiar textos, figuras ou implementação.

Testes: distâncias focais, f-numbers, fechamento em stops, transmissão, geometrias distintas, alterações de vidro e concordância CPU/Vulkan para as nove novas construções; regressões existentes. Não houve verificação visual automatizada do navegador nesta atualização. Esta etapa não corrige todos os limites anteriores de oclusão, vídeo ou amostragem.
