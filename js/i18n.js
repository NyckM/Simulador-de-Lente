// Textos usados pelo JavaScript. O idioma vem do <html lang="..."> de cada página
// (index.html = pt-BR, en.html = en, zh.html = zh-CN).
const htmlLang = (document.documentElement.lang || 'pt').toLowerCase();
export const LANG = htmlLang.startsWith('zh') ? 'zh' : htmlLang.startsWith('en') ? 'en' : 'pt';

const S = {
  pt: {
    circular: 'circular', stop: 'diafragma', invalid: 'Geometria inválida: superfícies se cruzariam.',
    dragFocus: '↔ arraste para focar', nearSensor: 'PERTO DO SENSOR · ±3 mm', sensor: 'SENSOR',
    noImage: 'Sem imagem real: a lente não converge esse ponto.', onSensor: 'Foco paraxial no sensor.',
    focusMsg: (d, before, e) => `Foco paraxial ${d} mm ${before ? 'antes' : 'depois'} do sensor · extensão ${e} mm`,
    noLight: 'sem luz', gauss: 'Blur gaussiano', input: 'Entrada nítida', optical: 'Óptico',
    pinHdr: 'Highlight HDR mantém a energia', pinCat: 'Cat-eye: o vidro recorta o disco', pinBlade: '7 lâminas desenham a forma',
    pinCA: 'Franja cromática na borda', pinFocus: 'Plano de foco: nítido nos dois',
    all: 'Todas', count: (a, b) => `${a} de ${b} perfis listados nesta página.`,
  },
  en: {
    circular: 'circular', stop: 'aperture stop', invalid: 'Invalid geometry: surfaces would intersect.',
    dragFocus: '↔ drag to focus', nearSensor: 'NEAR THE SENSOR · ±3 mm', sensor: 'SENSOR',
    noImage: 'No real image: the lens does not converge this point.', onSensor: 'Paraxial focus on the sensor.',
    focusMsg: (d, before, e) => `Paraxial focus ${d} mm ${before ? 'in front of' : 'behind'} the sensor · extension ${e} mm`,
    noLight: 'no light', gauss: 'Gaussian blur', input: 'Sharp input', optical: 'Optical',
    pinHdr: 'HDR highlight keeps its energy', pinCat: 'Cat-eye: the glass clips the disc', pinBlade: '7 blades draw the shape',
    pinCA: 'Chromatic fringe on the edge', pinFocus: 'Focus plane: sharp on both sides',
    all: 'All', count: (a, b) => `${a} of ${b} profiles listed on this page.`,
  },
  zh: {
    circular: '圆形', stop: '光圈', invalid: '几何无效：镜面会相交。',
    dragFocus: '↔ 拖动对焦', nearSensor: '传感器附近 · ±3 mm', sensor: '传感器',
    noImage: '没有实像：镜头无法会聚这个点。', onSensor: '近轴焦点位于传感器上。',
    focusMsg: (d, before, e) => `近轴焦点在传感器${before ? '前' : '后'} ${d} mm · 镜组伸出 ${e} mm`,
    noLight: '无光', gauss: '高斯模糊', input: '清晰原图', optical: '光学',
    pinHdr: 'HDR 高光保留能量', pinCat: '猫眼：镜片裁切光斑', pinBlade: '7 片光圈叶片决定形状',
    pinCA: '光斑边缘的色散', pinFocus: '对焦平面：两侧都清晰',
    all: '全部', count: (a, b) => `本页列出 ${a} / ${b} 个镜头配置。`,
  },
};
export const t = (k) => S[LANG][k];

// número com vírgula decimal só em português
export const num = (v, d) => { const s = v.toFixed(d); return LANG === 'pt' ? s.replace('.', ',') : s; };

// Presets do laboratório
const PRESET_TXT = {
  en: {
    dgauss: ['Double-Gauss 50 mm', 'Public prescription (LensSim / PBRT, MIT). The classic base of 50 mm normal lenses.'],
    triplet: ['Cooke Triplet 50 mm', 'Three-element family (1893). Scaled teaching study.'],
    petzval: ['Petzval 85 mm', '19th-century portrait lens: sharp center, curved field and swirl. Teaching study.'],
    singlet: ['Simple lens 50 mm', 'A single plano-convex glass: uncorrected spherical and chromatic aberration.'],
  },
  zh: {
    dgauss: ['双高斯 50 mm', '公开的镜头处方（LensSim / PBRT，MIT）。经典 50 mm 标准镜头的基础结构。'],
    triplet: ['库克三片式 50 mm', '三片式结构（1893）。按比例缩放的教学示例。'],
    petzval: ['佩兹伐 85 mm', '19 世纪人像镜头：中心锐利、场曲和旋焦。教学示例。'],
    singlet: ['单片镜 50 mm', '一片平凸透镜：未校正的球差和色差。'],
  },
};
export function presetText(key, p) {
  const tr = PRESET_TXT[LANG]?.[key];
  return tr ? { name: tr[0], note: tr[1] } : { name: p.name, note: p.note };
}

// Tabela de lentes
const FAM = {
  en: { 'Anamórfica': 'Anamorphic', 'Apodização': 'Apodization', 'Grande-angular simétrica': 'Symmetric wide-angle', 'Simétrica': 'Symmetric', 'Singleto': 'Singlet', 'Tilt criativo': 'Creative tilt', 'Zoom cine': 'Cine zoom', 'Tele': 'Telephoto' },
  zh: { 'Anamórfica': '变形宽银幕', 'Apodização': '切趾', 'Cine': '电影镜头', 'Distagon': 'Distagon', 'Double-Gauss': '双高斯', 'Grande-angular simétrica': '对称广角', 'Heliar': 'Heliar', 'Macro': '微距', 'Petzval': '佩兹伐', 'Primoplan': 'Primoplan', 'Retrofocus': '反远摄', 'Simétrica': '对称式', 'Singleto': '单片', 'Soft focus': '柔焦', 'Sonnar': '松纳', 'Tele': '长焦', 'Tessar': '天塞', 'Tilt criativo': '创意移轴', 'Triplet': '三片式', 'Zoom cine': '电影变焦' },
};
const NAME = {
  en: { '(estudo)': '(study)', 'Lente simples plano-convexa 50 mm': 'Simple plano-convex lens 50 mm', 'Menisco Wollaston 50 mm': 'Wollaston meniscus 50 mm', '(prescrição LensSim)': '(LensSim prescription)' },
  zh: { '(estudo)': '（研究）', 'Lente simples plano-convexa 50 mm': '平凸单片镜 50 mm', 'Menisco Wollaston 50 mm': '沃拉斯顿弯月镜 50 mm', '(prescrição LensSim)': '（LensSim 处方）' },
};
const LOOK = {
  en: {
    'Cooke look moderno': 'modern Cooke look', 'Heliar clássica': 'classic Heliar', 'abertura extrema': 'extreme aperture', 'adaptador 2×': '2× adapter',
    'alemã vintage': 'German vintage', 'anamórfica acessível': 'affordable anamorphic', 'anamórfica moderna': 'modern anamorphic', 'apocromática': 'apochromatic',
    'apodização moderna': 'modern apodization', 'asférica': 'aspherical', 'aérea': 'aerial', 'bokeh bolha de sabão': 'soap-bubble bokeh', 'bokeh cremoso': 'creamy bokeh',
    'bokeh limpo': 'clean bokeh', 'bokeh perfeito': 'perfect bokeh', 'bokeh redondo': 'round bokeh', 'bokeh suave': 'soft bokeh', 'borda borrada': 'blurred edges',
    'campo curvo': 'curved field', 'campo raso extremo': 'extremely shallow depth', 'cat-eye forte': 'strong cat-eye', 'centro nítido': 'sharp center', 'clínica': 'clinical',
    'coma no campo': 'field coma', 'compacta': 'compact', 'compacta 1.5×': 'compact 1.5×', 'compacta luminosa': 'compact and fast', 'compacta soviética': 'compact Soviet',
    'compressão': 'compression', 'compressão suave': 'gentle compression', 'contraste': 'contrast', 'contraste alto': 'high contrast', 'contraste baixo': 'low contrast',
    'contraste suave': 'soft contrast', 'cor quente': 'warm color', 'correção extrema': 'extreme correction', 'corrigida': 'corrected', 'câmera de caixão': 'box camera',
    'didático': 'teaching', 'distorção baixa': 'low distortion', 'equilibrada': 'balanced', 'esférica e cromática puras': 'pure spherical and chromatic aberration',
    'esférica intencional': 'intentional spherical', 'filtro apodizador': 'apodization filter', 'flare azul': 'blue flare', 'flare azul clássico': 'classic blue flare',
    'flare característico': 'signature flare', 'flare e estrelas': 'flare and sunstars', 'flare quente': 'warm flare', 'flare âmbar': 'amber flare', 'foco com shift': 'focus shift',
    'glow em f/1.4': 'glow at f/1.4', 'grande-angular luminosa': 'fast wide-angle', 'heptágono fechado': 'heptagon when stopped down', 'hexágono': 'hexagon',
    'histórico': 'historic', 'macro sonda': 'probe macro', 'macro suave': 'soft macro', 'microcontraste': 'micro-contrast', 'moderna': 'modern', 'médio formato': 'medium format',
    'médio formato luminoso': 'fast medium format', 'neutra': 'neutral', 'nitidez clássica': 'classic sharpness', 'nítida': 'sharp', 'olho de águia': "eagle's eye",
    'oval': 'oval', 'oval 2×': '2× oval', 'oval moderno': 'modern oval', 'panqueca': 'pancake', 'pele suave': 'soft skin', 'pentágono': 'pentagon', 'ponto doce': 'sweet spot',
    'pontos de luz': 'point lights', 'primeira retrofocus': 'first retrofocus', 'quente': 'warm', 'rangefinder vintage': 'vintage rangefinder',
    'referência documentada': 'documented reference', 'retrato': 'portrait', 'retrato APS-C': 'APS-C portrait', 'retrato acessível': 'affordable portrait',
    'retrato clássico': 'classic portrait', 'retrato de estúdio séc. XIX': '19th-century studio portrait', 'retrato moderno': 'modern portrait', 'retrato vintage': 'vintage portrait',
    'sem breathing': 'no breathing', 'sem distorção': 'no distortion', 'sem onion-ring': 'no onion rings', 'swirl acentuado': 'pronounced swirl', 'swirl criativo': 'creative swirl',
    'swirl e anel': 'swirl and ring', 'swirl extremo': 'extreme swirl', 'swirl forte': 'strong swirl', 'swirl leve': 'subtle swirl', 'séc. XIX': '19th century',
    'tele clássica': 'classic telephoto', 'tele leve': 'light telephoto', 'tele luminosa': 'fast telephoto', 'tório': 'thorium', 'veludo': 'velvet', 'vintage cine': 'vintage cine',
    'zoom anamórfico': 'anamorphic zoom', 'zoom de cinema': 'cinema zoom',
  },
  zh: {
    'Cooke look': 'Cooke 风格', 'Cooke look moderno': '现代 Cooke 风格', 'Heliar clássica': '经典 Heliar', 'Rolleiflex': '禄来', 'Waterhouse': '沃特豪斯光圈',
    'abertura extrema': '极大光圈', 'adaptador 2×': '2× 转接镜', 'alemã vintage': '德系老镜', 'anamórfica acessível': '平价变形镜', 'anamórfica moderna': '现代变形镜',
    'apocromática': '复消色差', 'apodização moderna': '现代切趾', 'asférica': '非球面', 'aérea': '航空镜头', 'bokeh bolha de sabão': '肥皂泡焦外', 'bokeh cremoso': '奶油焦外',
    'bokeh limpo': '干净焦外', 'bokeh master': '焦外大师', 'bokeh perfeito': '完美焦外', 'bokeh redondo': '圆形焦外', 'bokeh suave': '柔和焦外', 'borda borrada': '边缘模糊',
    'campo curvo': '场曲', 'campo raso extremo': '极浅景深', 'cat-eye': '猫眼', 'cat-eye forte': '强烈猫眼', 'centro nítido': '中心锐利', 'cine 16 mm': '16 mm 电影',
    'clínica': '极致锐利', 'coating T*': 'T* 镀膜', 'coma no campo': '边缘彗差', 'compacta': '小巧', 'compacta 1.5×': '小巧 1.5×', 'compacta luminosa': '小巧大光圈',
    'compacta soviética': '苏联小巧镜', 'compressão': '空间压缩', 'compressão suave': '柔和压缩', 'contraste': '高反差', 'contraste alto': '高对比', 'contraste baixo': '低对比',
    'contraste suave': '柔和对比', 'cor quente': '暖色调', 'correção extrema': '极致校正', 'corrigida': '校正良好', 'câmera de caixão': '箱式相机', 'didático': '教学',
    'distorção baixa': '低畸变', 'dream lens': '梦幻镜', 'equilibrada': '均衡', 'esférica e cromática puras': '纯球差与色差', 'esférica intencional': '刻意球差',
    'filtro apodizador': '切趾滤镜', 'flare azul': '蓝色眩光', 'flare azul clássico': '经典蓝色眩光', 'flare característico': '标志性眩光', 'flare e estrelas': '眩光与星芒',
    'flare quente': '暖色眩光', 'flare âmbar': '琥珀色眩光', 'foco com shift': '焦点偏移', 'focus shift': '焦点偏移', 'glow': '柔光', 'glow em f/1.4': 'f/1.4 柔光',
    'grande-angular luminosa': '大光圈广角', 'halo': '光晕', 'heptágono fechado': '收光圈呈七边形', 'hexágono': '六边形', 'histórico': '历史名镜', 'macro sonda': '探针微距',
    'macro suave': '柔和微距', 'microcontraste': '微反差', 'moderna': '现代', 'médio formato': '中画幅', 'médio formato luminoso': '大光圈中画幅', 'neutra': '中性',
    'nitidez clássica': '经典锐度', 'nítida': '锐利', 'olho de águia': '鹰眼', 'oval': '椭圆', 'oval 2×': '2× 椭圆', 'oval moderno': '现代椭圆', 'panqueca': '饼干镜',
    'pele suave': '柔和肤色', 'pentágono': '五边形', 'ponto doce': '甜点', 'pontos de luz': '点光源', 'primeira retrofocus': '首款反远摄', 'quente': '暖调',
    'rangefinder vintage': '旁轴老镜', 'referência documentada': '有文献依据', 'retrato': '人像', 'retrato APS-C': 'APS-C 人像', 'retrato acessível': '平价人像',
    'retrato clássico': '经典人像', 'retrato de estúdio séc. XIX': '19 世纪影棚人像', 'retrato moderno': '现代人像', 'retrato vintage': '复古人像', 'sem breathing': '无呼吸效应',
    'sem distorção': '无畸变', 'sem onion-ring': '无洋葱圈', 'swirl': '旋焦', 'swirl acentuado': '明显旋焦', 'swirl criativo': '创意旋焦', 'swirl e anel': '旋焦与光环',
    'swirl extremo': '极致旋焦', 'swirl forte': '强烈旋焦', 'swirl leve': '轻微旋焦', 'séc. XIX': '19 世纪', 'tele clássica': '经典长焦', 'tele leve': '轻便长焦',
    'tele luminosa': '大光圈长焦', 'tório': '钍玻璃', 'veludo': '丝绒', 'vintage': '复古', 'vintage EBC': '复古 EBC 镀膜', 'vintage cine': '复古电影镜', 'zoom anamórfico': '变形变焦',
    'zoom de cinema': '电影变焦',
  },
};
export function lensRow(l) {
  if (LANG === 'pt') return l;
  let name = l[0];
  for (const [a, b] of Object.entries(NAME[LANG])) name = name.replace(a, b);
  const fam = FAM[LANG][l[3]] || l[3];
  const look = l[5].split(', ').map((x) => LOOK[LANG][x] || x).join(LANG === 'zh' ? '，' : ', ');
  return [name, l[1], l[2], fam, l[4], look];
}
