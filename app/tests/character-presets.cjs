const assert=require('node:assert'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');vm.runInThisContext(fs.readFileSync(path.join(root,'web/character-looks.js'),'utf8'));
assert.deepStrictEqual(LensCharacterLooks.catalog,JSON.parse(fs.readFileSync(path.join(root,'data/character-looks.json'),'utf8')));
const original={focus_m:3.25,iris_mm:7,lens_model:'zeiss',filters:[{kind:'prism',rotation:23}],depth_gain:.7,near_m:1,far_m:10,lens_edits:[{radius:12}]};
for(const look of LensCharacterLooks.catalog){const changed=LensCharacterLooks.apply(original,look.id);for(const key of Object.keys(original))assert.deepStrictEqual(changed[key],original[key]);assert.notStrictEqual(changed,original);const reset=LensCharacterLooks.reset(changed);for(const key of LensCharacterLooks.keys)assert.deepStrictEqual(reset[key],LensCharacterLooks.catalog[0].app[key]);}
assert.throws(()=>LensCharacterLooks.apply(original,'invalid'));console.log('Character presets: catalog, isolation, reset and invalid ID passed');
