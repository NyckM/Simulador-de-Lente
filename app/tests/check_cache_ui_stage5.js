const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('assert'),fs=require('fs'),path=require('path');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1500,height:1050}}),requests=[],errors=[];
  page.on('request',r=>requests.push(new URL(r.url()).pathname));page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.OPTICA_TEST_URL||'http://127.0.0.1:8888');
  await page.waitForFunction(()=>typeof atlas!=='undefined'&&atlas&&performancePanel.latest&&!kernelBusy&&!cudaPending,null,{timeout:120000});
  await page.waitForTimeout(700);
  const counters=()=>({atlas:requests.filter(x=>x==='/api/kernel.bin').length,diagram:requests.filter(x=>x==='/api/diagnostics').length});
  const start=counters();
  const set=async(key,value,event='input')=>page.locator('#'+key).evaluate((node,{value,event})=>{node.value=value;node.dispatchEvent(new Event(event,{bubbles:true}));},{value,event});
  for(const [key,value] of [['exposure','1'],['diffusion','0.1'],['lens_dirt_amount','0.2'],['depth_gain','1.5']])await set(key,value);
  await page.waitForTimeout(700);const imageOnly=counters();assert.deepEqual(imageOnly,start);
  await page.evaluate(()=>updateKernel());assert.deepEqual(counters(),start);
  await set('highlight-quality','64','change');await page.waitForTimeout(250);assert.deepEqual(counters(),start);
  await set('focus_m','2');await page.waitForTimeout(800);assert.equal(counters().atlas,start.atlas);assert(counters().diagram>start.diagram);
  const beforeForce=counters();await page.evaluate(()=>updateKernel(true));assert.equal(counters().atlas,beforeForce.atlas+1);
  await page.locator('#inspection-toggle').click();
  await page.waitForFunction(()=>window.opticalPreview?.renderer?.ready&&document.getElementById('optical-lights').dataset.revision,null,{timeout:120000});
  const scene=await page.evaluate(()=>({sourceRevision:opticalPreview.renderer.sourceRevision,depthRevision:opticalPreview.renderer.depthRevision,revision:document.getElementById('optical-lights').dataset.revision}));
  await set('exposure','0.5');
  await page.waitForFunction(previous=>document.getElementById('optical-lights').dataset.revision!==previous,scene.revision,{timeout:120000});
  const reused=await page.evaluate(()=>({sourceRevision:opticalPreview.renderer.sourceRevision,depthRevision:opticalPreview.renderer.depthRevision}));
  assert.equal(reused.sourceRevision,scene.sourceRevision);assert.equal(reused.depthRevision,scene.depthRevision);
  const classification=await page.evaluate(()=>({exposure:LensDependencies.affects('exposure',defaults),iris:LensDependencies.affects('iris_mm',defaults),unknown:LensDependencies.affects('future_unknown',defaults)}));
  assert(!classification.exposure.atlas&&!classification.exposure.layout);assert(classification.iris.atlas&&classification.iris.layout);assert(classification.unknown.atlas&&classification.unknown.layout);
  await page.locator('#optical-inspection button[aria-label="Fechar inspeção óptica"]').click();
  const panel=page.locator('#performance-panel');await panel.locator('summary').click();await panel.scrollIntoViewIfNeeded();await panel.screenshot({path:path.join(__dirname,'../research/cache-stage5.png')});
  assert.deepEqual(errors,[]);const result={imageOnlyAvoidsAtlasAndDiagram:true,duplicateAtlasRequestSkipped:true,unchangedTapRequirementSkipped:true,focusUpdatesDiagramOnly:true,manualRefresh:true,inspectionSourceDepthReused:true,unknownDependencyConservative:true,counters:counters(),errors};
  fs.writeFileSync(path.join(__dirname,'../research/cache-stage5-ui-validation.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
