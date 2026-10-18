'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const view=require('../web/lens-view.js');
const cases=JSON.parse(fs.readFileSync(0,'utf8'));
for(const data of cases){
 const start=view.projection(data);
 for(const meters of [.3,.5,2,5,10,20]){
  const wanted=view.withFocus(data,meters,data.settings.filmback_mm);
  const shift=data.sensor_z_mm-wanted.sensor_z_mm;
  assert.ok(Math.abs(view.focusAfterTranslation(data,shift)-meters)<1e-6);
  const projected=view.projection(wanted);
  assert.equal(projected.sensorX,start.sensorX);
  assert.equal(projected.scale,start.scale);
  assert.ok(Math.abs((projected.x(0)-start.x(0))-shift*start.scale)<1e-9);
  const again=view.withFocus(wanted,meters,data.settings.filmback_mm);
  assert.equal(again.sensor_z_mm,wanted.sensor_z_mm);
 }
 assert.ok(Math.abs(view.focusAfterTranslation(data,1e6)-20)<1e-6);
 assert.ok(Math.abs(view.focusAfterTranslation(data,-1e6)-.3)<1e-6);
 // Returning from a rack does not accumulate incremental drift.
 let changed=data;for(const meters of [.5,10,.3,5,2])changed=view.withFocus(changed,meters,data.settings.filmback_mm);
 assert.ok(Math.abs(changed.sensor_z_mm-view.plane(data,2)-data.settings.filmback_mm)<1e-9);
}
console.log('Foco bidirecional, sensor fixo, limites e retorno: OK');
