const assert=require('assert');const Q=require('../web/quality.js');
assert.equal(Q.normalize('balanced'),'medium');assert.equal(Q.normalize('detail'),'high');
assert.equal(Q.taps('medium','veryhigh',0,2048),512);
assert.equal(Q.taps('draft','fast',1024,2048),1024);
assert.equal(Q.taps('extreme','high',0,256),256);
for(const mode of Object.values(Q.modes)){
 const plan=Q.previewPlan(mode),last=plan.at(-1);
 assert.equal(last.stage,'final');assert.equal(last.limit,mode.limit);assert.equal(last.samples,mode.samples);assert.equal(last.aa,mode.aa);
 assert(plan[0].samples<=24&&plan[0].limit<=512);
 for(let i=1;i<plan.length;i++){assert(plan[i].samples>=plan[i-1].samples);assert(plan[i].limit>=plan[i-1].limit);}
}
// Unique channel, field and sample values detect transposition and RGB cross-talk.
for(const grid of [3,5])for(const taps of [32,512,1024]){
 const src=Float32Array.from({length:3*taps*grid*grid*4},(_,i)=>i),dst=Q.pack(src,grid,taps);
 for(let c=0;c<3;c++)for(let t=0;t<taps;t++)for(let y=0;y<grid;y++)for(let x=0;x<grid;x++)for(let k=0;k<4;k++)
 assert.equal(dst[((t*grid+y)*grid*3+c*grid+x)*4+k],src[(((c*taps+t)*grid+y)*grid+x)*4+k]);
}

for(const limit of [360,540,720,1080]){
 const target={limit:2560,samples:512,aa:2};
 const preview=Q.previewTarget(target,String(limit));
 assert.equal(preview.limit,limit);assert.equal(preview.samples,512);assert.equal(preview.aa,1);
 assert.deepEqual(target,{limit:2560,samples:512,aa:2});
 assert(Q.previewPlan(preview).every(stage=>stage.limit<=limit));
}
assert.deepEqual(Q.previewTarget({limit:1024,samples:96,aa:2},'auto'),{limit:1024,samples:96,aa:2});
assert.equal(Q.previewTarget({limit:512,samples:24},'1080').limit,512);
