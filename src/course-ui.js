/* Offline study tools: copying, contextual definitions, and diagram expansion. */
async function copyCourseText(value){
  try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(value);return true;}}catch(e){}
  const field=H('textarea');field.value=value;field.style.cssText='position:fixed;left:-10000px';document.body.appendChild(field);
  const previous=document.activeElement;field.select();let ok=false;
  try{ok=document.execCommand('copy');}catch(e){}
  field.remove();if(previous&&previous.focus)previous.focus();return ok;
}
function showDefinition(term){
  closeAll();openDrawer(gloss,$('glossbtn'));
  const search=$('gloss-search');search.value=term;search.dispatchEvent(new Event('input'));search.focus();
}
function initStudyTools(){
  const dialog=H('dialog','diagram-dialog',null,document.body);
  const heading=H('h2',null,L.t('learning.diagram'),dialog);heading.id='diagram-dialog-title';dialog.setAttribute('aria-labelledby',heading.id);
  const close=H('button','btn study-tool',L.t('learning.close'),dialog),canvas=H('div','diagram-canvas',null,dialog);
  let expanded=null,placeholder=null,returnFocus=null;
  close.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{if(expanded&&placeholder){placeholder.replaceWith(expanded);if(returnFocus)returnFocus.focus();}expanded=placeholder=returnFocus=null;});
  document.querySelectorAll('.slide .panel svg.viz').forEach(svg=>{
    const actions=H('div','viz-actions'),button=H('button','btn study-tool',L.t('learning.expand'),actions);svg.before(actions);
    button.addEventListener('click',()=>{
      expanded=svg;returnFocus=button;placeholder=document.createComment('expanded diagram');svg.replaceWith(placeholder);canvas.appendChild(svg);
      dialog.showModal();close.focus();
    });
  });
  document.querySelectorAll('.slide .eq,.slide pre.code,.slide pre.log').forEach(block=>{
    const tools=H('div','copy-tools'),button=H('button','btn study-tool',L.t('learning.copy'),tools),status=H('span',null,null,tools);
    status.setAttribute('role','status');block.after(tools);
    button.addEventListener('click',async()=>{const ok=await copyCourseText(block.textContent);status.textContent=L.t(ok?'learning.copied':'learning.copy.failed');});
  });
  const terms=[...new Set(GLOSS.map(([t])=>L.t(t)))].filter(t=>t.length>=3).sort((a,b)=>b.length-a.length);
  slides.forEach(slide=>{
    const text=slide.textContent.toLocaleLowerCase(L.lang),matches=terms.filter(t=>text.includes(t.toLocaleLowerCase(L.lang))).slice(0,4);
    if(!matches.length)return;
    const box=H('div','context-glossary',null,slide.querySelector('.si'));H('span',null,L.t('learning.definitions'),box);
    matches.sort((a,b)=>a.localeCompare(b,L.lang)).forEach(term=>{const button=H('button','btn study-tool',term,box);button.setAttribute('aria-label',L.t('learning.define',{term}));button.addEventListener('click',()=>showDefinition(term));});
  });
}
