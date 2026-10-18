const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('assert'),fs=require('fs'),path=require('path');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1500,height:1050}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.OPTICA_TEST_URL||'http://127.0.0.1:8890');
  await page.locator('#inspection-toggle').click();
  await page.waitForFunction(()=>typeof lens3D!=='undefined'&&lens3D.data&&lens3D.materialEditor?.entries.length===2,null,{timeout:120000});
  await page.evaluate(()=>{settings.render_backend='webgl';changed('render_backend');});
  const idle=()=>page.waitForFunction(()=>!layoutBusy&&lensDraftEdits===null&&!kernelBusy&&!kernelTimer&&appliedAtlasSignature===signature(),null,{timeout:120000});
  await idle();
  const widget=page.locator('#lens-3d .material-editor'),select=widget.locator('select'),apply=widget.locator('button');
  const initial=await page.evaluate(()=>lens3D.data.prescription);assert.equal(initial.surfaces[0].medium_after.material_id,null);
  await select.selectOption('2');await apply.click();await idle();
  let assigned=await page.evaluate(()=>({medium:lens3D.data.prescription.surfaces[0].medium_after,settings:settings.lens_edits,rays:lens3D.rays,readonly:document.getElementById('glass-index').disabled}));
  assert.equal(assigned.medium.material_id,'SCHOTT N-BK7');assert.equal(assigned.medium.assignment,'user');assert(assigned.readonly);
  await page.waitForFunction(()=>lens3D.rays?.length===243);assert.equal(await page.evaluate(()=>new Set(lens3D.rays.map(r=>r.wavelength)).size),3);
  const jsIndices=await page.evaluate(()=>[.6562725,.5876,.4861327].map(w=>GlassMaterials.index(lens3D.data.surfaces[0],w)));
  assert(Math.abs(jsIndices[1]-assigned.medium.nd)<1e-12);assert(jsIndices[2]>jsIndices[1]&&jsIndices[1]>jsIndices[0]);
  // Applying geometry must retain the material attached to that medium.
  await page.locator('#lens-3d input[data-field="curvature_radius"]').fill('30');
  await page.locator('#lens-3d .lens3d-apply').click();await idle();
  assert.equal(await page.evaluate(()=>lens3D.data.prescription.surfaces[0].medium_after.material_id),'SCHOTT N-BK7');
  await select.selectOption('3');await apply.click();await idle();
  assert.equal(await page.evaluate(()=>lens3D.data.prescription.surfaces[0].medium_after.material_id),'SCHOTT F2');
  // The custom form keeps all coefficient digits, including C1 below .01.
  await select.selectOption('4');
  const coefficients={b1:1.03961212,b2:.231792344,b3:1.01046945,c1:.00600069867,c2:.0200179144,c3:103.560653};
  for(const [field,value]of Object.entries(coefficients))await widget.locator(`[data-material-field="${field}"]`).fill(String(value));
  await apply.click();await idle();
  const custom=await page.evaluate(()=>({id:lens3D.data.prescription.geometry_id,medium:lens3D.data.prescription.surfaces[0].medium_after,edits:settings.lens_edits,stored:JSON.parse(localStorage.getItem('optica-lab-v02')).settings.lens_edits}));
  assert.equal(custom.medium.material_id,'custom-sellmeier');assert.equal(custom.medium.sellmeier.c_um2[0],coefficients.c1);
  assert.equal(custom.edits.find(e=>e[1]==='c1')[2],coefficients.c1);assert.deepEqual(custom.edits,custom.stored);
  // Invalid physics is rejected; the rendered/serialized prescription stays valid.
  await widget.locator('[data-material-field="c1"]').fill('.25');await apply.click();
  await page.waitForFunction(()=>!layoutBusy&&lensDraftEdits===null&&document.getElementById('prescription-status').textContent.includes('rejeitada'),null,{timeout:120000});
  assert.equal(await page.evaluate(()=>lens3D.data.prescription.geometry_id),custom.id);
  assert.equal(await page.evaluate(()=>settings.lens_edits.find(e=>e[1]==='c1')[2]),coefficients.c1);
  await widget.locator('[data-material-field="c1"]').fill(String(coefficients.c1));
  // ProfileStore round trips the numeric overrides without rounding coefficients.
  const profile=await page.evaluate(()=>{const snapshot={settings:{...settings},quality,exportQuality,exportSize:document.getElementById('export-size').value,fps:30,useDepth:false};const p=ProfileStore.create('Material stage 8',snapshot,'user-stage8');return ProfileStore.parse(JSON.parse(JSON.stringify(p)));});
  assert.equal(profile.snapshot.settings.lens_edits.find(e=>e[1]==='c1')[2],coefficients.c1);
  for(const [lang,title]of [['en','Glass material · medium after the surface'],['zh-CN','玻璃材料 · 表面之后的介质'],['pt-BR','Material do vidro · meio após a superfície']]){
   await page.locator('#app-language').selectOption(lang);await page.waitForFunction(text=>document.querySelector('.material-editor h4').textContent===text,title);
  }
  await widget.scrollIntoViewIfNeeded();await widget.screenshot({path:path.join(__dirname,'../research/materials-stage8.png')});
  await page.reload();await page.locator('#inspection-toggle').click();
  await page.waitForFunction(()=>lens3D.data?.surfaces[0].material_spec?.[5]==='custom-sellmeier',null,{timeout:120000});await idle();
  assert.equal(await page.evaluate(()=>lens3D.data.prescription.surfaces[0].medium_after.sellmeier.c_um2[0]),coefficients.c1);
  await select.selectOption('1');await widget.locator('[data-material-field="nd"]').fill('1.65');await widget.locator('[data-material-field="abbe"]').fill('35');await apply.click();await idle();
  const abbe=await page.evaluate(()=>lens3D.data.prescription.surfaces[0].medium_after);assert.equal(abbe.abbe,35);assert.equal(abbe.nd,1.65);assert.equal(abbe.dispersion_model,'abbe');
  // Air is not silently converted into a glass element.
  const air=await page.evaluate(()=>lens3D.data.base_surfaces.find(s=>s.nd===1&&!s.is_stop).index);
  await page.evaluate(index=>{document.getElementById('glass-surface').value=String(index);renderLensDiagram(displayedLensData);},air);
  assert(await select.isDisabled());assert(await apply.isDisabled());
  await page.locator('#glass-reset').click();await idle();assert.equal(await page.evaluate(()=>settings.lens_edits.length),0);
  assert.equal(await page.evaluate(()=>lens3D.data.prescription.surfaces[0].medium_after.material_id),null);
  assert.deepEqual(errors,[]);
  const report={catalogAssignment:true,physicalRGBRays:243,geometryEditsPreserveMaterial:true,customSellmeierDigitsPreserved:true,invalidPoleRollback:true,profileRoundtrip:true,reloadPreservesMaterial:true,abbeAssignment:true,airAssignmentBlocked:true,resetRestoresOriginal:true,locales:3,indices_CdF:jsIndices,errors};
  fs.writeFileSync(path.join(__dirname,'../research/materials-stage8-ui-validation.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
