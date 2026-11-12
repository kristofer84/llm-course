/* Locale-native scenario data is independent of translated UI templates. */
const EX=window.EXAMPLE_DATA[L.lang];
if(!EX)throw new Error('Missing example pack for '+L.lang);
(function freeze(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}})(EX);
window.COURSE_EXAMPLE=EX;
function exampleSvg(svg,width,height,minWidth=width){
  svg.setAttribute('viewBox','0 0 '+width+' '+height);
  svg.style.width='100%';svg.style.minWidth=Math.max(0,minWidth)+'px';
  let wrapper=svg.parentElement;
  if(!wrapper.classList.contains('example-scroll')){
    wrapper=H('div','example-scroll');svg.before(wrapper);wrapper.appendChild(svg);
    wrapper.tabIndex=0;wrapper.setAttribute('role','region');
    wrapper.setAttribute('aria-label',L.t('examples.diagram.scroll'));
    wrapper.addEventListener('keydown',event=>{
      if(event.target!==wrapper||!['ArrowLeft','ArrowRight'].includes(event.key))return;
      event.preventDefault();event.stopPropagation();
      wrapper.scrollBy({left:event.key==='ArrowRight'?80:-80,behavior:'auto'});
    });
  }
  return wrapper;
}
