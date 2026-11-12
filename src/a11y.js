/* Shared by the interactive diagrams inside the course closure.
 * Give each redrawable control a stable data-a11y-control within its SVG/list.
 * Labels are already localized; pressed is optional, but false is meaningful.
 */
function activateControl(el,label,action,pressed){
  const svg=el.closest('svg');
  // An image is atomic in the accessibility tree and would hide its controls.
  if(svg)svg.setAttribute('role','group');
  const native=el.tagName==='BUTTON';
  if(!native){el.setAttribute('role','button');el.setAttribute('tabindex','0');}
  el.setAttribute('aria-label',label);
  if(pressed!==undefined)el.setAttribute('aria-pressed',String(!!pressed));
  function activate(e){
    e.stopPropagation();
    const scope=svg||el.parentElement,key=el.dataset.a11yControl;
    const focused=document.activeElement===el;
    action();
    // A synchronous redraw replaces nodes. Restore the logical control, not a
    // stale node, without overriding an intentional focus move by the action.
    if(focused&&!el.isConnected&&scope&&key&&document.activeElement===document.body){
      const next=[...scope.querySelectorAll('[data-a11y-control]')].find(c=>c.dataset.a11yControl===key);
      if(next)next.focus({preventScroll:true});
    }
  }
  el.addEventListener('click',activate);
  if(!native){
    el.addEventListener('keydown',e=>{
      if(e.key!=='Enter'&&e.key!==' ')return;
      e.preventDefault();e.stopPropagation();
      if(!e.repeat)el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));
    });
    el.addEventListener('keyup',e=>{
      if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();}
    });
  }
  return el;
}
