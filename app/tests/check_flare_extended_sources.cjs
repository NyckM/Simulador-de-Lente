const fs=require('fs'),vm=require('vm'),assert=require('assert');
const root=require('path').resolve(__dirname,'..');
const context={window:{},console};vm.createContext(context);vm.runInContext(fs.readFileSync(root+'/web/reflected-ghosts.js','utf8'),context);
const detect=context.window.ReflectedGhosts.detectSources;
const parsed=context.window.ReflectedGhosts.Inspector.parse({uv:[.5,.5],samples:16384,pairs:8,mode:'auto',limit:32,threshold:.8});assert.equal(parsed.samples,16384);assert.equal(parsed.limit,32);
function image(w,h){const a=new Float32Array(w*h*4);for(let i=3;i<a.length;i+=4)a[i]=1;return a;}
function fill(a,w,x0,y0,x1,y1,rgb){for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)a.set([...rgb,1],(y*w+x)*4);}
function sums(s){return s.reduce((a,s)=>a.map((v,i)=>v+s.flux[i]),[0,0,0]);}
function near(a,b,epsilon=1e-5){assert.equal(a.length,b.length);for(let i=0;i<a.length;i++)assert(Math.abs(a[i]-b[i])<epsilon,`${a} != ${b}`);}
const a=image(128,96);fill(a,128,20,20,100,80,[4,2,1]);const extended=detect(a,128,96,.8,8);
assert(extended.length===8);near(sums(extended),[19200,9600,4800]);assert(extended.reduce((v,s)=>v+s.area_pixels,0)===4800);
assert(new Set(extended.map(s=>s.uv[0].toFixed(3))).size>1);assert(new Set(extended.map(s=>s.uv[1].toFixed(3))).size>1);
const centroid=extended.reduce((c,s)=>{const e=s.flux[0];c[0]+=s.uv[0]*e;c[1]+=s.uv[1]*e;return c;},[0,0]);near(centroid.map(v=>v/19200),[60/128,50/96]);
assert.equal(JSON.stringify(detect(a,128,96,.8,8)),JSON.stringify(extended));
const tiny=image(32,24);fill(tiny,32,5,6,7,8,[8,6,3]);fill(tiny,32,25,18,27,20,[8,6,3]);assert.equal(detect(tiny,32,24,.8,4).length,2);
const transparent=a.slice();for(let i=3;i<transparent.length;i+=4)transparent[i]=0;assert.equal(detect(transparent,128,96,.8,8).length,0);
const invalid=image(32,24);invalid.set([NaN,100,1,1],0);invalid.set([Infinity,1,1,1],4);assert.equal(detect(invalid,32,24,.8,8).length,0);
const hdr=image(32,24);hdr.set([100,50,5,.5],0);near(sums(detect(hdr,32,24,.8,8)),[50,25,2.5]);
const two=image(128,96);fill(two,128,5,5,25,25,[2,1,1]);fill(two,128,70,50,110,80,[8,3,1]);near(sums(detect(two,128,96,.8,12)),[10400,4000,1600]);
// A limit of one intentionally selects the most energetic region.
near(sums(detect(two,128,96,.8,1)),[9600,3600,1200]);
const moved=image(128,96);fill(moved,128,24,20,104,80,[4,2,1]);const shifted=detect(moved,128,96,.8,8);near(sums(shifted),sums(extended));assert.notEqual(JSON.stringify(shifted),JSON.stringify(extended));
for(const bad of [0,33,1.5])assert.throws(()=>detect(a,128,96,.8,bad));
const report={passed:true,extended_samples:extended.length,whole_region_rgb:sums(extended),linear_hdr:true,alpha:true,nonfinite_rejected:true,point_lights_preserved:true,position_changes_sources:true,energy_weighted_centroid:true,deterministic:true,budget_limits:true};
fs.writeFileSync(root+'/research/flare-extended-sources-validation.json',JSON.stringify(report,null,2));console.log(report);
