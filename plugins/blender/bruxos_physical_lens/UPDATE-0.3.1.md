# Aplicativo 1.2.2 e Blender 0.3.1

Implementação própria inspirada na organização do Lens Optics Lite, sem copiar shaders, imagens ou presets comerciais.

## Aplicativo
Na aba **Efeitos**, abra **Caráter criativo → Preset de caráter**. Escolha Neutro, Retrato/swirl, Cinema/oval, Caráter nas bordas ou Bokeh/borda marcada e clique Aplicar caráter. Reset do caráter zera somente os ajustes artísticos desse grupo: mantém prescrição, foco, abertura, imagem, mapa de profundidade, filtros e animação. Os controles individuais continuam disponíveis.

## Blender
No painel Bruxos, crie/aplique a lente e abra Bokeh para escolher um preset de caráter. Aplicar e Reset do caráter preservam a distância focal, o diafragma, a prescrição, o alvo de foco e os filtros. O último preset oferece recorte lateral; não é equivalente ao perfil de borda marcada do desktop.

**Escolher ponto**: clique numa superfície na Viewport. O addon cria um Empty no ponto atingido, ligado ao objeto, e ativa Acompanhar alvo. O foco acompanha movimento e keyframes do objeto/câmera, usando distância no eixo óptico e a escala da cena. **Liberar** mantém a última distância e devolve o controle manual. Também é possível selecionar um objeto existente em Alvo de foco. Esc cancela a seleção.

O ponto segue a transformação do objeto, não a deformação local da malha por armature/modificadores. Alvos atrás da câmera ou fora da faixa óptica são rejeitados. O teste automatizado validou o cálculo e a animação do alvo; a seleção por mouse requer conferência numa sessão gráfica do Blender.

O modo de prévia Leve, os caches ópticos, os filtros nativos e os keyframes existentes foram mantidos. Não foram alterados os kernels CUDA nem a simulação física de flare. Os presets são aparências artísticas aproximadas, não calibrações de lentes comerciais.
