// Switch visibility only: controls remain mounted so values and handlers survive.
function mount(doc,nav,viewport,items){
 const buttons=[],panels=items.map(item=>doc.getElementById('panel-'+item.id));
 let active=-1;const positions={};
 function select(index){
  if(index<0||index>=items.length)return;
  if(active>=0)positions[items[active].id]=viewport.scrollTop;
  active=index;
  buttons.forEach((button,n)=>{const selected=n===index;button.setAttribute('aria-selected',String(selected));button.setAttribute('variant',selected?'primary':'secondary');button.setAttribute('tabindex',selected?'0':'-1');panels[n].hidden=!selected;});
  viewport.scrollTop=positions[items[index].id]||0;
 }
 items.forEach((item,index)=>{
  const button=doc.createElement('sp-button');button.id='tab-'+item.id;button.className='panelTab';button.textContent=item.label;button.setAttribute('role','tab');button.setAttribute('aria-controls','panel-'+item.id);panels[index].setAttribute('aria-labelledby',button.id);
  button.addEventListener('click',()=>select(index));button.addEventListener('keydown',event=>{let next=null;if(event.key==='ArrowRight')next=(index+1)%items.length;if(event.key==='ArrowLeft')next=(index+items.length-1)%items.length;if(event.key==='Home')next=0;if(event.key==='End')next=items.length-1;if(next!==null){event.preventDefault();select(next);buttons[next].focus();}});buttons.push(button);nav.appendChild(button);
 });
 select(0);return {select};
}
module.exports={mount};
