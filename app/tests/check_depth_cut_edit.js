const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('assert'),fs=require('fs'),path=require('path');
(async()=>{const browser=await chromium.launch({channel:process.env.OPTICA_TEST_BROWSER==='chromium'?undefined:'msedge',headless:true,args:process.env.CI?['--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]});try{
 const page=await browser.newPage({viewport:{width:1500,height:1400}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto(process.env.OPTICA_TEST_URL||'http://127.0.0.1:8893');
 await page.waitForFunction(()=>gpu?.ready&&!kernelBusy&&!kernelTimer,null,{timeout:60000});
 await page.locator('[data-panel=focus]').click();await page.locator('#depth-mode').evaluate(el=>el.closest('details').open=true);
 const input=page.locator('#di-cut-m');
 await page.evaluate(()=>{settings.near_m=.8;settings.far_m=10;depthInspector.sync()});
 const start=await page.evaluate(()=>settings.depth_cut);
 const draft=async text=>{
  await input.focus();await input.press('Control+A');await input.press('Backspace');
  await page.evaluate(()=>depthInspector.sync());assert.equal(await input.inputValue(),'');
  let prefix='';for(const char of text){prefix+=char;await input.pressSequentially(char);
   await page.evaluate(()=>{depthInspector.sync();depthInspector.refresh(true)});
   assert.equal(await input.inputValue(),prefix);
  }
 };
 await draft('3,73');assert.equal(await page.evaluate(()=>settings.depth_cut),start);
 await input.press('Enter');
 const meters=()=>page.evaluate(()=>DepthUtils.meters(1-settings.depth_cut,settings.near_m,settings.far_m));
 assert(Math.abs(await meters()-3.73)<1e-10);
 await draft('4.25');await page.locator('[data-label=cutmeters]').click();assert(Math.abs(await meters()-4.25)<1e-10);
 await draft('2,5');await input.press('Escape');assert(Math.abs(await meters()-4.25)<1e-10);assert.equal(await input.inputValue(),'4.25');
 for(const text of ['', '0', '11', 'NaN', '3,7.3']){
  await draft(text);await input.press('Enter');assert(Math.abs(await meters()-4.25)<1e-10);assert.equal(await input.inputValue(),'4.25');
 }
 for(const text of ['0,8','10']){await draft(text);await input.press('Enter');assert(Math.abs(await meters()-Number(text.replace(',','.')))<1e-10)}
 // External slider/model changes refresh after leaving the field.
 await page.evaluate(()=>{settings.depth_cut=.5;depthInspector.sync()});assert(Math.abs(Number(await input.inputValue())-await meters())<1e-6);
 await page.evaluate(()=>depthInspector.lock(true));assert(await input.isDisabled());await page.evaluate(()=>depthInspector.lock(false));assert(await input.isEnabled());
 // The other number controls must also retain partial drafts during refresh.
 await page.locator('#di-normal').selectOption('manual');
 for(const id of ['di-curve','di-low','di-high']){
  const control=page.locator('#'+id);await control.focus();await control.press('Control+A');await control.press('Backspace');
  await page.evaluate(()=>depthInspector.sync());assert.equal(await control.inputValue(),'');
  await control.pressSequentially(id==='di-curve'?'1.25':id==='di-low'?'0.1':'0.9');
  await page.evaluate(()=>depthInspector.refresh(true));await control.press('Tab');
 }
 assert.deepEqual(errors,[]);
 const report={decimal_comma:true,decimal_point:true,drafts_survive_refresh:true,enter_commit:true,blur_commit:true,escape_cancel:true,invalid_values_rejected:true,range_endpoints:true,external_updates:true,record_lock:true,other_numeric_drafts:true,errors};
 fs.writeFileSync(path.join(__dirname,'../research/depth-cut-edit-validation.json'),JSON.stringify(report,null,2));console.log(report);
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
