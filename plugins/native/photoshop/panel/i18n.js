(function(root){
'use strict';
const LANGUAGES=['pt-BR','en','zh-CN'];
function create(catalog,initial='pt-BR'){
 let language=LANGUAGES.includes(initial)?initial:'pt-BR',cache=new Map();
 const normalized=new Map(),fragments=[],patterns=[];
 const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 function parts(s){const out=[];let at=0;const rx=/\$\{|\{\d+\}/g;let m;while((m=rx.exec(s))){out.push(s.slice(at,m.index));if(m[0][0]==='$'){let end=rx.lastIndex,level=1;while(end<s.length&&level){if(s[end]==='{')level++;if(s[end]==='}')level--;end++;}out.push({slot:s.slice(m.index,end)});rx.lastIndex=end;at=end;}else{out.push({slot:m[0]});at=rx.lastIndex;}}out.push(s.slice(at));return out;}
 for(const [source,entry]of Object.entries(catalog)){
  const key=source.trim().normalize('NFC');if(!key)continue;normalized.set(key,entry);
  const p=parts(key);if(p.some(x=>typeof x!=='string')){patterns.push({p,entry,rx:new RegExp('^'+p.map(x=>typeof x==='string'?escape(x):'(.+?)').join('')+'$')});}
  else if(key.length>=4)fragments.push(key);
 }
 patterns.sort((a,b)=>b.p.filter(x=>typeof x==='string').join('').length-a.p.filter(x=>typeof x==='string').join('').length);
 const fragmentRX=new RegExp(fragments.sort((a,b)=>b.length-a.length).map(escape).join('|'),'g');
 function translate(text){
  if(typeof text!=='string'||!text.trim())return text;
  if(cache.has(text))return cache.get(text);
  const key=text.trim().normalize('NFC'),entry=normalized.get(key);let result;
  if(entry)result=entry[language].trim();
  else for(const rule of patterns){const m=key.match(rule.rx);if(!m)continue;const values=new Map();let i=1;for(const part of rule.p)if(typeof part!=='string')values.set(part.slot,m[i++]);result=parts(rule.entry[language]).map(p=>typeof p==='string'?p:(values.get(p.slot)||'')).join('');break;}
  if(result===undefined)result=key.replace(fragmentRX,(match,offset)=>{
   // Whole words only; never rewrite parts of file names, codes or identifiers.
   const before=key[offset-1]||'',after=key[offset+match.length]||'';
   if(/[\p{L}\p{N}_]/u.test(before)&&/[\p{L}\p{N}_]/u.test(match[0])||/[\p{L}\p{N}_]/u.test(after)&&/[\p{L}\p{N}_]/u.test(match.slice(-1)))return match;
   return normalized.get(match)[language].trim();
  });
  result=text.slice(0,text.indexOf(text.trim()))+result+text.slice(text.indexOf(text.trim())+text.trim().length);
  if(cache.size>3000)cache.clear();cache.set(text,result);return result;
 }
 return {t:translate,setLanguage(value){language=LANGUAGES.includes(value)?value:'pt-BR';cache.clear();return language;},get language(){return language;}};
}
function attach(doc,translator){
 const records=new WeakMap(),attributes=new WeakMap();let observer;
 const skip=node=>node.parentElement?.closest('script,style,code,pre,textarea,[data-i18n-skip]');
 function applyText(node){if(skip(node))return;const last=records.get(node),value=node.nodeValue;const source=last&&value===last.output?last.source:value;const output=translator.t(source);records.set(node,{source,output});if(output!==value)node.nodeValue=output;}
 function applyAttributes(el){if(el.closest?.('[data-i18n-skip]'))return;let saved=attributes.get(el);if(!saved){saved={};attributes.set(el,saved);}for(const key of ['title','placeholder','aria-label','label']){if(!el.hasAttribute(key))continue;const value=el.getAttribute(key),last=saved[key],source=last&&value===last.output?last.source:value,output=translator.t(source);saved[key]={source,output};if(value!==output)el.setAttribute(key,output);}}
 function tree(node){if(node.nodeType===3){applyText(node);return;}if(node.nodeType!==1&&node.nodeType!==9)return;if(node.nodeType===1)applyAttributes(node);for(const child of [...node.childNodes])tree(child);}
 function observe(){observer?.observe(doc.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['title','placeholder','aria-label','label']});}
 if(typeof MutationObserver!=='undefined'){observer=new MutationObserver(changes=>{observer.disconnect();for(const change of changes){if(change.type==='childList')for(const added of change.addedNodes)tree(added);else if(change.type==='characterData')applyText(change.target);else applyAttributes(change.target);}observe();});observe();}
 return {refresh(){observer?.disconnect();tree(doc.documentElement);doc.documentElement.lang=translator.language;observe();},stop(){observer?.disconnect();}};
}
const api={create,attach,languages:LANGUAGES};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root?.document&&!(typeof module!=='undefined'&&module.exports)){
 let saved='pt-BR';try{saved=root.localStorage.getItem('bruxos-language')||saved;}catch(e){}
 const translator=create(root.BruxosTranslations||{},saved),dom=attach(root.document,translator);root.BruxosI18n=Object.assign(translator,{refresh:dom.refresh});
 root.document.addEventListener('DOMContentLoaded',()=>{
  const aside=root.document.querySelector('.controls'),picker=root.document.createElement('div');picker.className='language-picker';picker.dataset.i18nSkip='';
  const label=root.document.createElement('label');label.htmlFor='app-language';label.textContent='Idioma / Language / 语言';const select=root.document.createElement('select');select.id='app-language';select.setAttribute('aria-label','Idioma / Language / 语言');
  for(const [value,name]of [['pt-BR','Português'],['en','English'],['zh-CN','简体中文']]){const option=root.document.createElement('option');option.value=value;option.textContent=name;select.append(option);}select.value=translator.language;
  let revision=0,nativeSave=Promise.resolve();
  function saveNative(language){nativeSave=nativeSave.then(()=>root.pywebview?.api?.set_language?.(language)).catch(()=>{});}
  select.onchange=()=>{revision++;translator.setLanguage(select.value);try{root.localStorage.setItem('bruxos-language',translator.language);}catch(e){}dom.refresh();root.document.dispatchEvent(new CustomEvent('languagechange',{detail:translator.language}));saveNative(translator.language);};picker.append(label,select);aside?.prepend(picker);dom.refresh();
  function nativeReady(){const api=root.pywebview?.api;if(!api?.get_ui_language)return;const requested=revision;api.get_ui_language().then(prefs=>{if(revision!==requested)return;if(LANGUAGES.includes(prefs?.language)){select.value=prefs.language;select.onchange();}else saveNative(translator.language);}).catch(()=>{});}
  root.addEventListener('pywebviewready',nativeReady);if(root.pywebview?.api)nativeReady();
 });
}
})(typeof window!=='undefined'?window:undefined);
