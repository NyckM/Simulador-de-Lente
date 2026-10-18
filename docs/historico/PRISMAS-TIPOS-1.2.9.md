# Prismas por tipo — teste 1.2.9 (2026-10-17)

Filtros → Adicionar filtro → "Prisma · <tipo>", ou, dentro de um módulo Prisma, o seletor "Tipo de prisma".

| # | Tipo | O que faz | Controles extras |
|---|------|-----------|------------------|
| 0 | Cromático (dispersão) | Dispersão espectral em uma direção (comportamento anterior) | — |
| 1 | Triangular | Três faces: três cópias refratadas a 120°, cada uma com dispersão | Deslocamento |
| 2 | Cunha | Metade da imagem refratada e dispersa; borda suave | Deslocamento, janela, transição |
| 3 | Facetado | N facetas angulares, cada uma desloca em sua direção; centro preservado | Deslocamento, facetas, janela, transição |
| 4 | Replicação linear | N cópias ao longo do eixo, intensidade decrescente, dispersão crescente | Deslocamento, quantidade |
| 5 | Caleidoscópio | Setores espelhados com dispersão radial; centro preservado | Facetas, janela, transição |
| 6 | Split | As duas metades refratam em sentidos opostos | Deslocamento, janela, transição |
| 7 | Anel radial | Refração radial crescente para a borda, franja espectral em anel | Deslocamento, janela, transição |

Todos usam também: Intensidade, Separação espectral, Ângulo relativo, Posição/Rotação/Escala (alças na imagem com Inspecionar).

Arquivos: web/filter-stack.js (preview WebGL), optics/filters.py (exportação CPU), web/i18n-catalog.js (PT/EN/ZH), web/index.html (cache v=1.2.9-prismas). Backup: work/backup-antes-prismas-1.2.9.

Validação: WebGL (Chromium headless) vs. Python nos 8 tipos — erro médio ≤ 0,0006, p99 ≤ 0,0056 (precisão half-float). Intensidade 0 devolve a imagem idêntica. Tipo não inteiro é rejeitado.

Limite: o executável em dist/ recebeu os arquivos web (preview), mas o código Python dele está compilado; exportação pelo caminho CPU no .exe usa o tipo Cromático até recompilar. Pelo Iniciar.cmd (fonte) tudo funciona.
