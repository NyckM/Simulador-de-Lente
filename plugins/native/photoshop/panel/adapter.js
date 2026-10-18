const {pack,canvasPixels,cleanProfile,MAX_PIXELS}=require('./protocol.js');
const locale=require('./localization.json'),t=require('./i18n.js').create(locale.catalog,locale.language).t;
const URL='http://127.0.0.1:8769',headers={'X-Bruxos-Plugin':'Photoshop-1'};
async function info(fetcher=fetch){const r=await fetcher(URL+'/api/info',{headers});if(!r.ok)throw Error('O motor óptico não respondeu.');const x=await r.json();if(x.plugin!=='BruxosdovfxPhotoshop'||x.protocol!==1)throw Error('Outra aplicação está usando a porta do motor.');if(x.parameterCount!==require('./controls.json').count)throw Error('Atualize e reinicie o motor óptico: painel e motor são de versões diferentes.');return x;}
async function pixels(imaging,doc,id,channel){
 const o=await imaging.getPixels({documentID:doc.id,layerID:id,componentSize:channel===null?32:16,colorSpace:'RGB',...(channel===null?{}:{colorProfile:'sRGB IEC61966-2.1'}),applyAlpha:false,sourceBounds:{left:0,top:0,right:doc.width,bottom:doc.height}});
 try{if(o.level)throw Error('Photoshop devolveu pixels em resolução reduzida.');const data=await o.imageData.getData({chunky:true,fullRange:false});return {pixels:canvasPixels(data,o.imageData,o.sourceBounds,doc.width,doc.height,channel),profile:cleanProfile(o.imageData.colorProfile)};}
 finally{o.imageData.dispose();}
}
// Dependency injection lets protocol/history behavior be tested without Photoshop.
async function apply(ps,fetcher,params,options){
 const doc=ps.app.activeDocument;if(!doc)throw Error('Abra uma imagem primeiro.');
 const width=Number(doc.width),height=Number(doc.height);if(width*height>MAX_PIXELS||width>8192||height>8192)throw Error('Esta versão aceita até 8 megapixels e 8192 pixels por lado.');
 if(!options.sourceID)throw Error('Escolha a camada de imagem.');if(options.depthID===options.sourceID)throw Error('Imagem e depth precisam ser camadas diferentes.');
 if(options.useDepth&&!options.depthID)throw Error('Escolha uma camada de depth ou desative Usar depth.');
 const documentID=doc.id,historyID=doc.activeHistoryState.id;
 options.progress('Lendo as camadas…');await info(fetcher);
 const source=await pixels(ps.imaging,{id:documentID,width,height},options.sourceID,null);
 const depth=options.useDepth?await pixels(ps.imaging,{id:documentID,width,height},options.depthID,options.channel):null;
 const buffer=pack(width,height,params,source.pixels,depth?depth.pixels:null);
 options.progress('Calculando o desfoque…');const response=await fetcher(URL+'/api/render',{method:'POST',headers:{...headers,'Content-Type':'application/octet-stream'},body:buffer});
 if(!response.ok)throw Error(await response.text());const result=await response.arrayBuffer();if(result.byteLength!==width*height*16)throw Error('Resposta incompleta do motor.');
 let layerID;
 await ps.core.executeAsModal(async context=>{
  if(!ps.app.activeDocument||ps.app.activeDocument.id!==documentID||doc.activeHistoryState.id!==historyID)throw Error('O documento mudou durante o cálculo. Aplique novamente.');
  const history=await context.hostControl.suspendHistory({documentID,name:t('Desfoque da Bruxosdovfx')});let commit=false,imageData;
  try{
   imageData=await ps.imaging.createImageDataFromBuffer(new Float32Array(result),{width,height,components:4,chunky:true,colorSpace:'RGB',colorProfile:source.profile});
   const layer=await doc.createPixelLayer({name:'Bruxosdovfx · '+options.profileName});layerID=layer.id;
   await ps.imaging.putPixels({documentID,layerID,imageData,replace:true,targetBounds:{left:0,top:0}});commit=true;
  }finally{if(imageData)imageData.dispose();await context.hostControl.resumeHistory(history,commit);}
 },{commandName:t('Desfoque da Bruxosdovfx')});
 return layerID;
}
module.exports={apply,info,URL,headers};
