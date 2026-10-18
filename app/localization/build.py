"""Generate shared language dictionaries without changing render/protocol IDs."""
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
folder=root/'localization'
inventory=json.loads((folder/'inventory.json').read_text(encoding='utf-8'))
catalog={}
for line in (folder/'translations.tsv').read_text(encoding='utf-8').splitlines():
 if not line.strip():continue
 index,en,zh=line.split('\t');source=inventory[int(index)]
 catalog[source]={'pt-BR':source,'en':en,'zh-CN':zh}
for line in (folder/'extras.tsv').read_text(encoding='utf-8').splitlines():
 if not line.strip():continue
 source,en,zh=line.split('\t');catalog[source]={'pt-BR':source,'en':en,'zh-CN':zh}
catalog['Simulador de Desfoque da Bruxosdovfx - AE 0.2.1\\rNative lens tracing, external depth, CUDA / CPU.']['pt-BR']=catalog['Simulador de Desfoque da Bruxosdovfx - AE 0.2.1\\rNative lens tracing, external depth, CUDA / CPU.']['pt-BR'].replace('0.2.1','0.2.2')
# Correct a misleading translation: focus means object distance, not focal length.
catalog['Foco (m)']['zh-CN']='对焦距离（米）'
# Consistent Portuguese for UI terms that were previously English.
pt={'Channel':'Canal','Alpha':'Alfa','Red':'Vermelho','Green':'Verde','Blue':'Azul','Gain':'Ganho','Bias':'Deslocamento','Draft':'Rascunho','Fast':'Rápida','Medium':'Média','High':'Alta','Very High':'Muito alta','Extreme':'Extrema','Base Only':'Só base','Highlights Only':'Só altas luzes','Coverage':'Cobertura','Highlight Detail':'Detalhe das altas luzes','Highlight Quality':'Qualidade das altas luzes','Highlight View':'Visualização das altas luzes','Layer A':'Camada A','Layer B':'Camada B','Layer C':'Camada C','Depth Layer A':'Depth da camada A','Depth Layer B':'Depth da camada B','Depth Layer C':'Depth da camada C','Layer A is Glitter':'Camada A como glitter','Layer C is Distortion':'Camada C como distorção','Normalize Glitter':'Normalizar glitter','Glitter Matte':'Máscara do glitter','Threshold':'Limiar','Seed':'Semente','Dither Amount':'Intensidade do dither','Soften Internal Cutoff':'Suavizar recortes internos'}
pt['Clique no vidro; ajuste a superficie abaixo.']='Clique no vidro; ajuste a superfície abaixo.'
for k,v in pt.items():
 if k in catalog:catalog[k]['pt-BR']=v
(folder/'catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2),encoding='utf-8')
packed=json.dumps(catalog,ensure_ascii=False,separators=(',',':'))
(root/'web/i18n-catalog.js').write_text('window.BruxosTranslations='+packed+';\n',encoding='utf-8')
cpp=['#pragma once','#include <cstring>','#include <string>','#include <map>','#include <mutex>','#ifndef BRUXOS_LANGUAGE','#define BRUXOS_LANGUAGE 0','#endif','namespace bruxos_i18n {','struct Entry { const char* source; const char* pt; const char* en; const char* zh; };','static const Entry entries[] = {']
for k,v in catalog.items():
 if '${' in k or '{0}' in k:continue
 def literal(x):return json.dumps(x.replace('\\r','\r'),ensure_ascii=False)
 cpp.append('{'+','.join(literal(x) for x in [k,v['pt-BR'],v['en'],v['zh-CN']])+'},')
cpp.extend(['};','inline const char* tr(const char* s) { for(const auto& e:entries) if(!strcmp(e.source,s)) return BRUXOS_LANGUAGE==2?e.zh:BRUXOS_LANGUAGE==1?e.en:e.pt; return s; }','inline const char* options(const char* s) { static std::mutex mutex; std::lock_guard<std::mutex> guard(mutex); static std::map<std::string,std::string> cache; auto found=cache.find(s); if(found!=cache.end())return found->second.c_str(); std::string source=s,result; size_t start=0; for(;;){auto end=source.find(\'|\',start); if(start)result+=\'|\';result+=tr(source.substr(start,end-start).c_str());if(end==std::string::npos)break;start=end+1;}return cache.emplace(source,result).first->second.c_str(); }','inline const char* paramName(const char* s) { static std::mutex mutex; std::lock_guard<std::mutex> guard(mutex); static std::map<std::string,std::string> cache; auto found=cache.find(s);if(found!=cache.end())return found->second.c_str();std::string value=tr(s);if(value.size()>31){size_t end=31;while(end&&((unsigned char)value[end]&0xc0)==0x80)--end;value.resize(end);}return cache.emplace(s,value).first->second.c_str(); }','}'])
(root/'native/ae/Localization.generated.h').write_text('\n'.join(cpp)+'\n',encoding='utf-8')
print(f'{len(catalog)} translated messages / labels; en, pt-BR, zh-CN')
