# Split Diopter FX — planejamento 1.0

Status: candidato à frente 5, **Filtros → Split Diopter FX**. Não implementado no executável. As três imagens e a descrição são referências visuais/comerciais, não calibração do elemento +2 citado.

## Objetivo visual

Preservar parte da imagem e criar desfoque/refração localizados na região restante, com orientação ajustável. Os retratos mostram uma região central mais definida e áreas periféricas suavizadas, com conteúdo luminoso espalhado. A terceira imagem também mostra raios nas luzes; não atribuir automaticamente todos esses raios ao diopter: Streak/difração é uma contribuição separada, opcional na pilha.

A cor quente/azul das referências não será imposta ao filtro: preservar RGB por padrão, com coloração/dispersão criativa opcionais.

## Controles

| Controle | Finalidade |
| --- | --- |
| Rotação 0–360° | Orientar a divisão; arraste/alça na imagem e campo editável. |
| Posição / cobertura | Mover a fronteira e escolher quanto do frame recebe o efeito. |
| Inverter lado | Trocar região preservada e região afetada. |
| Transição | Suavizar a fronteira sem criar contorno abrupto involuntário. |
| Desfoque local | Intensidade e perfil da suavização, sem alterar o foco principal global. |
| Refração / magnificação | Deslocamento e escala locais no modo artístico, com parâmetros distintos. |
| Dispersão / halo | Opcionais; não duplicar CA, Fringing, Mist ou Streak automaticamente. |
| Máscara / bypass / reset | Inspeção das regiões, aplicação localizada e reset só deste módulo. |

Presets próprios: **Split suave**, **Split refratado** e **Split intenso**. PT/EN/ZH, bloco recolhível e persistência no projeto/ordem de pilha. Compartilhar contratos de máscara, alças, cor e alpha com Prismas, mantendo identidade própria: este modo tem uma divisão orientada; Halo FX tem região anular e Kaleidoscope tem setores periféricos.

## Modo artístico versus cálculo óptico

A primeira entrega usa transformações e desfoque locais com referência CPU e GPU. Não rotular o controle de intensidade artística como potência física em dioptrias.

Uma dioptria positiva modifica o poder óptico na parte coberta. Para um elemento fino isolado, +2 D corresponde a focal de 0,5 m; isso não significa foco do sistema combinado a 0,5 m nem define uma quantidade fixa de blur. A aparência depende da distância do objeto, foco/abertura da lente, posição do elemento e dos percursos envolvidos. A frase comercial de que aproximar o vidro produz “o efeito oposto” não é adotada como lei física geral. Referência oficial sobre diopters e foco próximo: https://tiffen.com/collections/diopter

O modo óptico futuro precisa de elemento frontal parcialmente coberto e orientação, geometria/material, distância à lente e passagem direta no setor livre. A fronteira na imagem pode não corresponder a uma máscara rígida de meio frame: a cobertura de raios na pupila e a abertura também importam. Validar antes de anunciar traçado físico ou duas regiões de foco.

Um modo de duplo foco baseado em depth seria uma entrega distinta: precisa de contratos de composição/oclusão próprios e não recupera detalhe já perdido no RGB por desfoque da captura.

## Implementação em ordem

1. Definir fronteira rotacionável, unidade de escala, máscara da região e comportamento da transição.
2. Referência CPU de amostragem/magnificação e desfoque local; três presets próprios.
3. GPU, cache, recuperação e comparação numérica com tolerâncias justificadas.
4. Alças de rotação/posição/cobertura, campos numéricos, inspeção e projeto.
5. Validar foco principal, pilha, alpha, bordas, resolução, preview/exportação e vídeo.
6. Evoluir para elemento óptico parcial e/ou duplo foco somente com suporte e testes identificados.

## Validação

- Bypass exato e região preservada inalterada pelo módulo isolado.
- Rotação contínua, inversão e posições previstas em chart; sem saltos ao cruzar 0/360°.
- Transição sem costuras/contornos pretos, alpha premultiplicado correto e política explícita de borda.
- Uniforme/preto não geram halos ou fontes artificiais; ausência de ruído temporal.
- Escala e cobertura coerentes entre proporções e 1080p/4K; custo e memória medidos.
- CPU/GPU e preview/exportação equivalentes dentro de tolerâncias registradas.
- Gestos, cancelamento e reset não deixam tarefas bloqueadas ou reaplicam estado antigo.

O modo artístico é candidato à 1.0 após validação; equivalência ao filtro comercial +2 e cálculo de split diopter físico não estão concluídos por esta especificação.
