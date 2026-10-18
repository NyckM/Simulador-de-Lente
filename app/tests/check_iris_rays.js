const assert=require('node:assert/strict'),fs=require('node:fs'),V=require('../web/lens-view.js');
for(const data of JSON.parse(fs.readFileSync(0,'utf8'))){
 const traced=V.withAperture(data,data.settings.iris_mm,19);
 for(let i=0;i<19;i++){
  const expected=data.rays[i],actual=traced.rays[i],passed=expected.length===data.surfaces.length+2;
  assert.equal(traced.ray_passed[i],passed);
  if(passed){assert.equal(actual.length,expected.length);for(let j=0;j<actual.length;j++)for(let k=0;k<2;k++)assert.ok(Math.abs(actual[j][k]-expected[j][k])<1e-7,JSON.stringify({i,j,k,actual:actual[j][k],expected:expected[j][k]}));}
 }
 const count=d=>d.ray_passed.filter(Boolean).length;
 const open=V.withAperture(data,8.55),middle=V.withAperture(data,4.275),closed=V.withAperture(data,2.1375);
 assert.ok(count(closed)<count(middle)&&count(middle)<count(open));
 const halfwidth=d=>Math.max(...d.rays.filter((_,i)=>d.ray_passed[i]).map(r=>Math.abs(r.at(-2)[1])));
 assert.ok(halfwidth(closed)<halfwidth(middle)&&halfwidth(middle)<halfwidth(open));
 const stop=data.surfaces.find(s=>s.is_stop);
 const narrow=V.withAperture(data,.5);
 assert.ok(narrow.rays.some((r,i)=>!narrow.ray_passed[i]&&Math.abs(r.at(-1)[0]-stop.z)<1e-7));
 // Rays blocked by the iris end there instead of reaching the sensor.
 for(let i=0;i<narrow.rays.length;i++)if(!narrow.ray_passed[i])assert.ok(narrow.rays[i].length<data.surfaces.length+2);
}
