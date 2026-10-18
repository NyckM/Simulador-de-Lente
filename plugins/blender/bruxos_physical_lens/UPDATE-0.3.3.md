# Blender 0.3.3

Textura do bokeh na câmera OSL: anéis, granulado, frequência e rotação em graus. Todos aceitam keyframes. Intensidades 0 preservam os raios e a imagem da versão anterior. A modulação atua na pupila do caminho primário; as reflexões do Lens Flare continuam seguindo os vidros, coating e íris.

A textura é normalizada pela média de uma pupila circular. O recorte real dos vidros e um diafragma poligonal podem alterar a exposição residual. Não é uma textura medida de uma lente comercial.

Mantidos presets de lentes e caráter, distância focal em mm, f-stop, foco por ponto/alvo, tipos de bokeh, swirl, filtros do compositor e animação por frame. A correção de detalhe no foco da 0.3.2 permanece.

Instale o ZIP como extensão no Blender 4.5+. A câmera usa Cycles CPU/OptiX. Eevee não executa este shader. Testado com render real em Blender 4.5.14 CPU e OptiX; controles de textura e rotação tiveram resultado visível e os keyframes atualizaram os uniforms. As versões mais antigas do Blender não foram revalidadas nesta entrega.

Os controles 2D de porcentagem de desfoque próximo/distante e limite EV de compensação da pupila dos outros ports não estão nesta câmera 3D. Não foram adicionados sliders sem efeito. O clareamento artístico em EV e a vinheta criativa continuam separados.
