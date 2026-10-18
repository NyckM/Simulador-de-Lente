# Simulador de Desfoque 1.2.17

## Aplicativo
- **Lens Flare das luzes da imagem** (estilo RealFlare): reflexos entre os vidros a partir das fontes de luz da foto, que mudam com a lente, o coating e o diafragma. O flare é somado à imagem.
- **Starburst físico**: difração da íris atual. Lâminas pares dão N raios, ímpares 2N. Fechar a íris aumenta o efeito, e fora de foco ele some.
- **Lens Dirt real**: marcas de dedo, poeira, riscos e fungos, com peso por camada, iluminados pelas altas luzes e desfocados pela abertura.
- **Filtros**: visor 3D do vidro, 8 tipos de prisma com borda desfocada, Black Mist contínuo (sem pontinhos) e Kaleidoscope sem linha escura.
- **Interface modular**: painéis encaixáveis, janelas flutuantes, Inspeção óptica como painel e menu superior (Arquivo, Editar, Efeitos, Exibir, Janela, Ajuda).
- **Depth** fiel ao desfoque e **Recuperar luzes recortadas (EV)**.
- Correção: "Campo inválido" no Lens Flare com imagens verticais.

## Plugins
- After Effects, DaVinci Resolve e Nuke **0.4.0**: novo grupo "Visual 1.2.17 / Starburst / Dirt", 8 prismas, Black Mist contínuo, flare em manchas contínuas e recuperação de luzes. Projetos antigos abrem iguais.
- Blender **0.4.0**: starburst, Lens Dirt, 8 prismas e Kaleidoscope exato no compositor.
- ComfyUI **0.4.0**: motor do app 1.2.17, com flare, starburst, dirt, prismas e recuperação de luzes.
- Photoshop 0.2.1, sem mudanças.

Windows x64. O instalador atualiza a versão anterior na mesma pasta.

---

**EN:** Lens flare from image highlights, physical iris starburst, real lens dirt, 3D glass filters with 8 prism types, a modular dockable UI and accurate depth. Plugins 0.4.0 for After Effects, Resolve, Nuke, Blender and ComfyUI.

**中文：**来自画面高光的镜头光晕、物理星芒、真实镜头污渍、3D 玻璃滤镜（8 种棱镜）、模块化界面和准确的深度。After Effects、Resolve、Nuke、Blender、ComfyUI 插件更新至 0.4.0。
