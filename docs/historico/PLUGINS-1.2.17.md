# Plugins atualizados para o visual do app 1.2.17

| Plugin | Versão | Estado |
|---|---|---|
| ComfyUI | 0.4.0 | pronto (`ComfyUI-Bruxos-WebGL-0.4.0.zip`) |
| Blender | 0.4.0 | pronto (`Bruxos-Physical-Lens-0.4.0-Blender-Addon.zip`) |
| After Effects / Resolve / Nuke | 0.4.0 | código pronto; compile com `work\build-plugins-1.2.17.ps1` |

## O que entrou nos nativos (AE, Resolve, Nuke)
- **Black Mist / Halation contínuos**: só a luz acima do limiar espalha (o núcleo não escurece), com desfoque gaussiano real. Acabaram os pontinhos.
- **Prisma: 8 tipos** (Cromático, Triangular, Cunha, Facetado, Replicação linear, Caleidoscópio, Split, Anel radial), espectro de 13 comprimentos de onda e **borda do vidro desfocada**.
- **Kaleidoscope e prismas sem linha escura**: a borda do quadro é espelhada 6 px para dentro.
- **Lens Flare em manchas contínuas**: splats gaussianos pelo espaçamento da pupila, em vez de pontinhos.
- **Starburst físico**: difração da íris atual (FFT da abertura, 16 comprimentos de onda). Lâminas pares dão N raios, ímpares 2N. Fechar o diafragma aumenta o efeito, e ele some fora de foco (usa o depth). As fontes são as mesmas do Lens Flare (limiar e máximo de fontes).
- **Lens Dirt real**: marcas de dedo, poeira, riscos e fungos (`bruxos_dirt.rgba`, ao lado do binário), com peso por camada, variação, desfoque pela íris e reação às altas luzes.
- **Recuperar luzes recortadas (EV)**: devolve energia a highlights estourados em plates 8/16-bit.

Os controles novos ficam no grupo **"Visual 1.2.17 / Starburst / Dirt"**, no fim da lista. Os IDs antigos foram mantidos, então projetos .aep/.drp/.nk abrem iguais, com os controles novos neutros.

## Como compilar (na sua máquina Windows)
1. Abra o PowerShell na pasta `ol`.
2. Rode `powershell -ExecutionPolicy Bypass -File work\build-plugins-1.2.17.ps1`.
3. O script verifica as ferramentas, roda o teste do visual, compila os 3 hosts nos 3 idiomas com HostTest CUDA e CPU, e empacota os zips 0.4.0 em `outputs\Versao-Atual-1.2.17\`.
4. Se der erro, mande as últimas linhas da tela ou o arquivo `work\plugins-040.log`.

Os DLLs CUDA não mudaram (o bokeh é o mesmo) e são reaproveitados. Filtros, starburst e dirt rodam na CPU com OpenMP.

## Validado aqui
- O núcleo C++ (filtros, 8 prismas, starburst, dirt, recuperação, flare) foi compilado e testado com g++: 27 quadros, todos finitos, energia do flare preservada.
- O plugin OFX foi checado contra os headers OpenFX.
- After Effects precisa do AE SDK, que só existe na sua máquina.
