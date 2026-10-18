const DepthUtils=(()=>{
 function binary(values){for(const value of values)if(!Number.isFinite(value)||(Math.abs(value)>1e-6&&Math.abs(value-1)>1e-6))return false;return true;}
 function rgbaBinary(values){const result={r:true,g:true,b:true,a:true,luma:true};for(let i=0;i<values.length;i+=4){for(const [j,key]of ['r','g','b','a'].entries())if(values[i+j]!==0&&values[i+j]!==255)result[key]=false;if(!(values[i]===values[i+1]&&values[i]===values[i+2]&&(values[i]===0||values[i]===255)))result.luma=false;}return result;}
 function mode(settings,classification){if(settings.depth_mode==='cut'||settings.depth_mode==='slicing')return settings.depth_mode;return classification&&!advanced(settings)?'cut':'slicing';}
 function meters(t,near,far){return 1/((1-t)/near+t/far);}
 function position(m,near,far){return Math.max(0,Math.min(1,(1/m-1/near)/(1/far-1/near)));}
 const keys=['depth_units','depth_normalize','depth_low','depth_high','depth_curve','depth_mapping','depth_gain','depth_bias'];
 function advanced(s){return (s.depth_units??'relative')!=='relative'||(s.depth_normalize??'off')!=='off'||(s.depth_curve??1)!==1||(s.depth_mapping??'inverse')!=='inverse'||(s.depth_gain??1)!==1||(s.depth_bias??0)!==0;}
 function key(s,near=s.near_m,far=s.far_m,invert=s.invert_depth){return JSON.stringify(keys.map(k=>s[k]).concat(near,far,!!invert));}
 function prepare(values,s,{near=s.near_m,far=s.far_m,invert=s.invert_depth}={}){
  if(!Number.isFinite(near)||!Number.isFinite(far)||near<=0||near>=far)throw Error('Depth: limites próximo e distante inválidos.');
  const n=values.length,stride=Math.max(1,Math.ceil(n/65536)),sample=[],metric=s.depth_units==='meters';
  let rawMin=Infinity,rawMax=-Infinity;for(let i=0;i<n;i++)if(Number.isFinite(values[i])&&(!metric||values[i]>0)){rawMin=Math.min(rawMin,values[i]);rawMax=Math.max(rawMax,values[i]);if(i%stride===0)sample.push(values[i])}if(!sample.length&&Number.isFinite(rawMin))for(const v of values)if(Number.isFinite(v)&&(!metric||v>0))sample.push(v);if(s.depth_normalize==='percentile')sample.sort((a,b)=>a-b);
  const q=p=>{const f=p*(sample.length-1),i=Math.floor(f);return sample[i]+(sample[Math.min(i+1,sample.length-1)]-sample[i])*(f-i)};
  let low=Number.isFinite(rawMin)?rawMin:0,high=Number.isFinite(rawMax)?rawMax:0;const normal=s.depth_normalize??'off';
  if(normal==='percentile'&&sample.length){low=q(.01);high=q(.99)}else if(normal==='manual'){low=s.depth_low;high=s.depth_high}else if(normal==='off'){low=0;high=1}
  const flat=high-low<=1e-12,nearness=new Float32Array(n),normalized=new Float32Array(n),distance=new Float32Array(n),valid=new Uint8Array(n),clamp=v=>Math.max(0,Math.min(1,v));let invalid=0,isBinary=true;
  for(let i=0;i<n;i++){const raw=values[i],adjusted=raw*(s.depth_gain??1)+(s.depth_bias??0),ok=Number.isFinite(raw)&&(!metric||(raw>0&&Number.isFinite(adjusted)&&adjusted>0));valid[i]=ok?1:0;let d,m;
   if(metric){m=ok?Math.max(near,Math.min(far,adjusted)):far;d=(1/m-1/far)/(1/near-1/far);normalized[i]=clamp((m-near)/(far-near));}
   else{normalized[i]=flat?.5:clamp(((ok?raw:0)-low)/(high-low));d=clamp(normalized[i]*(s.depth_gain??1)+(s.depth_bias??0));if(invert)d=1-d;d=d**(s.depth_curve??1);m=s.depth_mapping==='linear'?far-d*(far-near):1/(1/far+d*(1/near-1/far));if(s.depth_mapping==='linear')d=(1/m-1/far)/(1/near-1/far);if(!ok){d=0;m=far}}
   nearness[i]=d;distance[i]=m;if(!ok)invalid++;if(d>1e-6&&d<1-1e-6)isBinary=false;
  }
  let mappedMin=Infinity,mappedMax=-Infinity;for(let i=0;i<n;i++)if(valid[i]){mappedMin=Math.min(mappedMin,nearness[i]);mappedMax=Math.max(mappedMax,nearness[i]);}
  const collapsed=Number.isFinite(mappedMin)&&mappedMax-mappedMin<=1e-6&&rawMax-rawMin>1e-6;
  const warnings=[];if(collapsed)warnings.push('collapsed_depth_mapping');if(flat&&!metric&&normal!=='off')warnings.push('constant_normalization');if(invalid)warnings.push('invalid_depth_far_fallback');
  return {nearness,normalized,distance_m:distance,valid,statistics:{low,high,raw_min:Number.isFinite(rawMin)?rawMin:null,raw_max:Number.isFinite(rawMax)?rawMax:null,invalid,total:n,constant:flat,collapsed,binary:isBinary,sample_stride:stride},warnings};
 }
 function rangeSummary(values,s){
  const metric=s.depth_units==='meters',stride=Math.max(1,Math.ceil(values.length/65536));let min=Infinity,max=-Infinity,valid=0,below=0,above=0,sample=[];
  for(let i=0;i<values.length;i++){const raw=values[i],v=metric?raw*(s.depth_gain??1)+(s.depth_bias??0):raw;if(!Number.isFinite(raw)||!Number.isFinite(v)||(metric&&(raw<=0||v<=0)))continue;valid++;min=Math.min(min,v);max=Math.max(max,v);if(metric&&v<s.near_m)below++;if(metric&&v>s.far_m)above++;if(i%stride===0)sample.push(v)}
  // Sparse masks can miss every sample on the fixed stride. Never invent quantiles.
  if(valid&&!sample.length)for(const raw of values){const v=metric?raw*(s.depth_gain??1)+(s.depth_bias??0):raw;if(Number.isFinite(raw)&&Number.isFinite(v)&&(!metric||(raw>0&&v>0)))sample.push(v)}
  sample.sort((a,b)=>a-b);const q=p=>{if(!sample.length)return null;const f=p*(sample.length-1),i=Math.floor(f);return sample[i]+(sample[Math.min(i+1,sample.length-1)]-sample[i])*(f-i)};
  return {units:metric?'meters':'relative',min:valid?min:null,max:valid?max:null,p01:q(.01),median:q(.5),p99:q(.99),valid,invalid:values.length-valid,total:values.length,below,above,sample_stride:stride};
 }
 function suggestRange(summary,robust=true){
  if(summary.units!=='meters'||!summary.valid)return null;
  const low=robust?summary.p01:summary.min,high=robust?summary.p99:summary.max;
  if(!(high>low)||low<.3||high>1000||low>=100||high<.4)return null;
  return {near:low,far:high};
 }
 function focusPrepared(d,settings,{near,far},classification){
  if(settings.depth_mode==='cut'&&settings.depth_feather>0){d=blurTransition([d],settings)[0];}
  else if(mode(settings,classification)==='cut')d=d>=(settings.depth_mode==='cut'?(settings.depth_cut??.5):.5)?1:0;
  return meters(1-d,near,far);
 }
 function focusDistance(value,settings,range,classification,invert=settings.invert_depth,bounds=null){
  const s=bounds?{...settings,depth_normalize:'manual',depth_low:bounds.low,depth_high:bounds.high}:settings;
  if(bounds&&bounds.high-bounds.low<=1e-12){s.depth_low=0;s.depth_high=1;value=.5;}
  const d=prepare([value],s,{...range,invert}).nearness[0];return focusPrepared(d,settings,range,classification);
 }

 function blurTransition(values,s){
  if(s.depth_mode!=='cut'||!(s.depth_feather>0))return values;
  return Float32Array.from(values,d=>{const t=Math.max(0,Math.min(1,(d-s.depth_cut+s.depth_feather)/(2*s.depth_feather)));return t*t*(3-2*t);});
 }

 function focusAnchor(s,near=s.near_m,far=s.far_m){const f=(1/s.focus_m-1/far)/(1/near-1/far);return f>1e-6&&f<1-1e-6?f:0;}
 function focusPartition(x,f,n,inverse=false){if(!f)return x;const a=Math.min(n-2,Math.max(1,Math.floor(f*(n-1)+.5)))/(n-1);return inverse?(x<=a?x*f/a:f+(x-a)*(1-f)/(1-a)):(x<=f?x*a/f:a+(x-f)*(1-a)/(1-f));}
 return {focusAnchor,focusPartition,rangeSummary,suggestRange,focusDistance,focusPrepared,binary,rgbaBinary,mode,meters,position,advanced,key,prepare,keys,blurTransition};
})();if(typeof module!=='undefined')module.exports=DepthUtils;
