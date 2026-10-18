# Blender 0.3.0 — lente, bokeh e filtros

Instale o ZIP em Edit > Preferences > Get Extensions > menu > Install from Disk, atualize a extensão e reinicie o Blender. Use Cycles CPU ou OptiX. Abra a sidebar da Viewport, aba Bruxos, selecione a câmera e crie a lente.

## Lente e diafragma

Escolha um dos 12 presets e ajuste a distância focal em mm. Há atalhos 24, 35, 50 e 85 mm. A geometria da prescrição é escalada uniformemente para a focal pedida: os atalhos não substituem a lente por outra prescrição. Os presets são reconstruções/aproximações identificadas, não calibrações comerciais medidas.

Selecione abertura em f-stop ou raio da íris em mm. O painel mostra o f-number efetivo; aberturas além do limite físico da prescrição são limitadas e informadas. Ajuste lâminas e rotação do diafragma.

## Tipos de desfoque

Físico, circular, poligonal, cat's eye, cropped, anamórfico e swirl. Ajuste swirl, compressão anamórfica, astigmatismo e coma. Swirl e os modificadores de pupila são ajustes artísticos; preservam a interseção dos raios primários no plano de foco. Não reproduzem automaticamente aberrações medidas de uma marca.

Clarear laterais acrescenta EV progressivamente no campo. É compensação artística, separada da vinheta criativa; não mede nem normaliza a transmissão real da pupila.

## Filtros de imagem

O painel Filtros de imagem contém Black Mist, White Mist, Detail, Streak, Star, Veil, Window, Replicate, Halo, Kaleidoscope, Split, Fringing, Halation, Prisma e Blur direcional. Adicione até 16 módulos, ative/desative e altere a ordem.

Cada módulo tem intensidade, posição X/Y, escala, rotação, alcance do blur, deslocamento, contagem e região suave, conforme a resposta do perfil. Coordenadas normalizadas: (0,0) canto inferior esquerdo, (1,1) superior direito; X/Y aceitam -1 a 2. Escala 1 equivale a 100%. O alcance do kernel é separado da escala da região. Em filtros globais uniformes, posição só muda a resposta com região ativada. Reset transformação restaura X/Y, escala e rotação, preservando perfil e intensidade.

São aproximações pelo compositor nativo, não os mesmos shaders do desktop. O prisma separa canais RGB, não calcula um espectro contínuo. Os filtros aparecem no render/compositor; a câmera óptica atua na cena 3D. O compositor existente é preservado e a pilha é inserida antes da saída principal. Saídas File Output existentes não são alteradas.

## Flare e desempenho

Abra Lens Flare para ativar reflexos internos, ganho e coating. São caminhos de duas reflexões em superfícies esféricas com a mesma íris do bokeh. Coatings são idealizados; não inclui difração de onda completa. Flare pode exigir muitas amostras.

Prévia rápida desativa os reflexos na viewport, mantendo-os no render final. Superfícies técnicas e inspeção ficam recolhidas; meshes de inspeção são opcionais. Ajustes frequentes reutilizam a compilação sempre que possível. Mudanças na focal/geometria podem recompilar.

## Animação e limites

Propriedades numéricas aceitam keyframes nativos do Blender: use I ou Insert Keyframe no campo. Focal, f-stop, swirl e rotação de filtros foram verificados em mudanças de frame. Isso não adiciona a timeline por layers do aplicativo desktop. Não há inferência MoGe 3 dentro deste addon.

Validado no Blender 4.5.14: controles, animação, render de bokeh em CPU/OptiX e preservação do plano de foco. Os 15 filtros foram renderizados no Blender 4.5.14 e 5.3 Alpha; registro e compilação da câmera também passaram na 5.3 Alpha. A versão Alpha não é uma garantia de compatibilidade com a futura versão estável. A integração com splats não foi revalidada nesta atualização.
