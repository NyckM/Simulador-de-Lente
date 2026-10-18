const D=require('../web/depth-utils.js'),assert=require('assert');
const base={near_m:2,far_m:10,depth_units:'meters',depth_gain:1,depth_bias:0,depth_normalize:'off',depth_curve:1,depth_mapping:'inverse',invert_depth:false};
const p=D.prepare([2,4,10,NaN,0,-1],base);assert.deepEqual([...p.valid],[1,1,1,0,0,0]);assert.deepEqual([...p.distance_m],[2,4,10,10,10,10]);assert(Math.abs(p.nearness[1]-.375)<1e-7);
const s=D.rangeSummary([1,2,4,10,20,NaN,0],base);assert.equal(s.below,1);assert.equal(s.above,1);assert.equal(s.invalid,2);assert.equal(s.median,4);assert.deepEqual(D.suggestRange(s,false),{near:1,far:20});
const adjusted={...base,depth_gain:2,depth_bias:-3};assert.deepEqual([...D.prepare([1,2,4],adjusted).valid],[0,1,1]);assert.deepEqual([...D.prepare([1,2,4],adjusted).distance_m],[10,2,5]);assert.equal(D.rangeSummary([1,2,4],adjusted).invalid,1);
assert.equal(D.suggestRange(D.rangeSummary([4,4],base)),null);assert.equal(D.suggestRange(D.rangeSummary([NaN,0],base)),null);assert.equal(D.suggestRange(D.rangeSummary([.01,5000],base)),null);
const relative={...base,depth_units:'relative',depth_normalize:'minmax'};assert.equal(D.suggestRange(D.rangeSummary([.2,.8],relative)),null);
assert.deepEqual([...D.prepare([.2,.8],relative).distance_m],[10,2]);assert.deepEqual([...D.prepare([.2,.8],{...relative,invert_depth:true}).distance_m],[2,10]);
// Only valid pixels fall between deterministic stride locations.
const sparse=new Float32Array(131073).fill(NaN);sparse[1]=.2;sparse[2]=.8;
const normalized=D.prepare(sparse,{...relative,depth_normalize:'percentile'});assert(Number.isFinite(normalized.statistics.low));assert(normalized.statistics.high>normalized.statistics.low);assert.equal(D.rangeSummary(sparse,relative).valid,2);
const series=Array.from({length:101},(_,i)=>2+i*.08).concat(500);const robust=D.suggestRange(D.rangeSummary(series,base));assert(robust.far<20);assert.equal(D.suggestRange(D.rangeSummary(series,base),false).far,500);
console.log({known_distances:true,metric_transform_validity:true,black_white_direction:true,sparse_masks:true,robust_outlier_range:true,no_relative_meters_inferred:true});
