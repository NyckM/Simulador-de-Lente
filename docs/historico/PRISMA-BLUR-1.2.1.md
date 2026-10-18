# Prisma e blur direcional — 1.2.1

No painel Filtros, adicione **Prisma cromático** ou **Blur direcional**. Os mesmos ajustes também aparecem dentro de cada filtro existente, incluindo Halo, Kaleidoscope, Split Diopter e Replicações.

- **Prisma · mistura cromática**: intensidade adicional nos filtros existentes (0–100%). No filtro Prisma separado, use Intensidade.
- **Prisma · separação espectral**: alcance de 0–10% do lado menor da imagem. Zero desliga a separação.
- **Prisma · ângulo relativo**: −360…360°, somado à rotação do filtro.
- **Blur direcional · mistura**: intensidade adicional (0–100%). No filtro Blur direcional separado, use Intensidade.
- **Blur direcional · alcance**: raio de 0–30% do lado menor da imagem, modulado pela escala do filtro. Zero desliga o blur.
- **Blur direcional · ângulo relativo**: −360…360°, somado à rotação do filtro.

O blur suaviza toda a imagem da região escolhida; Streak permanece um efeito que espalha highlights. As posições, escalas, pivôs e máscaras existentes permanecem disponíveis. Halo/Janela/Kaleidoscope preservam o centro; Split e Véu limitam os ajustes ao seu lado de aplicação. As máscaras ficam fixas na rotação do filtro, mesmo ao mudar o ângulo relativo do blur ou do prisma.

A ordem dentro do módulo é efeito original → prisma → blur direcional. As misturas adicionais começam em zero nos projetos antigos, preservando sua aparência. O prisma usa sete bandas de dispersão e pesos RGB: é uma aproximação artística, não uma simulação calibrada do material de um prisma real.

Todos os seis parâmetros são animáveis na timeline, tanto na pilha principal quanto nos filtros próprios das layers em modo Imagem. São aplicados igualmente na prévia e exportação, inclusive no apresentador CUDA, sem recalcular o atlas de bokeh.

Projetos novos usam schema optica-lab/17 para impedir que versões anteriores descartem silenciosamente esses ajustes. Schemas anteriores continuam aceitos pela 1.2.1.

Validação: comparação CPU/WebGL dos 15 perfis (erro máximo 0,00573 em luz linear FP16), alpha preservado, neutralidade de cor uniforme, bypass exato, centro protegido, rotação visual e keyframes com reutilização do render CUDA.
