# Landing page — Simulador de Desfoque

Site estático. Funciona no GitHub Pages **e** abrindo o `index.html` direto (duplo clique):
todo o JavaScript (three.js, anime.js e o traçador de raios) está empacotado em `js/app.js`,
sem módulos nem CDN.

## Publicar
1. Envie o conteúdo desta pasta para a raiz do repositório (ou `/docs`).
2. Settings → Pages → Branch `main` → pasta `/` (ou `/docs`).

## Editar
O código-fonte fica em `js/*.js` (main, hero, wipe, lab, optics, lenses).
Depois de editar qualquer um deles, gere o pacote de novo:

    npm install
    npm run build

- **Links de download:** em `index.html`, troque `href="#"` dos cards da seção `#download`.
- **Lista de lentes:** `js/lenses.js` (depois rode `npm run build`).
- **Status dos plugins:** troque `Em breve` por `Download` e a classe `tag` por `tag ok` no HTML.
