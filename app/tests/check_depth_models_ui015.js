const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');const assert=require('assert');
(async()=>{const b=await chromium.launch({channel:process.env.OPTICA_TEST_BROWSER==='chromium'?undefined:'msedge',headless:true,args:process.env.CI?['--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]});try{
 const p=await b.newPage({viewport:{width:1500,height:1800}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(process.env.OPTICA_TEST_URL||'http://127.0.0.1:8893');
 try{await p.waitForFunction(()=>typeof gpu!=='undefined'&&gpu?.ready&&!kernelBusy&&!kernelTimer&&depthModelPanel?.models?.length===2,null,{timeout:120000});}catch(e){console.error('startup',await p.evaluate(()=>({gpu:typeof gpu,ready:typeof gpu!=='undefined'&&gpu?.ready,busy:typeof kernelBusy!=='undefined'&&kernelBusy,models:typeof depthModelPanel!=='undefined'&&depthModelPanel?.models?.length,status:document.getElementById('status')?.textContent,message:document.getElementById('messages')?.textContent})),errors);throw e;}
 await p.locator('[data-panel=focus]').click();await p.locator('#depth-model').evaluate(e=>e.closest('details').open=true);await p.locator('#depth-model').selectOption('moge3');
 assert(await p.locator('#dm-install').isVisible());assert(await p.locator('#dm-download').isVisible());
 await p.locator('#dm-cache').fill('C:/my-cache-draft');await p.evaluate(()=>depthModelPanel.refresh());assert.equal(await p.locator('#dm-cache').inputValue(),'C:/my-cache-draft');
 for(const lang of ['en','zh-CN','pt-BR']){await p.evaluate(l=>document.documentElement.lang=l,lang);await p.waitForTimeout(100);assert((await p.locator('#dm-install').innerText()).length>0)}
 // Configuration alone is never shown as verified inference; real evidence is shown when returned.
 const metadata=await p.evaluate(()=>depthModelPanel.models.map(m=>({...m,runtime:undefined,configured:true,inference_verified:false})));
 await p.route('**/api/depth/models',r=>r.fulfill({json:metadata}));await p.evaluate(()=>depthModelPanel.refresh());assert.equal(await p.locator('#dm-validation').getAttribute('data-verified'),'false');
 metadata[0].inference_verified=true;await p.evaluate(()=>depthModelPanel.refresh());assert.equal(await p.locator('#dm-validation').getAttribute('data-verified'),'true');
 await p.locator('#depth-model').selectOption('marigold2');assert(await p.locator('#dm-assets').isEnabled());assert(await p.locator('#dm-refine').isDisabled());
 await p.route('**/api/depth/operation',r=>r.fulfill({json:{state:'downloading',model:'marigold2',downloaded:5,total:10,message:'fixture'}}));await p.evaluate(()=>depthModelPanel.poll());
 assert(await p.locator('#depth-model').isDisabled());assert(await p.locator('#dm-install').isDisabled());assert(await p.locator('#dm-cancel').isVisible());assert.equal(await p.locator('#dm-progress').getAttribute('value'),'50');
 await p.unroute('**/api/depth/operation');await p.evaluate(()=>depthModelPanel.poll());assert(await p.locator('#depth-model').isEnabled());
 const invalid=await p.request.post((process.env.OPTICA_TEST_URL||'http://127.0.0.1:8893')+'/api/depth/setup',{data:{model:'unknown',action:'install'}});assert.equal(invalid.status(),400);
 await p.locator('#depth-model').selectOption('da2');assert(await p.locator('.depth-model-panel').isHidden());assert.deepEqual(errors,[]);
 console.log(JSON.stringify({passed:true,languages:3,draftPreserved:true,validationEvidence:true,operationLock:true,errors}));
}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
