/* ================= v6: beginner slides ================= */
(function lmDemo(){
  const D={'Katten':[[' satt',0.38],[' sov',0.24],[' åt',0.14],[' jamade',0.08]],' satt':[[' på',0.52],[' i',0.21],[' still',0.12],[' vid',0.06]],' sov':[[' i',0.35],[' på',0.28],[' hela',0.18],[' gott',0.11]],' åt':[[' sin',0.33],[' upp',0.22],[' fisk',0.18],[' mat',0.12]],' jamade':[[' högt',0.4],[' och',0.2],['.',0.2],[' igen',0.1]],
    ' på':[[' mattan',0.41],[' soffan',0.22],[' golvet',0.17],[' bordet',0.1]],' i':[[' soffan',0.3],[' solen',0.28],[' fönstret',0.2],[' korgen',0.12]],' hela':[[' dagen',0.62],[' natten',0.25],[' eftermiddagen',0.08],[' tiden',0.03]],' sin':[[' mat',0.45],[' fisk',0.3],[' frukost',0.15],[' middag',0.05]],
    ' och':[[' sov',0.3],[' tittade',0.25],[' åt',0.2],[' jamade',0.1]],' tittade':[[' ut',0.45],[' på',0.3],[' sig',0.12],[' upp',0.08]],' ut':[[' genom',0.4],['.',0.35],[' över',0.15],[' i',0.05]],' genom':[[' fönstret',0.82],[' dörren',0.1],[' rummet',0.04],[' gardinen',0.02]]};
  const END=[['.',0.55],[' och',0.25],[' hela',0.1],[' länge',0.05]];let txtA;
  function opts(){const l=txtA[txtA.length-1];if(l==='.')return null;return D[l]||END;}
  function add(w){txtA.push(w);draw();}
  function draw(){const t=$('lm-text');clear(t);txtA.forEach((w,i)=>H('span','chip '+(i===txtA.length-1&&i>0?'new':'t'),w,t));
    const o=$('lm-opts');clear(o);const op=opts();
    if(!op||txtA.length>=14){H('p',null,L.t('j7.1'),o).style.color='var(--ink2)';$('lm-auto').disabled=true;return;}
    $('lm-auto').disabled=false;
    op.forEach(([w,p])=>{const b=H('button','btn',null,o);b.style.cssText='display:grid;grid-template-columns:110px 1fr 56px;gap:10px;align-items:center;width:100%;margin:5px 0;text-align:left';
      H('span',null,w,b).style.fontFamily='var(--mono)';const tr=H('span',null,null,b);tr.style.cssText='height:16px;background:var(--soft);border-radius:3px;display:block';const f=H('span',null,null,tr);f.style.cssText='display:block;height:100%;border-radius:3px;background:var(--tok);width:'+(p*100)+'%';
      H('span',null,L.t('j7.8',{p:Math.round(p*100)}),b).style.fontFamily='var(--mono)';b.addEventListener('click',()=>add(w));});}
  $('lm-auto').addEventListener('click',()=>{const op=opts();if(op)add(op[0][0]);});
  $('lm-reset').addEventListener('click',()=>{txtA=['Katten'];draw();});txtA=['Katten'];draw();
})();
(function gpuKitchen(){
  const svg=$('gp-svg');let n=1;
  function step(b){const by=16.06e9+b*1024*131072,fl=b*2*8.03e9;const t=Math.max(by/3.35e12,fl/989e12);return{t,util:(fl/989e12)/t};}
  function draw(){clear(svg);const s=step(n);
    S('rect',{x:16,y:40,width:150,height:220,rx:10,class:'bg'},svg);txt(svg,91,32,L.t('j7.9'),'s','middle');
    rect(svg,30,60,122,110,'bw',6);txt(svg,91,110,L.t('j7.10'),'','middle');txt(svg,91,128,L.t('16 GB'),'m','middle');
    const kv=Math.min(70,n*1.1);rect(svg,30,240-kv,122,Math.max(4,kv),'bkv',6);if(kv>20)txt(svg,91,245-kv/2,L.t('j7.11'),'s','middle');
    S('rect',{x:166,y:40,width:340,height:220,rx:10,fill:'none',class:'lnf'},svg);txt(svg,336,32,L.t('j7.2'),'s','middle');
    S('rect',{x:160,y:136,width:16,height:28,fill:'var(--surface)'},svg);line(svg,166,40,166,136,'ln');line(svg,166,164,166,260,'ln');txt(svg,168,184,L.t('j7.3'),'s');
    for(let k=0;k<3;k++)line(svg,120+k*4,150,214,150,'ln',true);
    const total=70,lit=Math.max(1,Math.round(total*s.util));
    for(let r=0;r<7;r++)for(let c=0;c<10;c++){const k=r*10+c;S('circle',{cx:226+c*28,cy:64+r*28,r:9,fill:k<lit?'var(--w)':'var(--ink2)',style:'opacity:'+(k<lit?0.9:0.15)},svg);}
    const per=1/s.t,tot=n/s.t;
    $('gp-out').innerHTML=L.t(n>1
      ?L.t('j7.4')
      :L.t('j7.5'),
      {util:L.num(s.util*100,s.util<0.01?1:0),t:L.num(s.t*1000,1),per:L.num(Math.round(per),0),tot:L.num(Math.round(tot),0)});
    $('gp-1').classList.toggle('on',n===1);$('gp-64').classList.toggle('on',n===64);}
  $('gp-1').addEventListener('click',()=>{n=1;draw();});$('gp-64').addEventListener('click',()=>{n=64;draw();});draw();
})();
(function kvPlain(){
  const svg=$('kc-svg');
  function draw(){const n=+$('kc-n').value;$('kc-nv').textContent=String(n);clear(svg);const x0=40,w=460/n,Y=v=>210-v/n*170;
    line(svg,x0,210,500,210,'lnf');txt(svg,x0,18,L.t('j7.6'),'s');
    for(let k=1;k<=n;k++){const x=x0+(k-1)*w;S('rect',{x:x+w*0.1,y:Y(k),width:w*0.4,height:210-Y(k),fill:'var(--ink2)',style:'opacity:.35'},svg);S('rect',{x:x+w*0.5,y:Y(1),width:w*0.4,height:210-Y(1),fill:'var(--tok)'},svg);}
    txt(svg,x0,232,L.t('j7.12',{n:1}),'s');txt(svg,500,232,L.t('j7.12',{n:n}),'s','end');
    S('rect',{x:300,y:30,width:12,height:12,fill:'var(--ink2)',style:'opacity:.35'},svg);txt(svg,318,41,L.t('j7.13'),'s');S('rect',{x:300,y:50,width:12,height:12,fill:'var(--tok)'},svg);txt(svg,318,61,L.t('j7.14'),'s');
    const a=n*(n+1)/2;$('kc-out').innerHTML=L.t('j7.7',{n:n,a:L.num(a,0)});}
  $('kc-n').addEventListener('input',draw);draw();
})();
