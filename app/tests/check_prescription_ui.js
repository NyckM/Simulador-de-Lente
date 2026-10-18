const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert=require('assert');
const fs=require('fs');
const path=require('path');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1500,height:1050}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.OPTICA_TEST_URL||'http://127.0.0.1:8884');
  await page.locator('#inspection-toggle').click();
  await page.waitForFunction(()=>typeof lens3D!=='undefined'&&lens3D?.data?.prescription&&lens3D.pickFaces?.length>0,null,{timeout:120000});
  const initial=await page.evaluate(()=>lens3D.data.prescription);
  assert.equal(initial.schema,'optical-prescription/1');assert.equal(initial.units.length,'mm');
  const contracts=await page.evaluate(async()=>{
   const results=[];
   for(const model of ['dgauss50','zeiss_planar_50','tessar_50']){
    const s={lens_model:model,iris_mm:1,ray_backend:'cpu',field_grid:3};
    const response=await fetch('/api/layout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({settings:s})});
    const raw=await response.json();if(!response.ok)throw Error(JSON.stringify(raw));
    const d=LensView.fromPrescription(raw),p=d.prescription;
    if(d.surfaces.some((x,i)=>x.z!==p.surfaces[i].z_mm||x.nd!==p.surfaces[i].medium_after.nd||x.curvature_radius!==raw.surfaces[i].curvature_radius))throw Error('Geometry disagreement');
    results.push({model,category:p.provenance.category,id:p.geometry_id});
    if(model==='dgauss50'){
     const r=await fetch('/api/kernel',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({settings:s,aspect:16/9,taps:32,interactive:true})});
     const atlas=await r.json();if(!r.ok||atlas.prescription_id!==p.geometry_id)throw Error('Atlas prescription mismatch');
    }
   }
   const draftSurfaces=draftDiagram([[0,'nd',1.68]]).surfaces;
   if(draftSurfaces[0].nd!==1.68)throw Error('Draft mismatch');
   if(LensView.fromPrescription({surfaces:[]}).surfaces.length!==0)throw Error('Legacy contract');
   let rejected=false;try{LensView.fromPrescription({prescription:{schema:'future',units:{length:'mm'}}});}catch(e){rejected=true;}
   if(!rejected)throw Error('Unsupported schema accepted');
   return results;
  });
  assert.deepEqual(contracts.map(x=>x.category),['public_reference','artistic','reconstructed']);
  const host=page.locator('#lens-3d');await host.scrollIntoViewIfNeeded();
  for(const [lang,word] of [['en','Public reference'],['zh-CN','公开'],['pt-BR','Referência']]){
   await page.locator('#app-language').selectOption(lang);
   await page.waitForFunction(word=>document.querySelector('.lens3d-origin').textContent.includes(word),word);
  }
  await page.locator('#glass-surface').selectOption('0');
  const old=Number(await page.locator('#glass-radius').inputValue());
  await page.locator('#glass-radius').fill(String(old*1.02));await page.locator('#glass-apply').click();
  await page.waitForFunction(id=>!layoutBusy&&lensDraftEdits===null&&lens3D.data.prescription.geometry_id!==id,initial.geometry_id);
  const edited=await page.evaluate(()=>({p:lens3D.data.prescription,s:lens3D.data.surfaces[0]}));
  assert(edited.p.provenance.edited);assert.equal(edited.p.surfaces[0].radius_mm,edited.s.curvature_radius);assert(Math.abs(edited.s.curvature_radius-old*1.02)<.002);
  await page.locator('#glass-reset').click();await page.waitForFunction(id=>!layoutBusy&&lens3D.data.prescription.geometry_id===id,initial.geometry_id);
  await host.locator('button[data-label="9"]').click();
  await host.screenshot({path:path.join(__dirname,'../research/app-prescription-stage2.png')});
  assert.deepEqual(errors,[]);
  const result={contracts,atlasIdMatch:true,draft:true,editAndReset:true,locales:3,legacyFallback:true,unsupportedSchemaRejected:true,errors};
  fs.writeFileSync(path.join(__dirname,'../research/prescription-stage2-ui-validation.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify(result,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
