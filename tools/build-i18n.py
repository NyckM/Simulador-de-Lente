#!/usr/bin/env python3
"""Gera en.html e zh.html a partir do index.html (português).

Uso:  python tools/build-i18n.py
Edite o index.html normalmente; depois rode este script. Cada trecho em PT abaixo
precisa existir exatamente no index.html — se você mudar um texto em PT, atualize
o trecho correspondente aqui (o script avisa qual não encontrou).
"""
import pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = (ROOT / 'index.html').read_text(encoding='utf-8')

# (português, inglês, chinês)
T = [
  # ---- head ----
  ('<html lang="pt-BR">', '<html lang="en">', '<html lang="zh-CN">'),
  ('<title>Simulador de Desfoque · Bruxosdovfx</title>', '<title>Lens Blur Simulator · Bruxosdovfx</title>', '<title>镜头虚化模拟器 · Bruxosdovfx</title>'),
  ('content="Simulador de lentes ópticas com ray tracing por superfície de vidro. App desktop e plugins para After Effects, DaVinci Resolve, Nuke, Photoshop, Blender e ComfyUI, com mais de 200 lentes."',
   'content="Optical lens simulator with ray tracing through every glass surface. Desktop app and plugins for After Effects, DaVinci Resolve, Nuke, Photoshop, Blender and ComfyUI, with 200+ lenses."',
   'content="逐个镜面光线追踪的光学镜头模拟器。桌面应用及 After Effects、DaVinci Resolve、Nuke、Photoshop、Blender、ComfyUI 插件，内置 200 多款镜头。"'),
  ('<meta property="og:title" content="Simulador de Desfoque · Bruxosdovfx">', '<meta property="og:title" content="Lens Blur Simulator · Bruxosdovfx">', '<meta property="og:title" content="镜头虚化模拟器 · Bruxosdovfx">'),
  ('content="Desfoque que atravessa a lente: ray tracing óptico, 200+ lentes, app e plugins."', 'content="Blur that travels through the lens: optical ray tracing, 200+ lenses, app and plugins."', 'content="穿过镜头的虚化：光学光线追踪、200+ 镜头、应用与插件。"'),
  ('family=JetBrains+Mono:wght@400;500&display=swap', 'family=JetBrains+Mono:wght@400;500&display=swap', 'family=JetBrains+Mono:wght@400;500&family=Noto+Sans+SC:wght@400;500;700&family=Noto+Serif+SC:wght@700&display=swap'),
  ('''  <script>
    // Primeira visita: envia para o idioma do navegador (a escolha manual fica salva)
    (function () {
      try {
        var saved = localStorage.getItem('lang');
        var nav = (navigator.language || 'pt').toLowerCase();
        var want = saved || (nav.indexOf('pt') === 0 ? 'pt' : nav.indexOf('zh') === 0 ? 'zh' : 'en');
        if (want === 'en') location.replace('en.html' + location.hash);
        else if (want === 'zh') location.replace('zh.html' + location.hash);
      } catch (e) {}
    })();
  </script>
''', '', ''),
  # ---- nav ----
  ('<span>Simulador de Desfoque<small>da Bruxosdovfx</small></span>', '<span>Lens Blur Simulator<small>by Bruxosdovfx</small></span>', '<span>镜头虚化模拟器<small>Bruxosdovfx 出品</small></span>'),
  ('<a href="#diferenca">Óptico × blur</a>', '<a href="#diferenca">Optical × blur</a>', '<a href="#diferenca">光学 × 模糊</a>'),
  ('<a href="#comparacoes">Antes e depois</a>', '<a href="#comparacoes">Before & after</a>', '<a href="#comparacoes">前后对比</a>'),
  ('<a href="#laboratorio">Laboratório</a>', '<a href="#laboratorio">Lab</a>', '<a href="#laboratorio">实验室</a>'),
  ('<a href="#lentes">Lentes</a>', '<a href="#lentes">Lenses</a>', '<a href="#lentes">镜头库</a>'),
  ('<a href="#download" class="btn btn-small">Download</a>', '<a href="#download" class="btn btn-small">Download</a>', '<a href="#download" class="btn btn-small">下载</a>'),
  ('aria-label="Idioma"', 'aria-label="Language"', 'aria-label="语言"'),
  # ---- hero ----
  ('<span class="pulse"></span> Simulador óptico · ray tracing por superfície</p>', '<span class="pulse"></span> Optical simulator · per-surface ray tracing</p>', '<span class="pulse"></span> 光学模拟器 · 逐面光线追踪</p>'),
  ('''      <span class="line"><span class="w">Desfoque</span> <span class="w">que</span></span>
      <span class="line"><em class="w">atravessa</em> <span class="w">a</span> <span class="w">lente.</span></span>''',
   '''      <span class="line"><span class="w">Blur</span> <span class="w">that</span> <em class="w">travels</em></span>
      <span class="line"><span class="w">through</span> <span class="w">the</span> <span class="w">lens.</span></span>''',
   '''      <span class="line"><span class="w">穿过镜头的</span></span>
      <span class="line"><em class="w">真实</em><span class="w">虚化。</span></span>'''),
  ('A luz entra pelo primeiro vidro, refrata em cada superfície, é recortada pelo diafragma e chega ao sensor. O bokeh da sua imagem nasce desse caminho — não de um filtro de borrar.',
   'Light enters through the first glass, refracts at every surface, gets clipped by the aperture and reaches the sensor. The bokeh in your image is born from that path — not from a blur filter.',
   '光线从第一片镜片进入，在每个镜面折射，被光圈裁切，最后抵达传感器。画面中的焦外正是由这条路径产生的——而不是模糊滤镜。'),
  ('<a class="btn" href="#laboratorio">Mexer nos vidros agora</a>', '<a class="btn" href="#laboratorio">Play with the glass now</a>', '<a class="btn" href="#laboratorio">立即调整镜片</a>'),
  ('<a class="btn btn-ghost" href="#download">Baixar o app</a>', '<a class="btn btn-ghost" href="#download">Download the app</a>', '<a class="btn btn-ghost" href="#download">下载应用</a>'),
  ('<li><b>App</b> Windows x64</li>', '<li><b>App</b> Windows x64</li>', '<li><b>应用</b> Windows x64</li>'),
  ('<b>Plugin</b>', '<b>Plugin</b>', '<b>插件</b>'),
  ('<div><span>lente</span><b id="ro-lens">Double-Gauss 50 mm</b></div>', '<div><span>lens</span><b id="ro-lens">Double-Gauss 50 mm</b></div>', '<div><span>镜头</span><b id="ro-lens">双高斯 50 mm</b></div>'),
  ('<div><span>abertura</span>', '<div><span>aperture</span>', '<div><span>光圈</span>'),
  ('<div><span>superfícies</span>', '<div><span>surfaces</span>', '<div><span>镜面</span>'),
  ('<div><span>foco</span>', '<div><span>focus</span>', '<div><span>对焦</span>'),
  ('aria-label="Rolar"', 'aria-label="Scroll"', 'aria-label="滚动"'),
  # ---- 01 ----
  ('<p class="label reveal">01 — Antes e depois</p>', '<p class="label reveal">01 — Before & after</p>', '<p class="label reveal">01 — 前后对比</p>'),
  ('<h2 class="reveal">Blur não é <em>desfoque</em>.</h2>', '<h2 class="reveal">Blur is not <em>defocus</em>.</h2>', '<h2 class="reveal">模糊不等于<em>虚化</em>。</h2>'),
  ('Um blur gaussiano espalha os pixels já gravados. Uma lente espalha <b>luz</b>. Arraste a divisória e compare a mesma cena — o lado óptico foi calculado ao vivo, nesta página, traçando raios por uma Double-Gauss 50 mm.',
   'A Gaussian blur spreads pixels that are already recorded. A lens spreads <b>light</b>. Drag the divider and compare the same scene — the optical side was computed live, on this page, by tracing rays through a Double-Gauss 50 mm.',
   '高斯模糊只是把已经记录的像素摊开，镜头扩散的是<b>光</b>。拖动分隔线对比同一场景——光学一侧是在本页面实时计算的，光线穿过一支双高斯 50 mm 镜头。'),
  ('role="tab">Blur gaussiano × Óptico</button>', 'role="tab">Gaussian blur × Optical</button>', 'role="tab">高斯模糊 × 光学</button>'),
  ('role="tab">Entrada nítida × Óptico</button>', 'role="tab">Sharp input × Optical</button>', 'role="tab">清晰原图 × 光学</button>'),
  ('id="wipe-tag-left">Blur gaussiano</span>', 'id="wipe-tag-left">Gaussian blur</span>', 'id="wipe-tag-left">高斯模糊</span>'),
  ('<span class="wipe-tag right">Óptico · Double-Gauss f/2</span>', '<span class="wipe-tag right">Optical · Double-Gauss f/2</span>', '<span class="wipe-tag right">光学 · Double-Gauss f/2</span>'),
  ('id="wipe-loading">traçando raios…</div>', 'id="wipe-loading">tracing rays…</div>', 'id="wipe-loading">正在追踪光线…</div>'),
  ('<h3>Energia, não média</h3>', '<h3>Energy, not averaging</h3>', '<h3>是能量，不是平均</h3>'),
  ('<p>Uma luz forte continua forte depois do desfoque. A lente redistribui a energia num disco; o gaussiano tira a média de pixels já clipados e apaga o brilho.</p>',
   '<p>A bright light stays bright after defocus. The lens redistributes its energy into a disc; a Gaussian averages already-clipped pixels and kills the glow.</p>',
   '<p>强光虚化后依然明亮。镜头把能量重新分布成光斑；高斯模糊则对已经溢出的像素取平均，亮度随之消失。</p>'),
  ('<h3>Forma da íris</h3>', '<h3>Iris shape</h3>', '<h3>光圈形状</h3>'),
  ('<p>As lâminas do diafragma desenham o bokeh. Feche a abertura e o círculo vira heptágono; arredonde as lâminas e ele volta a ser redondo.</p>',
   '<p>The aperture blades draw the bokeh. Stop down and the circle becomes a heptagon; round the blades and it turns circular again.</p>',
   '<p>光圈叶片决定焦外的形状。收小光圈，圆形变成七边形；叶片做成圆弧，它又会变回圆形。</p>'),
  ('<h3>Cat-eye nas bordas</h3>', '<h3>Cat-eye at the edges</h3>', '<h3>边缘的猫眼</h3>'),
  ('<p>Fora do eixo, o feixe é recortado pelo vidro da frente e pelo de trás. O disco vira um olho de gato que aponta para o centro do quadro.</p>',
   '<p>Off-axis, the beam is clipped by the front and rear glass. The disc becomes a cat\'s eye pointing to the center of the frame.</p>',
   '<p>离轴时，光束会被前后镜片裁切，光斑变成指向画面中心的猫眼。</p>'),
  ('<h3>Frente ≠ fundo</h3>', '<h3>Front ≠ back</h3>', '<h3>前景 ≠ 背景</h3>'),
  ('<p>Com aberração esférica, o desfoque antes e depois do plano de foco é diferente: anel brilhante de um lado, centro macio do outro.</p>',
   '<p>With spherical aberration, blur in front of and behind the focus plane differs: a bright ring on one side, a soft center on the other.</p>',
   '<p>存在球差时，焦平面前后的虚化不同：一侧是明亮的光环，另一侧是柔和的中心。</p>'),
  ('<h3>Cor por comprimento de onda</h3>', '<h3>Color by wavelength</h3>', '<h3>按波长分色</h3>'),
  ('<p>Cada vidro tem índice e dispersão próprios. Vermelho, verde e azul focam em lugares diferentes e criam franjas nas bordas do disco.</p>',
   '<p>Each glass has its own index and dispersion. Red, green and blue focus at different places and create fringes on the disc edges.</p>',
   '<p>每种玻璃都有自己的折射率和色散。红、绿、蓝在不同位置对焦，在光斑边缘形成色边。</p>'),
  ('<h3>Profundidade e oclusão</h3>', '<h3>Depth and occlusion</h3>', '<h3>深度与遮挡</h3>'),
  ('<p>Com RGB + depth, cada plano recebe o desfoque da sua distância e o primeiro plano encobre os discos de trás — sem halo da cor do sujeito.</p>',
   '<p>With RGB + depth, each plane gets the blur of its own distance and the foreground covers the discs behind it — with no halo of the subject\'s color.</p>',
   '<p>使用 RGB + 深度时，每个平面按自身距离虚化，前景遮住后面的光斑——不会出现主体颜色的光晕。</p>'),
  # ---- 02 ----
  ('<p class="label reveal">02 — Renders do app</p>', '<p class="label reveal">02 — App renders</p>', '<p class="label reveal">02 — 应用渲染</p>'),
  ('<h2 class="reveal">O que muda <em>dentro</em> do desfoque.</h2>', '<h2 class="reveal">What changes <em>inside</em> the blur.</h2>', '<h2 class="reveal">虚化<em>内部</em>的变化。</h2>'),
  ('<p class="lead reveal">Saídas reais do simulador. Arraste cada divisória.</p>', '<p class="lead reveal">Real output from the simulator. Drag each divider.</p>', '<p class="lead reveal">模拟器的真实输出。拖动每条分隔线。</p>'),
  ('<figcaption><b>Aberração esférica com sinal.</b> Negativa: anel duro na borda. Positiva: centro denso e borda que some. O mesmo raio de desfoque, duas texturas diferentes — um blur não tem como saber isso.</figcaption>',
   '<figcaption><b>Signed spherical aberration.</b> Negative: a hard ring at the edge. Positive: a dense center and a fading edge. Same blur radius, two different textures — a blur filter has no way to know this.</figcaption>',
   '<figcaption><b>正负球差。</b>负球差：边缘出现硬光环；正球差：中心密实、边缘渐隐。同样的虚化半径，两种不同的质感——模糊滤镜无从得知。</figcaption>'),
  ('<figcaption><b>Eclipse por amostra da pupila.</b> Um objeto entre a luz e a lente bloqueia só parte dos raios. O disco vira meia-lua com borda suave — não um círculo recortado por máscara.</figcaption>',
   '<figcaption><b>Per-pupil-sample eclipse.</b> An object between the light and the lens blocks only some of the rays. The disc becomes a soft-edged crescent — not a circle cut by a mask.</figcaption>',
   '<figcaption><b>按光瞳采样的遮挡。</b>光源与镜头之间的物体只挡住部分光线，光斑变成边缘柔和的月牙——而不是被蒙版切掉的圆。</figcaption>'),
  ('<figcaption><b>Gotas no vidro frontal.</b> Mesma lente, mesma imagem: com foco a 0,6 m as gotas aparecem como pequenas lentes; com foco a 5 m elas se dissolvem, como acontece numa câmera de verdade.</figcaption>',
   '<figcaption><b>Drops on the front glass.</b> Same lens, same image: focused at 0.6 m the drops show up as tiny lenses; focused at 5 m they dissolve, just like in a real camera.</figcaption>',
   '<figcaption><b>前镜片上的水滴。</b>同一支镜头、同一张图：对焦 0.6 m 时水滴像一个个小透镜；对焦 5 m 时它们化开，和真实相机一样。</figcaption>'),
  # ---- 03 ----
  ('<p class="label reveal">03 — Laboratório ao vivo</p>', '<p class="label reveal">03 — Live lab</p>', '<p class="label reveal">03 — 实时实验室</p>'),
  ('<h2 class="reveal">Mexa nos <em>vidros</em>.</h2>', '<h2 class="reveal">Move the <em>glass</em>.</h2>', '<h2 class="reveal">动手调整<em>镜片</em>。</h2>'),
  ('Esta é uma versão leve do motor, rodando no seu navegador. Arraste um vidro para movê-lo, as alças azuis para mudar a curvatura e as laranjas para abrir ou fechar o diafragma. A barra sob a lente foca. O bokeh à direita é recalculado a cada movimento.',
   'This is a lightweight version of the engine running in your browser. Drag a glass element to move it, the blue handles to change curvature and the orange ones to open or close the aperture. The bar under the lens focuses. The bokeh on the right is recomputed on every move.',
   '这是在浏览器中运行的轻量版引擎。拖动镜片可以移动它，蓝色手柄改变曲率，橙色手柄开大或收小光圈，镜头下方的横条用于对焦。右侧的焦外会随每次操作重新计算。'),
  ('<div><span>Focal</span>', '<div><span>Focal length</span>', '<div><span>焦距</span>'),
  ('<div><span>Abertura</span>', '<div><span>Aperture</span>', '<div><span>光圈</span>'),
  ('<div><span>Foco em</span>', '<div><span>Focus at</span>', '<div><span>对焦距离</span>'),
  ('<div><span>Spot RMS</span>', '<div><span>RMS spot</span>', '<div><span>RMS 弥散斑</span>'),
  ('<div><span>Luz na borda</span>', '<div><span>Edge light</span>', '<div><span>边缘光量</span>'),
  ('</i>raios do eixo</span>', '</i>axial rays</span>', '</i>轴上光线</span>'),
  ('</i>raios do campo</span>', '</i>field rays</span>', '</i>视场光线</span>'),
  ('</i>curvatura</span>', '</i>curvature</span>', '</i>曲率</span>'),
  ('</i>íris</span>', '</i>iris</span>', '</i>光圈</span>'),
  ('<label>Abertura <output', '<label>Aperture <output', '<label>光圈 <output'),
  ('<label>Distância de foco <output', '<label>Focus distance <output', '<label>对焦距离 <output'),
  ('<label>Luzes do fundo <output', '<label>Background lights <output', '<label>背景光源距离 <output'),
  ('<label>Campo dos raios <output', '<label>Ray field height <output', '<label>光线视场高度 <output'),
  ('<label>Lâminas <output', '<label>Blades <output', '<label>光圈叶片 <output'),
  ('<label>Curvatura das lâminas <output', '<label>Blade curvature <output', '<label>叶片圆度 <output'),
  ('<label>Dispersão dos vidros <output', '<label>Glass dispersion <output', '<label>玻璃色散 <output'),
  ('<label class="seg">Raios a partir de', '<label class="seg">Rays from', '<label class="seg">光线起点'),
  ('<button data-v="focus" class="on">Foco</button><button data-v="bg">Fundo</button>', '<button data-v="focus" class="on">Focus</button><button data-v="bg">Background</button>', '<button data-v="focus" class="on">焦点</button><button data-v="bg">背景</button>'),
  ('<span class="scene-tag">Sensor 36 × 24 mm · luzes de fundo + frente</span>', '<span class="scene-tag">Sensor 36 × 24 mm · background + foreground lights</span>', '<span class="scene-tag">传感器 36 × 24 mm · 背景 + 前景光源</span>'),
  ('<figcaption>Bokeh · centro</figcaption>', '<figcaption>Bokeh · center</figcaption>', '<figcaption>焦外 · 中心</figcaption>'),
  ('<figcaption>Bokeh · borda</figcaption>', '<figcaption>Bokeh · edge</figcaption>', '<figcaption>焦外 · 边缘</figcaption>'),
  ('<figcaption>Bokeh · frente</figcaption>', '<figcaption>Bokeh · front</figcaption>', '<figcaption>焦外 · 前景</figcaption>'),
  ('<figcaption id="spot-cap">Spot no foco</figcaption>', '<figcaption id="spot-cap">Spot at focus</figcaption>', '<figcaption id="spot-cap">焦点弥散斑</figcaption>'),
  ('<span>Superfície</span>', '<span>Surface</span>', '<span>镜面</span>'),
  ('<label>Raio de curvatura · mm<input', '<label>Radius of curvature · mm<input', '<label>曲率半径 · mm<input'),
  ('<label>Espessura seguinte · mm<input', '<label>Next thickness · mm<input', '<label>到下一面厚度 · mm<input'),
  ('<label>Diâmetro · mm<input', '<label>Diameter · mm<input', '<label>直径 · mm<input'),
  ('<span>Índice n<sub>d</sub></span>', '<span>Index n<sub>d</sub></span>', '<span>折射率 n<sub>d</sub></span>'),
  ('<span>Abbe V<sub>d</sub></span>', '<span>Abbe V<sub>d</sub></span>', '<span>阿贝数 V<sub>d</sub></span>'),
  ('id="e-autofocus">Focar</button>', 'id="e-autofocus">Focus</button>', 'id="e-autofocus">对焦</button>'),
  ('id="e-reset">Restaurar</button>', 'id="e-reset">Reset</button>', 'id="e-reset">还原</button>'),
  ('Traçado real de raios em 3D (Snell vetorial, superfícies esféricas, recorte por diâmetro e íris poligonal) com dispersão por Abbe em três comprimentos de onda. Simplificado para a web: sem Fresnel, coatings, ghosts, difração ou depth. O app completo traça no Vulkan/CUDA com até 1024 amostras por pixel.',
   'Real 3D ray tracing (vector Snell, spherical surfaces, diameter clipping and polygonal iris) with Abbe-based dispersion at three wavelengths. Simplified for the web: no Fresnel, coatings, ghosts, diffraction or depth. The full app traces on Vulkan/CUDA with up to 1024 samples per pixel.',
   '真实的三维光线追踪（矢量斯涅尔定律、球面、直径裁切和多边形光圈），并按阿贝数在三个波长上计算色散。为网页做了简化：没有菲涅尔、镀膜、鬼影、衍射和深度。完整应用在 Vulkan/CUDA 上追踪，每像素最多 1024 个采样。'),
  # ---- 04 ----
  ('<p class="label reveal">04 — O app</p>', '<p class="label reveal">04 — The app</p>', '<p class="label reveal">04 — 应用</p>'),
  ('<h2 class="reveal">Do vidro ao <em>pixel</em>.</h2>', '<h2 class="reveal">From glass to <em>pixel</em>.</h2>', '<h2 class="reveal">从镜片到<em>像素</em>。</h2>'),
  ('Escolha a lente, abra uma imagem, vídeo ou mapa de profundidade e veja a prévia na GPU. Edite a prescrição, acompanhe o caminho da luz e a forma do desfoque no centro e no campo.',
   'Pick a lens, open an image, video or depth map and see the preview on the GPU. Edit the prescription, follow the light path and the blur shape at the center and across the field.',
   '选择镜头，打开图片、视频或深度图，在 GPU 上实时预览。编辑镜头处方，查看光路以及画面中心和边缘的虚化形状。'),
  ('alt="Interface do Simulador de Desfoque: entrada nítida à esquerda e saída com bokeh óptico à direita"', 'alt="Lens Blur Simulator interface: sharp input on the left and optical bokeh output on the right"', 'alt="镜头虚化模拟器界面：左侧为清晰原图，右侧为光学焦外输出"'),
  ('alt="Painel \'O caminho da luz\' com o traçado dos raios pela lente"', 'alt="\'Light path\' panel with rays traced through the lens"', 'alt="“光路”面板，显示穿过镜头的光线"'),
  ('alt="Painel \'A forma do desfoque\' com PSF no centro e no campo"', 'alt="\'Blur shape\' panel with the PSF at the center and in the field"', 'alt="“虚化形状”面板，显示中心和视场的 PSF"'),
  ('<b>Imagem, vídeo e depth</b><span>RGB + profundidade com cobertura por canal de cor; exporta PNG e MP4 quadro a quadro.</span>',
   '<b>Image, video and depth</b><span>RGB + depth with per-channel coverage; exports PNG and frame-by-frame MP4.</span>',
   '<b>图片、视频与深度</b><span>RGB + 深度，按颜色通道计算覆盖；导出 PNG 和逐帧 MP4。</span>'),
  ('<b>Prévia × render</b><span>Qualidades de Draft (24) a Extreme (1024 amostras) com prévia e render independentes.</span>',
   '<b>Preview × render</b><span>Quality from Draft (24) to Extreme (1024 samples), with independent preview and render settings.</span>',
   '<b>预览 × 渲染</b><span>质量从 Draft（24）到 Extreme（1024 采样），预览与渲染可分别设置。</span>'),
  ('<b>Coatings, ghosts e difração</b><span>Coating AR por interface, reflexos entre superfícies e estrelas de difração orientadas pelas lâminas.</span>',
   '<b>Coatings, ghosts and diffraction</b><span>Per-interface AR coating, reflections between surfaces and diffraction stars oriented by the blades.</span>',
   '<b>镀膜、鬼影与衍射</b><span>逐界面增透镀膜、镜面间反射，以及随叶片方向的衍射星芒。</span>'),
  ('<b>Prescrição editável</b><span>Curvatura, espessura, diâmetro e índice de cada superfície, com o desenho sincronizado.</span>',
   '<b>Editable prescription</b><span>Curvature, thickness, diameter and index of every surface, with the drawing kept in sync.</span>',
   '<b>可编辑处方</b><span>每个镜面的曲率、厚度、直径和折射率，图示同步更新。</span>'),
  # ---- 05 ----
  ('<p class="label reveal">05 — Biblioteca</p>', '<p class="label reveal">05 — Library</p>', '<p class="label reveal">05 — 镜头库</p>'),
  ('<h2 class="reveal"><span class="count" data-to="200">0</span>+ lentes<br>para <em>escolher</em>.</h2>',
   '<h2 class="reveal"><span class="count" data-to="200">0</span>+ lenses<br>to <em>choose</em> from.</h2>',
   '<h2 class="reveal"><span class="count" data-to="200">0</span>+ 款镜头<br><em>任你选择</em>。</h2>'),
  ('Double-Gauss, Sonnar, Tessar, Petzval, triplets, anamórficas e retrofocus. Cada perfil muda o modelo óptico, a focal, o tamanho dos vidros, a abertura máxima e o diafragma.',
   'Double-Gauss, Sonnar, Tessar, Petzval, triplets, anamorphics and retrofocus. Each profile changes the optical model, focal length, glass size, maximum aperture and iris.',
   '双高斯、松纳、天塞、佩兹伐、三片式、变形宽银幕和反远摄。每个配置都会改变光学模型、焦距、镜片尺寸、最大光圈和光圈结构。'),
  ('placeholder="Buscar lente, fabricante, família…" aria-label="Buscar lente"', 'placeholder="Search lens, maker, family…" aria-label="Search lens"', 'placeholder="搜索镜头、厂商、结构…" aria-label="搜索镜头"'),
  ('<th data-k="name">Lente</th><th data-k="focal">Focal</th><th data-k="f">Abertura</th>', '<th data-k="name">Lens</th><th data-k="focal">Focal</th><th data-k="f">Aperture</th>', '<th data-k="name">镜头</th><th data-k="focal">焦距</th><th data-k="f">光圈</th>'),
  ('<th data-k="family">Família</th><th data-k="blades">Lâminas</th><th data-k="look">Caráter</th>', '<th data-k="family">Family</th><th data-k="blades">Blades</th><th data-k="look">Character</th>', '<th data-k="family">结构</th><th data-k="blades">叶片</th><th data-k="look">风格</th>'),
  # ---- 06 ----
  ('<p class="label reveal">06 — Motor</p>', '<p class="label reveal">06 — Engine</p>', '<p class="label reveal">06 — 引擎</p>'),
  ('<h2 class="reveal">Raios de verdade, <em>na GPU</em>.</h2>', '<h2 class="reveal">Real rays, <em>on the GPU</em>.</h2>', '<h2 class="reveal">真实光线，<em>GPU 计算</em>。</h2>'),
  ('<span>amostras ópticas por pixel e canal no modo Extreme</span>', '<span>optical samples per pixel and channel in Extreme mode</span>', '<span>Extreme 模式下每像素每通道的光学采样数</span>'),
  ('<span>mais rápido que CPU na construção do atlas de raios em Vulkan (RTX 4090)</span>', '<span>faster than CPU when building the ray atlas in Vulkan (RTX 4090)</span>', '<span>Vulkan 构建光线图集相比 CPU 的加速倍数（RTX 4090）</span>'),
  ('<span>menos salto de borda na composição cromática com depth (v0.8.8)</span>', '<span>less edge jump in chromatic compositing with depth (v0.8.8)</span>', '<span>带深度的色彩合成中边缘跳变的降幅（v0.8.8）</span>'),
  ('<span>testes automatizados de energia, foco, depth e GPU</span>', '<span>automated tests for energy, focus, depth and GPU</span>', '<span>针对能量、对焦、深度和 GPU 的自动化测试</span>'),
  ('<b>Prescrição</b><span>superfícies, vidros, diafragma</span>', '<b>Prescription</b><span>surfaces, glass, aperture stop</span>', '<b>镜头处方</b><span>镜面、玻璃、光圈</span>'),
  ('<b>Traçado</b><span>Snell + Fresnel em compute Vulkan</span>', '<b>Tracing</b><span>Snell + Fresnel in Vulkan compute</span>', '<b>光线追踪</b><span>Vulkan 计算着色器中的斯涅尔 + 菲涅尔</span>'),
  ('<b>Atlas PSF</b><span>por campo, canal e abertura</span>', '<b>PSF atlas</b><span>per field, channel and aperture</span>', '<b>PSF 图集</b><span>按视场、通道和光圈</span>'),
  ('<b>Composição</b><span>RGB + depth em luz linear</span>', '<b>Compositing</b><span>RGB + depth in linear light</span>', '<b>合成</b><span>线性光下的 RGB + 深度</span>'),
  ('<b>Saída</b><span>prévia, PNG, MP4, plugins</span>', '<b>Output</b><span>preview, PNG, MP4, plugins</span>', '<b>输出</b><span>预览、PNG、MP4、插件</span>'),
  # ---- 07 ----
  ('<p class="label reveal">07 — Plataformas</p>', '<p class="label reveal">07 — Platforms</p>', '<p class="label reveal">07 — 平台</p>'),
  ('<h2 class="reveal">Uma lente, <em>sete</em> lugares.</h2>', '<h2 class="reveal">One lens, <em>seven</em> places.</h2>', '<h2 class="reveal">一支镜头，<em>七个</em>平台。</h2>'),
  ('<li><b>Add-on</b> Blender</li>', '<li><b>Add-on</b> Blender</li>', '<li><b>插件</b> Blender</li>'),
  ('<li><b>Nós</b> ComfyUI</li>', '<li><b>Nodes</b> ComfyUI</li>', '<li><b>节点</b> ComfyUI</li>'),
  ('<span>Idioma:</span>', '<span>Language:</span>', '<span>语言：</span>'),
  ('<span>Add-on Bruxos Physical Lens</span>', '<span>Bruxos Physical Lens add-on</span>', '<span>Bruxos Physical Lens 插件</span>'),
  ('>Baixar add-on · v', '>Download add-on · v', '>下载插件 · v'),
  ('>Pacote completo (.zip)</a>', '>Full package (.zip)</a>', '>完整包（.zip）</a>'),
  ('<span>Nós Bruxos WebGL para ComfyUI</span>', '<span>Bruxos WebGL nodes for ComfyUI</span>', '<span>ComfyUI 的 Bruxos WebGL 节点</span>'),
  ('<em class="tag ok">Baixar atualização</em>', '<em class="tag ok">Download update</em>', '<em class="tag ok">下载更新</em>'),
  ('<p class="lead reveal">O mesmo motor óptico e a mesma biblioteca no app e nos plugins.</p>', '<p class="lead reveal">The same optical engine and the same library in the app and the plugins.</p>', '<p class="lead reveal">应用与插件共享同一个光学引擎和同一套镜头库。</p>'),
  ('<b>App desktop</b>', '<b>Desktop app</b>', '<b>桌面应用</b>'),
  ('<span>Efeito nativo · 16/32 bpc</span>', '<span>Native effect · 16/32 bpc</span>', '<span>原生特效 · 16/32 bpc</span>'),
  ('<span>Plugin OpenFX · entrada de depth</span>', '<span>OpenFX plugin · depth input</span>', '<span>OpenFX 插件 · 支持深度输入</span>'),
  ('<i class="new">novo</i>', '<i class="new">new</i>', '<i class="new">新</i>'),
  ('<span>Plugin para composição nodal</span>', '<span>Plugin for node-based compositing</span>', '<span>节点式合成插件</span>'),
  ('<span>Filtro para fotos e camadas</span>', '<span>Filter for photos and layers</span>', '<span>照片与图层滤镜</span>'),
  ('>Instalar · v', '>Install · v', '>安装 · v'),
  ('>Baixar .zip · v', '>Download .zip · v', '>下载 .zip · v'),
  ('<span><b>Já tem uma versão antiga instalada?</b> Rode a atualização 0.9.6.20 (idiomas) para atualizar versões anteriores sem reinstalar.</span>',
   '<span><b>Already have an older version installed?</b> Run the 0.9.6.20 update (languages) to update previous versions without reinstalling.</span>',
   '<span><b>已经装了旧版本？</b>运行 0.9.6.20 更新（多语言），无需重新安装即可升级旧版本。</span>'),
  ('<span class="soon-label">Em breve</span>', '<span class="soon-label">Coming soon</span>', '<span class="soon-label">即将推出</span>'),
  ('<p class="soon-text">Próximas integrações do mesmo motor óptico:</p>', '<p class="soon-text">Upcoming integrations of the same optical engine:</p>', '<p class="soon-text">同一光学引擎即将支持：</p>'),
  # ---- footer ----
  ('<p>Perfis de lentes são modelos ópticos aproximados de designs reais ou estudos de família, salvo indicação. Nomes de fabricantes pertencem aos seus titulares. Prescrição Double-Gauss de referência: LensSim (MIT).</p>',
   '<p>Lens profiles are approximate optical models of real designs or family studies unless stated otherwise. Manufacturer names belong to their respective owners. Reference Double-Gauss prescription: LensSim (MIT).</p>',
   '<p>除特别说明外，镜头配置均为真实设计的近似光学模型或结构研究。厂商名称归各自所有者所有。参考双高斯处方：LensSim（MIT）。</p>'),
]

def build(col, out, lang_code):
    html = SRC
    missing = []
    for row in T:
        pt, tr = row[0], row[col]
        if pt not in html:
            missing.append(pt[:70]); continue
        html = html.replace(pt, tr)
    html = re.sub(r'(<a class="dl-main") href="[^"]*"( data-pt="[^"]*" data-en="([^"]*)" data-zh="([^"]*)")',
                  lambda m: f'{m.group(1)} href="{m.group(3) if lang_code == "en" else m.group(4)}"{m.group(2)}', html)
    html = re.sub(r'(<a href="[^"]*-PT-BR-Setup[^"]*" download) class="on">', r'\1>', html)
    html = re.sub(r'(<a href="[^"]*-' + {'en': 'EN', 'zh': 'ZH-CN'}[lang_code] + r'-Setup[^"]*" download)>', r'\1 class="on">', html)
    html = html.replace('data-lang="pt" class="on"', 'data-lang="pt"').replace(f'data-lang="{lang_code}"', f'data-lang="{lang_code}" class="on"')
    (ROOT / out).write_text(html, encoding='utf-8')
    return missing

ok = True
for col, out, code in [(1, 'en.html', 'en'), (2, 'zh.html', 'zh')]:
    miss = build(col, out, code)
    if miss:
        ok = False
        print(f'[{out}] trechos não encontrados no index.html:')
        for m in miss: print('  -', m)
    else:
        print(f'{out} gerado.')
sys.exit(0 if ok else 1)
