const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),P=require('../web/profile-store.js');
let saved=null;const storage={getItem:()=>saved,setItem:(key,value)=>{saved=value;}};
const snapshot={settings:{lens_model:'helios_44_2',focus_m:3,iris_mm:4,lens_edits:[[0,'curvature_radius',38]],swirl:.9},quality:'fast',exportQuality:'high',exportSize:'4096',fps:25,useDepth:true};
const profile=P.create(' Minha lente ',snapshot,'user-one');snapshot.settings.lens_edits[0][2]=99;
assert.equal(profile.snapshot.settings.lens_edits[0][2],38);
P.save(storage,[profile,P.create('Segunda',profile.snapshot,'user-two')]);
let entries=P.load(storage);entries[0].snapshot.settings.focus_m=99;assert.equal(P.load(storage)[0].snapshot.settings.focus_m,3);
const imported=P.parse(JSON.parse(JSON.stringify(profile)));assert.deepEqual(imported,profile);
assert.throws(()=>P.parse({...profile,snapshot:{...profile.snapshot,fps:999}}));assert.throws(()=>P.create(' ',profile.snapshot));
// Run the actual application reset and restore functions with mocked UI/network.
const app=fs.readFileSync(require.resolve('../web/app.js'),'utf8');
const apply=app.slice(app.indexOf('async function applyPreset('),app.indexOf("$('preset').onchange=()=>applyPreset"));
const store=app.slice(app.indexOf('async function storeProfile('),app.indexOf("$('save-profile').onclick="));
const restore=app.slice(app.indexOf('async function restoreProfile('),app.indexOf('async function storeProfile('));
const context=vm.createContext({assert,ProfileStore:P,profile,console,localStorage:storage,crypto:{randomUUID:()=>'three'}});
vm.runInContext(`
const elements={};const $=id=>elements[id]||(elements[id]={value:'',checked:false});
const defaults={lens_model:'dgauss50',focus_m:.8,iris_mm:8.55,swirl:0,blades:7,lens_edits:[]};
let settings={...defaults,focus_m:7,swirl:1.9,lens_edits:[[0,'curvature_radius',35]]},quality='draft',exportQuality='extreme';
const LensPresets={dgauss50:{},helios_44_2:{look:{swirl:.85,blades:8}}};
let userProfiles=[profile],offlineBusy=false,recorder=null,depthBusy=false,layoutRevision=0,lensDraftEdits=null,depth={};
const messages=[];const notify=e=>messages.push(e),drawDiagram=()=>{},sync=()=>{},presetNote=()=>{},persist=()=>{},scheduleKernel=()=>{},requestDraw=()=>{},scheduleDiagnostics=()=>{};
const refreshProfiles=id=>{$('preset').value=id;};
const snapshot=()=>({settings:ProfileStore.clone(settings),quality,exportQuality,exportSize:$('export-size').value,fps:Number($('export-fps').value),useDepth:$('use-depth').checked});
const post=async()=>({aperture:{max_iris_mm:10}}),validateSnapshot=async()=>({aperture:{max_iris_mm:10}});
`,context);
vm.runInContext(apply+String.fromCharCode(10)+restore+String.fromCharCode(10)+store,context);
(async()=>{
 await vm.runInContext(`(async()=>{$('preset').value='helios_44_2';await applyPreset({reset:true});assert.equal(settings.focus_m,.8);assert.equal(settings.swirl,.85);assert.equal(settings.blades,8);assert.equal(settings.lens_edits.length,0);assert.equal(quality,'medium');assert.equal(exportQuality,'veryhigh');assert.equal($('export-size').value,'3840');
 $('preset').value='deakinizer';settings.focus_m=3;await applyPreset();assert.equal(settings.focus_m,3);assert.equal(settings.swirl,1.7);assert.equal(settings.coma,.65);assert.equal(settings.spherical3,0);assert.equal(settings.diffusion,0);assert.equal(settings.blades,0);settings.swirl=0;await applyPreset({reset:true});assert.equal(settings.swirl,1.7);
 $('preset').value='user-one';await applyPreset({reset:true});assert.equal(settings.focus_m,3);assert.equal(settings.lens_edits[0][2],38);assert.equal(quality,'fast');assert.equal(exportQuality,'high');assert.equal($('export-size').value,'4096');assert.equal($('export-fps').value,'25');assert.equal($('use-depth').checked,true);
 settings.lens_edits[0][2]=999;assert.equal(profile.snapshot.settings.lens_edits[0][2],38);depth=null;await applyPreset({reset:true});assert.equal($('use-depth').checked,false);assert.equal(settings.lens_edits[0][2],38);
 $('profile-name').value='Minha nova';await storeProfile(false);assert.equal(userProfiles.length,2);assert.equal($('preset').value,'user-three');assert.equal(userProfiles[1].snapshot.settings.lens_edits[0][2],38);settings.lens_edits[0][2]=39;assert.equal(userProfiles[1].snapshot.settings.lens_edits[0][2],38);$('profile-name').value='Minha revisada';await storeProfile(true);assert.equal(userProfiles[1].name,'Minha revisada');assert.equal(userProfiles[1].snapshot.settings.lens_edits[0][2],39);assert.equal(userProfiles[0].snapshot.settings.lens_edits[0][2],38);assert.equal(ProfileStore.load(localStorage)[1].name,'Minha revisada');
})()`,context);
})().catch(e=>{console.error(e);process.exitCode=1;});
