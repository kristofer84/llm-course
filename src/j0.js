<script>
(function(){
"use strict";
const NS='http://www.w3.org/2000/svg';
const $=id=>document.getElementById(id);
function S(tag,attrs,parent,text){
  const e=document.createElementNS(NS,tag);let st='';
  for(const k in attrs){const v=attrs[k];if(v===undefined)continue;
    if((k==='fill'||k==='stroke')&&typeof v==='string'&&v.indexOf('var(')>=0){st+=k+':'+v+';';}
    else if(k==='style'){st+=v;}
    else e.setAttribute(k,v);}
  if(st)e.setAttribute('style',st);
  if(text!=null)e.textContent=text;
  if(parent)parent.appendChild(e);return e;}
function H(tag,cls,text,parent){const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;if(parent)parent.appendChild(e);return e;}
function clear(el){while(el&&el.firstChild)el.removeChild(el.firstChild);}
function rng(seed){let s=seed%2147483647;if(s<=0)s+=2147483646;return()=>(s=s*16807%2147483647)/2147483647;}
const nf=(n,d)=>L.num(n,d);
const reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const SEQC=['var(--tok)','var(--a)','var(--kv)','var(--w)','var(--neg)','var(--ink2)'];
function line(p,x1,y1,x2,y2,cls,arrow){const l=S('line',{x1,y1,x2,y2,class:cls||'ln'},p);if(arrow)l.setAttribute('marker-end','url(#ah)');return l;}
function txt(p,x,y,t,cls,anchor){return S('text',{x,y,class:cls||'','text-anchor':anchor||'start'},p,t);}
function rect(p,x,y,w,h,cls,rx){return S('rect',{x,y,width:w,height:h,class:cls||'box',rx:rx==null?4:rx},p);}

/* ================= persistence ================= */
const KEY='llm-kurs-v2';
let store={seen:{},last:null,quiz:{},answers:{}};
try{const s=JSON.parse(localStorage.getItem(KEY));if(s&&typeof s==='object')store=Object.assign(store,s);}catch(e){}
for(const key of ['seen','quiz','answers'])if(!store[key]||typeof store[key]!=='object'||Array.isArray(store[key]))store[key]={};
function save(){try{localStorage.setItem(KEY,JSON.stringify(store));}catch(e){}}

/* ================= deck engine ================= */
const MODS=window.COURSE.mods,MODDESC=window.COURSE.desc,MODTIME=window.COURSE.time;
const slides=[...document.querySelectorAll('.slide')];
const titles=slides.map(s=>s.dataset.title);
const LV=slides.map(s=>+(s.dataset.level||1));const LVN=['',L.t('j0.13'),L.t('j0.1'),L.t('learning.level.expert')];if(![1,2,3].includes(store.maxlv))store.maxlv=1;
function step(d){let i=cur+d;while(i>=0&&i<slides.length&&LV[i]>store.maxlv)i+=d;if(i>=0&&i<slides.length)show(i);}
const modOf=slides.map(s=>+s.dataset.mod);
const firstOf=MODS.map((_,m)=>modOf.indexOf(m));
let cur=0;
const prog=$('prog');
MODS.forEach((m,i)=>{const d=H('button','progress-segment');d.type='button';d.title=L.t(m);d.setAttribute('aria-label',L.t(m));d.appendChild(H('span'));d.addEventListener('click',()=>show(firstOf[i]));prog.appendChild(d);});
const toc=$('toc'),gloss=$('gloss'),scrim=$('scrim');
const tocLinks=[];
(function(){const h=H('div');h.style.cssText='display:flex;justify-content:space-between;align-items:center';
  H('strong',null,L.t('j0.2'),h);const c=H('button','ib',L.t('j0.3'),h);c.addEventListener('click',closeAll);toc.appendChild(h);
  const f=H('input');f.type='search';f.placeholder=L.t('j0.4');f.setAttribute('aria-label',L.t('j0.5'));
  f.style.cssText='width:100%;font:inherit;font-size:15px;padding:8px 10px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink);margin:12px 0 4px';toc.appendChild(f);
  const heads=[];let lastMod=-1;slides.forEach((s,i)=>{const m=modOf[i];if(m!==lastMod){const h4=H('h4',null,(m?m+'. ':'')+L.t(MODS[m]),toc);heads[m]=h4;lastMod=m;}
    const a=H('a',null,L.t(s.dataset.i18nTitle||s.dataset.title),toc);if(LV[i]>1){const sp=H('span','lvt l'+LV[i],LVN[LV[i]],a);}a.href='#s'+(i+1);a.addEventListener('click',e=>{e.preventDefault();show(i);closeAll();});tocLinks.push(a);});
  f.addEventListener('input',()=>{const q=f.value.trim().toLowerCase();const vis=MODS.map(()=>false);
    tocLinks.forEach((a,i)=>{const ok=!q||a.textContent.toLowerCase().indexOf(q)>=0;a.style.display=ok?'':'none';if(ok)vis[modOf[i]]=true;});
    heads.forEach((h,m)=>{if(h)h.style.display=vis[m]?'':'none';});});})();
let drawerTrigger=null;
function closeAll(restore=true){
  const trigger=drawerTrigger;drawerTrigger=null;
  [toc,gloss].forEach(el=>{el.classList.remove('open');el.inert=true;el.setAttribute('aria-hidden','true');});
  document.querySelectorAll('.topbar,.botbar,#deck').forEach(el=>{el.inert=false;});
  scrim.classList.remove('open');$('tocbtn').setAttribute('aria-expanded','false');$('glossbtn').setAttribute('aria-expanded','false');
  if(restore&&trigger&&trigger.isConnected)trigger.focus({preventScroll:true});
}
function openDrawer(el,btn,trigger=btn){
  const was=el.classList.contains('open');closeAll(false);
  if(!was){
    drawerTrigger=trigger;el.inert=false;el.setAttribute('aria-hidden','false');el.classList.add('open');
    document.querySelectorAll('.topbar,.botbar,#deck').forEach(node=>{node.inert=true;});
    scrim.classList.add('open');btn.setAttribute('aria-expanded','true');
    const first=window.innerWidth>860?el.querySelector('input'):el.querySelector('button');
    (first||el).focus({preventScroll:true});
  }else if(trigger)trigger.focus({preventScroll:true});
}
$('tocbtn').addEventListener('click',()=>openDrawer(toc,$('tocbtn')));
$('glossbtn').addEventListener('click',()=>openDrawer(gloss,$('glossbtn')));
scrim.addEventListener('click',closeAll);
function modStats(m){let n=0,seen=0;slides.forEach((s,i)=>{if(modOf[i]===m){n++;if(store.seen[titles[i]])seen++;}});return{n,seen};}
function quizScore(id){if(!id||!QUIZ[id])return null;migrateQuizAnswers();const qs=questionSet(id);return{ok:qs.filter(questionCorrect).length,done:qs.filter(questionAnswered).length,n:qs.length};}
function renderMap(){const g=$('modgrid');if(!g)return;clear(g);
  const ps=$('pathsel');if(ps){clear(ps);[[1,L.t('j0.6')],[2,L.t('j0.7')],[3,L.t('j0.8')]].forEach(([v,lab])=>{const b=H('button','btn'+(store.maxlv===v?' on':''),L.t(lab),ps);b.addEventListener('click',()=>setDepth(v));});
    const c=slides.filter((s,k)=>LV[k]<=store.maxlv).length;H('span',null,L.t('j0.19',{n:c}),ps).style.cssText='font-family:var(--mono);font-size:13px';}
  for(let m=1;m<MODS.length;m++){const b=H('button','modcard',null,g);H('div','n',L.t('j0.14',{n:m,t:MODTIME[m]}),b);H('div','h',L.t(MODS[m]),b);H('div','d',L.t(MODDESC[m]),b);
    const st=modStats(m);st.n=0;st.seen=0;slides.forEach((s,k)=>{if(modOf[k]===m&&LV[k]<=store.maxlv){st.n++;if(store.seen[titles[k]])st.seen++;}});const pb=H('div','pb',null,b);const sp=H('span',null,null,pb);sp.style.width=(st.seen/st.n*100)+'%';
    const qs=quizScore(window.COURSE.quizForModule[m]);let meta=L.t('learning.viewed',{seen:st.seen,n:st.n});if(qs&&qs.done)meta+='   '+L.t('learning.mastery',{ok:qs.ok,n:qs.n});H('div','meta',meta,b);
    b.addEventListener('click',()=>show(firstOf[m]));}
  const r=$('resume');if(r){const li=store.last?titles.indexOf(store.last):-1;if(li>2){r.classList.add('on');$('resume-t').textContent=L.t(slides[li].dataset.i18nTitle||store.last);$('resume-b').onclick=()=>show(li);}else r.classList.remove('on');}}
function show(i){
  i=Math.max(0,Math.min(slides.length-1,i|0));
  slides[cur].classList.remove('active');cur=i;slides[i].classList.add('active');slides[i].scrollTop=0;
  const m=modOf[i];$('modname').textContent=m?L.t('j0.15',{n:m,name:L.t(MODS[m])}):L.t(MODS[0]);const lb=$('lvl');lb.textContent=LVN[LV[i]];lb.className='lvb l'+LV[i];
  $('cnt').textContent=(i+1)+' / '+slides.length;
  [...prog.children].forEach((d,k)=>{const f=firstOf[k];const n=modOf.filter(x=>x===k).length;let w=0;if(i>=f+n)w=100;else if(i>=f)w=(i-f+1)/n*100;d.firstChild.style.width=w+'%';});
  store.seen[titles[i]]=1;if(i>0&&!slides[i].querySelector('#modgrid'))store.last=titles[i];save();
  tocLinks.forEach((a,k)=>{a.classList.toggle('cur',k===i);a.classList.toggle('seen',!!store.seen[titles[k]]);a.style.opacity=LV[k]>store.maxlv?'.45':'';});
  if(slides[i].querySelector('#modgrid'))renderMap();
  try{history.replaceState(null,'','#s'+(i+1));}catch(e){}
}
function gotoTitle(t){const i=titles.indexOf(t);if(i>=0)show(i);}
function fromHash(){const m=/^#s(\d+)$/.exec(location.hash);return m?(+m[1]-1):null;}
window.addEventListener('hashchange',()=>{const h=fromHash();if(h!=null&&h!==cur)show(h);});
$('prevbtn').addEventListener('click',()=>step(-1));
$('nextbtn').addEventListener('click',()=>step(1));
document.addEventListener('keydown',e=>{
  const tg=e.target.tagName;if(e.defaultPrevented)return;if(e.key==='Escape'){closeAll();return;}
  const drawer=[toc,gloss].find(el=>el.classList.contains('open'));
  if(drawer){
    if(e.key==='Tab'){
      const focusable=[...drawer.querySelectorAll('button,input,a[href],[tabindex="0"]')].filter(el=>!el.disabled&&el.getClientRects().length);
      const first=focusable[0],last=focusable[focusable.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    }
    return;
  }
  if(e.target.closest('[role="button"],dialog,.example-scroll,[contenteditable="true"]'))return;
  if(tg==='INPUT'||tg==='SELECT'||tg==='TEXTAREA'||e.metaKey||e.ctrlKey||e.altKey)return;
  if(e.key==='ArrowRight'||e.key==='PageDown'){e.preventDefault();step(1);}
  else if(e.key==='ArrowLeft'||e.key==='PageUp'){e.preventDefault();step(-1);}
  else if(e.key===' '&&tg!=='BUTTON'&&tg!=='SUMMARY'){e.preventDefault();step(e.shiftKey?-1:1);}
  else if(e.key==='Home'){show(0);}else if(e.key==='End'){show(slides.length-1);}
  else if(e.key==='t'||e.key==='T'){openDrawer(toc,$('tocbtn'));}
  else if(e.key==='o'||e.key==='O'){openDrawer(gloss,$('glossbtn'));}
});
let tx=null,ty=null;
$('deck').addEventListener('touchstart',e=>{const t=e.target.tagName;if(t==='INPUT'||t==='SELECT'){tx=null;return;}tx=e.touches[0].clientX;ty=e.touches[0].clientY;},{passive:true});
$('deck').addEventListener('touchend',e=>{if(tx==null)return;const dx=e.changedTouches[0].clientX-tx,dy=e.changedTouches[0].clientY-ty;if(Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*1.6)step(dx<0?1:-1);tx=null;},{passive:true});
document.addEventListener('click',e=>{const b=e.target.closest('[data-goto]');if(b){e.preventDefault();gotoTitle(b.dataset.goto);}const gm=e.target.closest('[data-gomod]');if(gm){e.preventDefault();show(firstOf[+gm.dataset.gomod]);}});
/* theme */
(function(){let saved=null;try{saved=localStorage.getItem('llm-kurs-tema');}catch(e){}
  if(saved==='dark'||saved==='light')document.documentElement.setAttribute('data-theme',saved);
  $('themebtn').addEventListener('click',()=>{const r=document.documentElement;let curT=r.getAttribute('data-theme');
    if(!curT)curT=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
    const nt=curT==='dark'?'light':'dark';r.setAttribute('data-theme',nt);try{localStorage.setItem('llm-kurs-tema',nt);}catch(e){}});})();
if(reduce){const a=document.querySelector('#herodot animateMotion');if(a)a.remove();const d=$('herodot');if(d){d.setAttribute('cx',370);d.setAttribute('cy',120);}}

/* The depth-aware quiz component is in learning.js. */
