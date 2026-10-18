/* Immutable saved snapshots; working edits never change a saved profile. */
const ProfileStore=(()=>{
 const schema='optica-lab/lens-profile/1',key='optica-lab-user-profiles-v1';
 const clone=value=>JSON.parse(JSON.stringify(value));
 function parse(raw){if(!raw||raw.schema!==schema||typeof raw.name!=='string'||!raw.name.trim()||raw.name.trim().length>80||!raw.snapshot||typeof raw.snapshot.settings!=='object'||!raw.snapshot.settings||Array.isArray(raw.snapshot.settings))throw Error('Perfil de lente inválido.');const s=raw.snapshot;
 if(!['draft','fast','medium','high','veryhigh','extreme'].includes(s.quality)||!['draft','fast','medium','high','veryhigh','extreme'].includes(s.exportQuality)||!['1920','3840','4096','source'].includes(s.exportSize)||![24,25,30,60].includes(s.fps)||typeof s.useDepth!=='boolean')throw Error('Configuração do perfil inválida.');
 return {schema,id:typeof raw.id==='string'&&/^user-[a-z0-9-]+$/.test(raw.id)?raw.id:null,name:raw.name.trim(),snapshot:clone(s)};}
 function create(name,snapshot,id){return parse({schema,id,name,snapshot});}
 function load(storage){const entries=JSON.parse(storage.getItem(key)||'[]');if(!Array.isArray(entries)||entries.length>100)throw Error('Biblioteca de perfis inválida.');const ids=new Set();return entries.map(raw=>{const p=parse(raw);if(!p.id||ids.has(p.id))throw Error('Identificação de perfil inválida.');ids.add(p.id);return p;});}
 function save(storage,entries){if(entries.length>100)throw Error('Limite de 100 perfis atingido.');const checked=entries.map(parse);storage.setItem(key,JSON.stringify(checked));return checked;}
 return {schema,key,clone,parse,create,load,save};
})();
if(typeof module!=='undefined')module.exports=ProfileStore;
