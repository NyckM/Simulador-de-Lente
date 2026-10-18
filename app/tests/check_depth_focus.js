const assert=require('node:assert/strict'),D=require('../web/depth-utils.js');
assert.equal(D.binary([0,1,1,0]),true);assert.equal(D.binary([0,.5,1]),false);
assert.equal(D.mode({depth_mode:'auto'},true),'cut');assert.equal(D.mode({depth_mode:'continuous'},true),'cut');assert.equal(D.mode({depth_mode:'auto'},false),'slicing');assert.equal(D.mode({depth_mode:'auto',depth_gain:2},true),'slicing');assert.equal(D.mode({depth_mode:'cut'},false),'cut');
const rgb=D.rgbaBinary([0,0,0,255,255,255,255,255]);assert.equal(rgb.r,true);assert.equal(rgb.luma,true);assert.equal(D.rgbaBinary([0,0,0,255,128,128,128,255]).luma,false);
assert.equal(D.meters(0,2,5),2);assert.equal(D.meters(1,2,5),5);
for(const value of [0,.1,.3,.5,.9,1])assert.ok(Math.abs(D.position(D.meters(value,2,5),2,5)-value)<1e-12);

const collapsed=D.prepare([0,.3,1],{near_m:.3,far_m:520,depth_gain:-10.27,depth_bias:0,invert_depth:false});assert(collapsed.statistics.collapsed);assert(collapsed.warnings.includes("collapsed_depth_mapping"));
