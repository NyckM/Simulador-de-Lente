const assert=require('node:assert/strict');
const view=require('../web/lens-view.js');
const fs=require('node:fs');
for(const data of JSON.parse(fs.readFileSync(0,'utf8'))){
 const a=view.aperture(data,data.settings.iris_mm);
 assert.ok(Math.abs(a.fNumber-data.aperture.f_number)<1e-10);
 for(const f of [a.minF,2.8,4,5.6,8,11,16,22,32,a.maxF]){
  const radius=view.radiusForFNumber(data,f);
  const result=view.aperture(data,radius);
  assert.ok(Math.abs(result.fNumber-Math.max(a.minF,Math.min(a.maxF,f)))<1e-9);
 }
 assert.equal(view.radiusForFNumber(data,.1),8.55);
 assert.equal(view.radiusForFNumber(data,10000),.5);
 assert.ok(Math.abs(view.irisAfterDrag(4,100,95.9,1)-5)<1e-9);
 assert.ok(Math.abs(view.irisAfterDrag(4,100,104.1,-1)-5)<1e-9);
 assert.equal(view.irisAfterDrag(4,100,100,1),4);
 assert.equal(view.irisAfterDrag(4,0,-1000,1),8.55);
 assert.equal(view.irisAfterDrag(4,0,1000,1),.5);
}
