# Blender addon 0.1.3 — câmera OSL com materiais nativos

Corrigida a ativação global de OSL pelo addon. A câmera customizada executa seu shader OSL independentemente do sistema de materiais. Criar/aplicar a lente agora preserva `scene.cycles.shading_system`; não converte automaticamente os materiais e o ambiente em grupos OSL.

## Atualizar uma cena antiga

1. Instale **Bruxos-Physical-Lens-0.1.3-Blender-Addon.zip** no Blender e ative a extensão.
2. Use Cycles com OptiX; no painel Bruxos, ative/aplique a câmera óptica.
3. Clique **Usar materiais nativos · câmera OSL** para desligar OSL global que a edição anterior pode ter ativado. A lente óptica e seu bytecode são mantidos.
4. Se materiais/ambiente usam nós Script OSL, inclusive em grupos, o botão recusa a troca para não desativar seus shaders. Nesse caso use a lente em CPU ou revise os materiais. O campo OSL nos materiais também permanece disponível para escolha explícita.
5. Se uma sessão já estiver danificada, salve e reinicie o Blender. A recuperação foi testada no cenário abaixo; não representa reparo universal de contexto/driver GPU.

## Evidência

Blender **4.5.14 LTS / OptiX / RTX 4090**, cena sintética com material conectado de **203 nós** e textura de ambiente HDR float:

- OSL global ligado: erro **Requested OSL group data size (2232) ... OptiX (2048)** reproduzido.
- Mesma câmera e material, com OSL global desligado: render concluído em OptiX.
- Após provocar a falha, botão de materiais nativos e novo render na mesma execução do Blender: concluído.
- Mudança de foco e novo render; restauração da câmera original e novo render OptiX: concluídos.
- Preservação de configuração OSL existente, guarda de Script OSL em material/grupo/ambiente e restauração de configuração original: verificadas.
- Regressão de câmera/bytecode, atualização de frames e reutilização de meshes: Blender 4.5.14 LTS e 5.3 Alpha disponível neste ambiente.

O shader óptico, prescrição, cálculo de refração e amostragem espectral não foram alterados. Isso elimina uma conversão de materiais indevida; não troca a lente por blur de compositor ou câmera padrão.

## Limites

O limite de **2048 bytes por grupo** continua no Blender. Uma câmera OSL muito grande ou materiais OSL deliberadamente ativados ainda podem excedê-lo. Não aumentar esse limite por variável de ambiente nem prometer suporte em CUDA/HIP/Metal. A câmera permanece suportada em CPU/OptiX conforme o Blender instalado.

A cena original do relato não foi fornecida. Não foi validada fluidez de viewport, render longo ou recuperação de falha de driver. O teste de render é pequeno (64×48, 2 samples) e prova funcionamento/recuperação nessa reprodução, não desempenho ou qualidade de produção em qualquer cena.

Fontes primárias:
- Inicialização independente da câmera: https://github.com/blender/blender/blob/main/intern/cycles/scene/osl.cpp
- Verificação do limite por grupo: https://github.com/blender/blender/blob/main/intern/cycles/device/optix/device_impl.cpp

Testes: `tests/test_blender_optix027.py`, `tests/test_blender_material_osl027.py`, `tests/test_blender_recovery026.py`. Relatórios em `research/blender-optix-*.json` e `research/blender-material-osl-guard027.json`.
