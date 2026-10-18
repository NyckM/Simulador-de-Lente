"""Build the original catalogue UI from locally maintained numerical profiles."""
import json
from html import escape
from pathlib import Path

root=Path(__file__).resolve().parents[1]
profiles=json.loads((root/'data/lens_profiles.json').read_text(encoding='utf-8'))
catalogue=json.loads((root/'data/lens_catalogue.json').read_text(encoding='utf-8'))
(root/'data/lens_catalogue.json').write_text(json.dumps(catalogue,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(root/'web/presets.js').write_text('const LensPresets='+json.dumps(profiles,ensure_ascii=False)+';\nconst LensCatalogue='+json.dumps(catalogue,ensure_ascii=False)+';\n',encoding='utf-8')
html=(root/'web/index.html').read_text(encoding='utf-8')
start=html.index('  <select id="preset">');end=html.index('</select>',start)+len('</select>')
groups=[]
for group in dict.fromkeys(e['group'] for e in catalogue):
 options=''.join(f'<option value="{e["model"]}">{escape(e["name"])} · {e["focal_mm"]} mm f/{e["nominal_f"]:g}</option>' for e in catalogue if e['group']==group and e['model'])
 groups.append(f'<optgroup label="{escape(group, quote=True)}">{options}</optgroup>')
select='  <select id="preset">'+''.join(groups)+'<optgroup label="Perfis de aparência · aproximações"><option value="zeiss_planar_50">ZEISS Planar T* 2/50 ZM · aproximação</option><option value="helios_44_2">Helios-44-2 · aproximação</option><option value="swirl">Swirl</option><option value="petzval">Campo curvo</option><option value="deakinizer">Centro limpo / bordas alongadas</option><option value="anamorphic">Anamórfica</option></optgroup></select>'
html=html[:start]+select+html[end:]
anchor='  <div class="profile-actions">'
library='  <details class="lens-library"><summary>Biblioteca de lentes <span>+</span></summary><p class="note">10 construções disponíveis · 9 aguardando prescrição. Reconstruções experimentais, sem calibração de exemplar. Os perfis de aparência ficam separados.</p><label for="lens-search">Buscar modelo ou distância focal</label><input id="lens-search" type="search" placeholder="Ex.: Biotar, 135"><div id="lens-catalogue"></div><p class="note">Pendente: faltam dados completos de superfícies, vidros ou abertura para oferecer este modelo com segurança. Nenhuma lente substituta é aplicada.</p></details>\n'
if 'id="lens-search"' not in html:html=html.replace(anchor,library+anchor)
available=sum(bool(e['model']) for e in catalogue)
pending=len(catalogue)-available
import re
html=re.sub(r'\d+ construções disponíveis · \d+ aguardando prescrição\.',f'{available} construções disponíveis · {pending} aguardando prescrição.',html)
html=html.replace('value="physical">','value="physical" selected>')
(root/'web/index.html').write_text(html,encoding='utf-8')
