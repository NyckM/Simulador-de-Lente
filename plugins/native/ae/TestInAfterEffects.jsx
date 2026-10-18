(function(){
 var test=new Folder(Folder.temp.fsName+"/bruxos-ae-validation");
 
 var previousWrite=null;
 function log(text){$.writeln(text);}
 app.beginSuppressDialogs();
 try{
  log("After Effects "+app.version);log("Plugin probe");
  app.newProject();app.project.bitsPerChannel=32;app.project.gpuAccelType=GpuAccelType.SOFTWARE;
  var source=app.project.importFile(new ImportOptions(new File(test.fsName+"/source.png")));
  var depth=app.project.importFile(new ImportOptions(new File(test.fsName+"/depth.png")));
  var comp=app.project.items.addComp("Bruxosdovfx - Rack focus",512,320,1,2,24);
  var src=comp.layers.add(source);var map=comp.layers.add(depth);map.name="DEPTH - branco proximo";map.enabled=false;
  var effects=src.property("ADBE Effect Parade");
  log("canAddProperty="+effects.canAddProperty("Bruxosdovfx DepthLens"));
  if(!effects.canAddProperty("Bruxosdovfx DepthLens"))throw new Error("Native effect not found");
  var fx=effects.addProperty("Bruxosdovfx DepthLens");log("effect="+fx.name+" parameters="+fx.numProperties);
  for(var i=1;i<=fx.numProperties;i++)log(i+" "+fx.property(i).name);
  fx.property("Camada Depth").setValue(map.index);
  fx.property("Campo optico").setValue(1);fx.property("Qualidade").setValue(2);
  fx.property("Foco (m)").setValueAtTime(0,.8);fx.property("Foco (m)").setValueAtTime(1,10);
  fx.property("Diafragma (f/)").setValue(2.8);
  function frame(time,name,half){var rq=app.project.renderQueue.items.add(comp);rq.timeSpanStart=time;rq.timeSpanDuration=1/24;if(half)rq.setSetting("Resolution","Half");var om=rq.outputModule(1);var templates=om.templates;var found=false;for(var j=0;j<templates.length;j++){if(/TIFF Sequence with Alpha/i.test(templates[j])){om.applyTemplate(templates[j]);found=true;break;}}if(!found)throw new Error("TIFF template missing");om.file=new File(test.fsName+"/"+name+"_[#####].tif");app.project.renderQueue.render();if(rq.status!==RQItemStatus.DONE)throw new Error("Render failed "+name);rq.remove();}
  frame(0,"ae-near-32");frame(1,"ae-far-32");
  fx.property("Diafragma (f/)").setValue(16);frame(1,"ae-f16-32");
  fx.property("Diafragma (f/)").setValue(2.8);
  fx.property("Camada Depth").setValue(0);frame(1,"ae-no-depth-32");fx.property("Camada Depth").setValue(map.index);
  var alphaFootage=app.project.importFile(new ImportOptions(new File(test.fsName+"/transparent.png")));src.replaceSource(alphaFootage,false);fx.property("Camada Depth").setValue(0);fx.property("Foco (m)").removeKey(2);fx.property("Foco (m)").removeKey(1);fx.property("Foco (m)").setValue(.8);frame(0,"ae-alpha-32");
  src.replaceSource(source,false);fx.property("Camada Depth").setValue(map.index);fx.property("Foco (m)").setValueAtTime(0,.8);fx.property("Foco (m)").setValueAtTime(1,10);
  frame(1,"ae-half-32",true);app.project.save(new File(test.fsName+"/Bruxosdovfx-Exemplo.aep"));log("PASS");
 }catch(error){log("FAIL "+error.toString()+" line "+error.line);app.project.items.addComp("FAIL "+error.toString()+" line "+error.line,64,40,1,1,24);app.project.save(new File(test.fsName+"/failure.aepx"));}
 finally{app.endSuppressDialogs(false);}
})();
