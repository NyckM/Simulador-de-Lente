# Simulador de Desfoque da Bruxosdovfx 1.0.0

Versão 1.0.0 Windows x64: CUDA isolado, WebGL e 13 tipos de filtros artísticos. [Uso e limites](VERSAO-1.0.md). [Plano e histórico](PLANO-1.0.md).

# Update 0.9.13 — Etapa 18

Compilação do app Windows/macOS pelo GitHub, verificações de fonte e pacote, testes WebGL, versão central e checksums. [Instruções e limites](ETAPA18.md). Inclui a correção da edição do Depth Cut.

# Update 0.9.12 — Etapa 16

Ghosts com dois percursos refletidos entre superfícies: inspeção XZ/YZ, distribuição no sensor e aplicação de uma fonte pontual à imagem. Veja [uso, validação e limites](research/APP-GHOSTS-STAGE16.md).

# Update 0.9.11 — Etapa 15

Camadas A/B/C com alpha e depth próprios; glitter importado em A e vidro de distorção em C. Veja [instruções e limites](research/APP-LAYERS-STAGE15.md). Camadas ativas usam WebGL.

Etapa 13: **depth consistente** no render e na inspeção, com normalização opcional, curva, unidades, faixa fixa para vídeo e corte por distância. [Uso, contrato e limites](research/APP-DEPTH-STAGE13.md). Plugins ficam para a etapa de integração posterior.

Etapa 12: **PSF espectral e difração escalar paraxial** na inspeção óptica, com grade física no sensor, transporte de área, cache e exportação de kernel JSON. [Uso, modelo e limites](research/APP-SPECTRAL-PSF-STAGE12.md). Ainda não substitui o render geométrico da imagem.

Etapa 11: **caminho óptico e frente de onda** no painel de inspeção, com cálculo CPU float64 e exportação JSON. Consulte [cálculo e limites](research/APP-WAVEFRONT-STAGE11.md). Não aplica difração à imagem nesta etapa.

Entrega de código cumulativa da **etapa 10**: mapa físico de distorção no aplicativo, com inspeção RGB e exportação JSON. Ative em **Inspeção óptica → Mapa físico de distorção**. Consulte [cálculo, testes e limites](research/APP-DISTORTION-STAGE10.md). A opção vem desligada; o depth usa a projeção do plano de entrada. Esta entrega não gera um novo instalador nem atualiza os plugins.

Camada de gotas com profundidade própria: [GUIA-0.8.3.md](GUIA-0.8.3.md).

Histórico: **0.9.5 desktop Windows**, com composição CUDA NVIDIA, fallback WebGL e interface organizada. O instalador fica em `../Simulador-de-Desfoque-Bruxosdovfx-0.9.5-Setup-Windows-x64.exe`. Consulte [DESKTOP.md](DESKTOP.md) para instalação, requisitos e limites. O atlas dos vidros mantém o traçado Vulkan/CPU existente. Biblioteca de 302 modelos: 293 construções disponíveis e 9 pendentes; 283 novas prescrições numéricas do LensVisualizer.

# Histórico do protótipo 0.2

O [GUIA-0.2.md](GUIA-0.2.md) registra a etapa inicial de vídeo local e prévia GPU. Veja [COMPARATIVO.md](COMPARATIVO.md) para a pesquisa LensNode/Lenslab. O texto abaixo registra apenas a versão CPU 0.1 e seus limites históricos.

---

# Histórico: Simulador de Desfoque da Bruxosdovfx · 0.1 experimental

Aplicativo local para explorar desfoque de uma lente composta, com um núcleo Python independente da interface. A primeira versão funciona com imagens; os plugins e o suporte a vídeo ainda não foram implementados.

## Abrir

Execute `Iniciar.cmd` no Windows. Nesta máquina ele reutiliza o ambiente isolado criado para o projeto. Em outra máquina, precisa de Python 3.13 e baixa as três dependências para `.venv` na primeira execução. O aplicativo abre em `http://127.0.0.1:8765`; mantenha o processo aberto enquanto usa a interface. Para encerrar, pressione Ctrl+C no terminal. Não há upload remoto.

Alternativa manual:

```powershell
python -m venv .venv
.venv/Scripts/python.exe -m pip install -r requirements.txt
.venv/Scripts/python.exe server.py --open
```

## Experimentar

1. A cena de teste contém luzes HDR sintéticas e um objeto com linhas finas. Começa como plano único a 5 m.
2. Mude o foco de 2 m para 0,8 m e clique em **Renderizar** para tornar o bokeh mais evidente.
3. Mude o raio da íris e o número de lâminas; 0 significa íris circular.
4. Ative **Usar mapa de profundidade** para colocar o objeto a 2 m e as luzes a 5 m. No demo essas distâncias são fixas e substituem os campos próximo/distante durante o render.
5. Abra sua imagem PNG/JPEG/WebP; opcionalmente, abra depth PNG com as mesmas dimensões e orientação. Branco significa próximo e preto distante, interpolados em distância inversa. Depth métrico em EXR ainda não é aceito.
6. Compare entrada e resultado com o controle A/B. Exporte o PNG da última renderização. Alterar parâmetros bloqueia a exportação até renderizar novamente.
7. Salve os parâmetros em JSON. O JSON não embute imagem nem depth: importe os arquivos novamente ao reabrir.

## O que é físico nesta versão

- Prescrição pública Double-Gauss nominal 50 mm do LensSim, com dez interfaces refrativas e uma íris.
- Interseção 3D com superfícies esféricas e refração vetorial pela lei de Snell.
- Rejeição de raios bloqueados por diâmetros finitos e pela íris; transmissão de Fresnel sem coating, sem polarização rastreada.
- Plano do sensor calculado pelo foco paraxial e deslocamento do filmback em milímetros.
- PSFs geométricas calculadas por campo e distância, incluindo as aberrações produzidas pela geometria da prescrição.
- Render em luz linear; decodificação sRGB na entrada e codificação sRGB na exportação.

Distância focal efetiva calculada: aproximadamente **50,3582 mm**. O raio da íris é um raio físico no stop. Não é convertido diretamente em f-number: isso exigiria medir a pupila de entrada.

## O que é aproximado

- O arquivo da lente fornece `nd`, mas não nomes de vidros nem números de Abbe. O controle de dispersão usa um modelo de Cauchy com Abbe sintético 45. É um efeito criativo, não a dispersão comprovada dessa lente. Em zero, a prescrição é tratada como acromática.
- Swirl, coma adicional, squeeze e difusão são modificadores criativos. Os estudos inspirados em Helios, Petzval e anamórficas usam **a mesma Double-Gauss**; não são modelos dessas lentes comerciais.
- Interpolação espacial por janelas de contribuição da fonte: prévia com grade 3×3, final 5×3. Não é ray tracing por pixel da imagem inteira.
- Depth em cinco camadas discretas com composição do fundo para frente. Não recupera superfícies ocultas; bordas e desoclusões podem apresentar artefatos.
- PSFs normalizadas e transmissão relativa ao centro; a exposição não diminui automaticamente ao fechar a íris. Não é um simulador radiométrico absoluto.
- O centroide verde é recentrado: distorção e breathing não são aplicados à imagem. A PSF ainda muda com o campo e o foco.
- Há perda natural de contribuição fora das bordas do quadro, tratadas como pretas. Não há overscan reconstruído.

## Limites explícitos

CPU; prévia até 768 px, final até 1600 px no maior lado, PNG 8 bits. Imagens importadas são interpretadas como sRGB; perfis ICC arbitrários não são convertidos e alfa é composto sobre preto. A demonstração é HDR interna, mas o PNG exportado clipa valores acima do branco. Sem OCIO, ACES/Log, EXR, vídeo, GPU, difração, ghosts, flare físico, coatings, elementos cilíndricos, lentes medidas ou plugins. A PSF tem limite de 321×321 pixels; combinações que o excedem geram erro explícito, sem truncamento silencioso.

## Código e testes

```text
optics/core.py       Refração, prescrição, PSF e render; sem dependência da UI
server.py            Adaptador HTTP local e conversão de imagens
web/                 Interface HTML/CSS/JS, sem dependências externas
data/                Prescrição e licença MIT original
tests/               Testes numéricos e de integração
PESQUISA.md          Avaliação das referências e direção técnica
ARQUITETURA.md       Evolução do motor e futuros adaptadores de plugins
```

```powershell
.venv/Scripts/python.exe -m unittest discover -s tests -v
```

O núcleo desta versão é uma implementação original de referência em Python/NumPy/SciPy. DeepLens, Optiland e RayOptics foram pesquisados, mas não incorporados como dependências. A prescrição e a licença do LensSim estão em `data/`; preserve essa atribuição ao distribuir.
