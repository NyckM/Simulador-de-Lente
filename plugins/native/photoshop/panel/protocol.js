const MAGIC=0x53505842, PROTOCOL=1, MAX_PIXELS=8388608;
function pack(width,height,params,rgba,depth){
 const pixels=width*height;
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>8192||height>8192||pixels>MAX_PIXELS)throw Error('Esta versão aceita até 8 megapixels, com até 8192 pixels por lado.');
 if(rgba.length!==pixels*4||(depth&&depth.length!==pixels))throw Error('Dimensões de imagem/depth incompatíveis.');
 const offset=28+params.length*8, buffer=new ArrayBuffer(offset+rgba.byteLength+(depth?depth.byteLength:0)), view=new DataView(buffer);
 [MAGIC,PROTOCOL,width,height,params.length,depth?1:0,0].forEach((v,i)=>view.setUint32(i*4,v,true));params.forEach((v,i)=>{if(!Number.isFinite(v))throw Error('Parâmetro inválido.');view.setFloat64(28+i*8,v,true);});
 new Float32Array(buffer,offset,rgba.length).set(rgba);if(depth)new Float32Array(buffer,offset+rgba.byteLength,depth.length).set(depth);return buffer;
}
function canvasPixels(raw,image,bounds,width,height,channel=null){
 const depth=channel!==null,scale=depth?(image.componentSize===16?32768:image.componentSize===8?255:1):1;
 if((!depth&&image.componentSize!==32)||image.colorSpace!=='RGB'||(image.components!==3&&image.components!==4))throw Error('Formato de pixels inesperado.');
 if(raw.length!==image.width*image.height*image.components)throw Error('Buffer de pixels incompleto.');
 const result=new Float32Array(width*height*(depth?1:4));const left=Math.round(bounds.left),top=Math.round(bounds.top);
 for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++){
  let dx=left+x,dy=top+y;if(dx<0||dy<0||dx>=width||dy>=height)continue;
  let i=(y*image.width+x)*image.components,j=(dy*width+dx)*(depth?1:4),a=image.components===4?raw[i+3]:1;
  if(depth){let v=channel===3?(image.components===4?a:scale):channel===4?.2126*raw[i]+.7152*raw[i+1]+.0722*raw[i+2]:raw[i+channel];result[j]=Math.min(1,Math.max(0,Number.isFinite(v)?v/scale:0));}
  else{result[j]=raw[i];result[j+1]=raw[i+1];result[j+2]=raw[i+2];result[j+3]=a;}
 }
 return result;
}
function cleanProfile(profile){return (profile||'sRGB IEC61966-2.1').replace(/\s*\(Linear RGB Profile\)\s*/g,'').trim();}
module.exports={pack,canvasPixels,cleanProfile,MAX_PIXELS};
