const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('assert'),fs=require('fs'),path=require('path');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1500,height:1050}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.OPTICA_TEST_URL||'http://127.0.0.1:8891');await page.locator('#inspection-toggle').click();
  await page.waitForFunction(()=>typeof lens3D!=='undefined'&&lens3D.data&&lens3D.geometryEditor&&lens3D.materialEditor?.entries.length===2,null,{timeout:120000});
  await page.evaluate(()=>{settings.render_backend='webgl';changed('render_backend');});
  const idle=()=>page.waitForFunction(()=>!layoutBusy&&lensDraftEdits===null&&!kernelBusy&&!kernelTimer&&appliedAtlasSignature===signature(),null,{timeout:120000});await idle();
  // Cross-language intersection/normal agreement against Python fixtures.
  const fixtures=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/geometry-stage9.json')));
  const agreement=await page.evaluate(fixtures=>fixtures.map(f=>{const r=SurfaceGeometry.intersect(f.surface,f.p,f.d);return r&&{hit:f.p.map((v,i)=>v+r.t*f.d[i]),normal:r.normal};}),fixtures);
  agreement.forEach((a,i)=>{assert(a);assert(Math.max(...a.hit.map((v,j)=>Math.abs(v-fixtures[i].hit[j])))<1e-10);assert(Math.abs(Math.abs(a.normal.reduce((s,v,j)=>s+v*fixtures[i].normal[j],0))-1)<1e-12);});
  const widget=page.locator('#lens-3d .surface-geometry-editor'),select=widget.locator('select'),apply=widget.locator('button');
  await select.selectOption('1');await apply.click();await idle();
  let data=await page.evaluate(()=>({p:lens3D.data.prescription,axes:[lens3D.data.efl_x_mm,lens3D.data.efl_y_mm],backend:atlas.trace_backend,planes:[lens3D.data.focus_x_z_mm,lens3D.data.focus_y_z_mm]}));
  assert.equal(data.p.surfaces[0].type,'cylindrical_x');assert(Math.abs(data.axes[0]-data.axes[1])>50);assert(Math.abs(data.planes[0]-data.planes[1])>100);assert(['cpu','cpu-fallback'].includes(data.backend));
  // Actual mesh has flat sag along the unpowered axis.
  const meshCheck=await page.evaluate(()=>{const s=lens3D.data.surfaces[0];return [SurfaceGeometry.sagGradient(s,0,8)[0],SurfaceGeometry.sagGradient(s,8,0)[0],Lens3D.mesh(lens3D.data).every(f=>f.vertices.every(p=>p.every(Number.isFinite)))];});assert.equal(meshCheck[0],0);assert(meshCheck[1]>.5&&meshCheck[2]);
  await page.locator('#lens-3d .lens3d-tools button').filter({hasText:/^XZ$/}).click();assert.equal(await page.evaluate(()=>lens3D.pitch),Math.PI/2);
  await page.locator('#lens-3d .lens3d-tools button').filter({hasText:/^YZ$/}).click();assert.equal(await page.evaluate(()=>lens3D.pitch),0);
  await select.selectOption('2');await apply.click();await idle();const swapped=await page.evaluate(()=>[lens3D.data.efl_x_mm,lens3D.data.efl_y_mm]);assert(Math.abs(data.axes[0]-swapped[1])<1e-9&&Math.abs(data.axes[1]-swapped[0])<1e-9);
  // Material/geometry edits must preserve each other.
  const material=page.locator('#lens-3d .material-editor');await material.locator('select').selectOption('2');await material.locator('button').click();await idle();assert.equal(await page.evaluate(()=>lens3D.data.surfaces[0].shape),2);
  await select.selectOption('3');const coefficients={conic:-1,a4:.00000123456789,a6:-.0000000002};for(const [f,v]of Object.entries(coefficients))await widget.locator(`[data-geometry="${f}"]`).fill(String(v));await apply.click();await idle();
  let state=await page.evaluate(()=>({id:lens3D.data.prescription.geometry_id,p:lens3D.data.prescription,edits:settings.lens_edits,stored:JSON.parse(localStorage.getItem('optica-lab-v02')).settings.lens_edits}));
  assert.equal(state.p.surfaces[0].type,'aspheric');assert.equal(state.p.surfaces[0].medium_after.material_id,'SCHOTT N-BK7');assert.equal(state.p.surfaces[0].geometry.a4_mm_minus3,coefficients.a4);assert.deepEqual(state.edits,state.stored);
  await page.locator('#lens-3d input[data-field="curvature_radius"]').fill('30');await page.locator('#lens-3d .lens3d-apply').click();await idle();assert.equal(await page.evaluate(()=>lens3D.data.surfaces[0].a4),coefficients.a4);assert.equal(await page.evaluate(()=>lens3D.data.prescription.surfaces[0].medium_after.material_id),'SCHOTT N-BK7');
  const validId=await page.evaluate(()=>lens3D.data.prescription.geometry_id);await widget.locator('[data-geometry="a4"]').fill('.001');await apply.click();
  await page.waitForFunction(()=>!layoutBusy&&lensDraftEdits===null&&document.getElementById('prescription-status').textContent.includes('rejeitada'),null,{timeout:120000});assert.equal(await page.evaluate(()=>lens3D.data.prescription.geometry_id),validId);
  await widget.locator('[data-geometry="a4"]').fill(String(coefficients.a4));
  for(const [lang,title]of [['en','Surface geometry'],['zh-CN','表面几何'],['pt-BR','Geometria da superfície']]){await page.evaluate(lang=>document.documentElement.lang=lang,lang);await page.waitForTimeout(80);assert.equal(await widget.locator('h4').textContent(),title);}
  const profile=await page.evaluate(()=>ProfileStore.parse(JSON.parse(JSON.stringify(ProfileStore.create('Geometry stage 9',{settings:{...settings},quality,exportQuality,exportSize:document.getElementById('export-size').value,fps:30,useDepth:false},'user-stage9')))));assert.equal(profile.snapshot.settings.lens_edits.find(e=>e[1]==='a4')[2],coefficients.a4);
  await page.reload();await page.locator('#inspection-toggle').click();await page.waitForFunction(()=>typeof lens3D!=='undefined'&&lens3D.data?.surfaces[0].shape===3,null,{timeout:120000});await idle();assert.equal(await page.evaluate(()=>settings.lens_edits.find(e=>e[1]==='a4')[2]),coefficients.a4);
  await page.setViewportSize({width:1500,height:2200});await page.locator('#lens-3d').scrollIntoViewIfNeeded();await page.waitForTimeout(120);
  await page.locator('#lens-3d').screenshot({path:path.join(__dirname,'../research/geometry-stage9.png')});
  await page.locator('#glass-reset').click();await idle();assert.equal(await page.evaluate(()=>lens3D.data.prescription.surfaces[0].type),'spherical');assert.equal(await page.evaluate(()=>settings.lens_edits.length),0);
  assert.deepEqual(errors,[]);const report={python_js_intersections:fixtures.length,axis_exchange:true,actual_mesh:true,views_xz_yz:true,physical_focus_split:true,material_geometry_preserved:true,full_precision:true,invalid_edit_rollback:true,profile_roundtrip:true,reload_persistence:true,three_languages:true,reset_original:true,errors};fs.writeFileSync(path.join(__dirname,'../research/geometry-stage9-ui-validation.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
