'use strict';
// One response buffer; aligned float32 views go directly to WebGL upload.
async function requestLensAtlas(body){
 const options={method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)};
 let response=await fetch('/api/kernel.bin',options);
 if(response.status===404){response=await fetch('/api/kernel',options);const data=await response.json();if(!response.ok)throw Error(data.error||'Atlas indisponível.');return data;}
 if(!response.ok)throw Error((await response.json()).error||'Atlas indisponível.');
 const buffer=await response.arrayBuffer();if(buffer.byteLength<4||buffer.byteLength>10_000_000)throw Error('Tamanho do atlas binário inválido.');
 const length=new DataView(buffer).getUint32(0,true),offset=4+Math.ceil(length/4)*4;
 if(length>1_000_000||offset>buffer.byteLength)throw Error('Cabeçalho de atlas inválido.');
 const data=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,4,length)));
 const count=3*data.taps*data.grid**2*4;
 if(data.wire_schema!=='optica-atlas/1'||data.atlas_layout!=='webgl-packed-f32'||![3,5,9].includes(data.grid)||![32,64,128,256,512,1024].includes(data.taps)||data.array_floats!==count||buffer.byteLength!==offset+count*8)throw Error('Formato de atlas incompatível.');
 if(new Uint8Array(new Uint32Array([1]).buffer)[0]!==1)throw Error('Atlas requer float32 little-endian.');
 data.atlas=new Float32Array(buffer,offset,count);data.pupils=new Float32Array(buffer,offset+count*4,count);
 data.transfer_bytes=buffer.byteLength;return data;
}
window.requestLensAtlas=requestLensAtlas;
