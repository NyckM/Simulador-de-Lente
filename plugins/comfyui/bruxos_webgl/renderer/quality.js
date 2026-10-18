/* Fixed sampling presets: resolution of export is independent. */
const LensQuality=(()=>{
 const modes={draft:{limit:512,samples:24},fast:{limit:768,samples:48},medium:{limit:1024,samples:96},high:{limit:1280,samples:256,aa:2},veryhigh:{limit:1920,samples:512,aa:2},extreme:{limit:2560,samples:1024,aa:2}};
 function normalize(value){return modes[value]?value:value==='balanced'?'medium':value==='detail'?'high':'medium';}
 function taps(preview,output,highlight,maximum){const wanted=Math.max(modes[normalize(preview)].samples,modes[normalize(output)].samples,highlight||0,32);return Math.min(1024,2**Math.floor(Math.log2(maximum)),2**Math.ceil(Math.log2(wanted)));}
 function pack(values,grid,taps){const out=new Float32Array(values.length);for(let c=0;c<3;c++)for(let t=0;t<taps;t++)for(let y=0;y<grid;y++)for(let x=0;x<grid;x++){const src=(((c*taps+t)*grid+y)*grid+x)*4,dst=((t*grid+y)*grid*3+c*grid+x)*4;for(let k=0;k<4;k++)out[dst+k]=values[src+k];}return out;}
 function previewTarget(target,limit){
  const value=Number(limit),valid=[360,540,720,1080].includes(value);
  return valid?{...target,limit:Math.min(target.limit,value),aa:1}:{...target};
 }
 function previewPlan(target){
  const final={...target,preview:true,stage:'final'};
  const fast={limit:Math.min(target.limit,512),samples:Math.min(target.samples,24),aa:1,preview:true,interactive:true,stage:'interactive'};
  if(fast.limit===target.limit&&fast.samples===target.samples&&!target.aa)return [final];
  const steps=[fast],middle={limit:Math.min(target.limit,768),samples:Math.min(target.samples,96),aa:1,preview:true,interactive:true,stage:'refining'};
  if((middle.limit>fast.limit||middle.samples>fast.samples)&&(middle.limit<target.limit||middle.samples<target.samples||target.aa>1))steps.push(middle);
  steps.push(final);return steps;
 }
 return {modes,normalize,taps,pack,previewTarget,previewPlan};
})();
if(typeof module!=='undefined')module.exports=LensQuality;
