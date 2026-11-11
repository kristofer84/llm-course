/* ================= v5: plain-language walkthroughs ================= */
(function conveyor(){
  const st=[
   ['Normalisera en kopia','RMSNorm g₁',L.t('j6.1'),L.t('j6.2'),L.t('j6.3'),L.t('j6.4')],
   ['Attention: samla information','Wq, Wk, Wv, Wo',L.t('j6.5'),L.t('j6.6'),L.t('j6.7'),L.t('j6.8')],
   ['Addera','ingen vikt','x och attention-bidraget.',L.t('j6.9'),L.t('j6.10'),L.t('j6.11')],
   ['Normalisera en kopia igen','RMSNorm g₂','Det uppdaterade x.','Samma sak som station 1, med egna vikter.','En ny kopia h med storlek 1.',L.t('j6.12')],
   ['MLP: bearbeta','W_gate, W_up, W_down',L.t('j6.13'),L.t('j6.14'),L.t('j6.15'),L.t('j6.16')],
   ['Addera','ingen vikt','x och MLP-bidraget.','x = x + bidrag.',L.t('j6.17'),L.t('j6.18')]];
  const svg=$('lb-svg');let i=0;
  function draw(){clear(svg);S('line',{x1:60,y1:14,x2:60,y2:458,stroke:'var(--a)','stroke-width':6,style:'opacity:.45'},svg);txt(svg,60,10,L.t('x in'),'s','middle');
    txt(svg,30,240,L.t('j6.19'),'s','middle').setAttribute('transform','rotate(-90 30 240)');
    st.forEach((s,k)=>{const y=24+k*72;const add=s[1]==='ingen vikt';const on=k===i;const g=S('g',{style:'cursor:pointer'},svg);g.addEventListener('click',()=>{i=k;draw();});
      const head=L.t('{{n}}. {{title}}',{n:k+1,title:L.t(s[0])});
      if(add){S('circle',{cx:60,cy:y+26,r:14,class:'box',style:on?'stroke:var(--tok);stroke-width:3':''},g);txt(g,60,y+31,'+','b','middle');txt(g,90,y+31,head,on?'b':'s');}
      else{line(g,66,y+26,104,y+26,'ln',true);S('rect',{x:106,y:y+4,width:400,height:44,rx:8,class:k===1||k===4?'bw':'bg',style:on?'stroke:var(--tok);stroke-width:3':''},g);
        txt(g,122,y+23,head,on?'b':'');txt(g,122,y+40,L.t(s[1]),'m tw').setAttribute('style','font-size:11px');
        if(k===1||k===4)S('path',{d:'M306 '+(y+48)+' V'+(y+98)+' H76',class:'ln','marker-end':'url(#ah)'},g);}
      if(on)S('circle',{cx:60,cy:y+26,r:6,fill:'var(--tok)'},svg);});
    const d=$('lb-detail');clear(d);const s=st[i];H('h3',null,L.t('{{n}}. {{title}}',{n:i+1,title:L.t(s[0])}),d).style.marginTop='0';
    const box=H('div','ige',null,d);[['in','Inmatning',s[2]],['do',L.t('j6.20'),s[3]],['out','Resultat',s[4]],['why',L.t('j6.21'),s[5]]].forEach(([c,l,t])=>{const e=H('div',c,null,box);H('span','lb',L.t(l),e);e.appendChild(document.createTextNode(L.t(t)));});
    $('lb-n').textContent=(i+1)+' / 6';}
  $('lb-next').addEventListener('click',()=>{if(i<5){i++;draw();}});$('lb-prev').addEventListener('click',()=>{if(i>0){i--;draw();}});draw();
})();
(function videoAnalogy(){
  const T=[['Katten','djur, substantiv, subjekt','information om katten'],['satt',L.t('j6.22'),'information om att sitta'],['på','preposition','information om en plats'],['mattan',L.t('j6.23'),'information om mattan'],['eftersom','bisatsinledare','information om orsak']];
  const Q=[[L.t('j6.24'),[0.62,0.04,0.03,0.27,0.04]],[L.t('j6.25'),[0.15,0.58,0.12,0.08,0.07]],[L.t('j6.26'),[0.08,0.12,0.38,0.37,0.05]]];
  let q=0;const bx=$('yt-q');Q.forEach((x,k)=>{const b=H('button','btn'+(k===0?' on':''),L.t(x[0]),bx);b.addEventListener('click',()=>{q=k;[...bx.children].forEach((c,j)=>c.classList.toggle('on',j===k));draw();});});
  function draw(){const v=$('yt-view');clear(v);const hd=H('div',null,null,v);hd.style.cssText='display:grid;grid-template-columns:90px 1fr 110px;gap:8px;font-size:12px;color:var(--ink2);margin-bottom:4px';['ord','key = ”titel”','vikt'].forEach(t=>H('span',null,L.t(t),hd));
    T.forEach((t,k)=>{const w=Q[q][1][k];const r=H('div',null,null,v);r.style.cssText='display:grid;grid-template-columns:90px 1fr 110px;gap:8px;align-items:center;margin:6px 0;font-size:14px';
      H('b',null,t[0],r);const ti=H('span','chip',L.t(t[1]),r);ti.style.cssText='white-space:normal;border-color:'+(w>0.25?'var(--tok)':'var(--line)');
      const bar=H('div',null,null,r);bar.style.cssText='height:18px;background:var(--soft);border-radius:3px;position:relative';const f=H('div',null,null,bar);f.style.cssText='height:100%;border-radius:3px;background:var(--tok);width:'+(w*100)+'%';const s=H('span',null,L.t('{{n}} %',{n:Math.round(w*100)}),bar);s.style.cssText='position:absolute;right:4px;top:0;font-family:var(--mono);font-size:11px';});
    const top=Q[q][1].map((w,k)=>[w,k]).sort((a,b)=>b[0]-a[0]);
    $('yt-out').innerHTML=L.t('j6.27',{q:L.t(Q[q][0]),p1:Math.round(top[0][0]*100),d1:L.t(T[top[0][1]][2]),p2:Math.round(top[1][0]*100),d2:L.t(T[top[1][1]][2])});}
  draw();
})();
(function formula(){
  const P=[
   ['Q','Q, K och V',L.t('j6.28'),'Q [32, T, 128], K och V [8, T, 128]',L.t('j6.29')],
   ['QKᵀ',L.t('j6.30'),L.t('j6.31'),'[32, T, T]',L.t('j6.32')],
   ['/√dₖ','÷ √d: skala ner',L.t('j6.33'),'samma shape','÷ √2: 2,12, 0,35 och 1,41.'],
   ['+ mask',L.t('j6.34'),L.t('j6.35'),'samma shape',L.t('j6.36')],
   ['softmax',L.t('j6.37'),L.t('j6.38'),'[32, T, T]','60 % Katten, 10 % satt, 30 % den.'],
   ['· V',L.t('j6.39'),L.t('j6.40'),'[32, T, 128] → [T, 4096]',L.t('j6.41')]];
  const row=$('fx-row');let cur=1;
  const parts=[['softmax(',4],['Q',0],['Kᵀ',1],['/ √d',2],['+ mask',3],[')',4],['· V',5]];
  const bs=parts.map(([t,k])=>{const b=H('button',null,t,row);b.addEventListener('click',()=>{cur=k;draw();});return[b,k];});
  function draw(){bs.forEach(([b,k])=>b.classList.toggle('on',k===cur));const p=P[cur];const t=$('fx-text');clear(t);H('h3',null,L.t(p[1]),t).style.marginTop='0';H('p',null,L.t(p[2]),t);
    const pn=$('fx-panel');clear(pn);const tb=H('table','t',null,pn);[['Shape i Llama-3-8B',p[3]],[L.t('j6.42'),p[4]]].forEach(([a,b])=>{const tr=H('tr',null,null,tb);H('td',null,L.t(a),tr);H('td','n',L.t(b),tr).style.whiteSpace='normal';});
    const g=H('button','btn',L.t('j6.43'),pn);g.style.marginTop='12px';g.dataset.goto=L.t('j6.44');}
  draw();
})();
(function mlpPlain(){
  const svg=$('mk-svg');let i=0;const R=rng(314);const inV=Array.from({length:16},()=>R()*2-1);const ex=Array.from({length:48},()=>R()*2.4-1.2);const silu=z=>z/(1+Math.exp(-z));const gated=ex.map(silu);const outV=Array.from({length:16},()=>(R()*2-1)*0.6);
  const ST=[['Inmatning',L.t('j6.45')],['Expansion',L.t('j6.46')],['Aktivering',L.t('j6.47')],['Projektion',L.t('j6.48')]];
  function bars(vals,x0,w,gap,ymid,sc,dim){vals.forEach((v,k)=>{const h=Math.min(70,Math.abs(v)*sc);S('rect',{x:x0+k*(w+gap),y:v>=0?ymid-h:ymid,width:w,height:Math.max(1,h),rx:1,fill:v>=0?'var(--a)':'var(--neg)',style:'opacity:'+(dim?0.25:0.85)},svg);});}
  function draw(){clear(svg);const ym=100;line(svg,10,ym,510,ym,'lnf');
    if(i===0)bars(inV,180,8,2,ym,45);
    if(i===1)bars(ex,20,8,2.2,ym,40);
    if(i===2){bars(ex,20,8,2.2,ym,40,true);bars(gated,20,8,2.2,ym,40);}
    if(i===3)bars(outV,180,8,2,ym,60);
    txt(svg,260,190,['[4096]','[14336]','[14336]','[4096]'][i],'m ta','middle');
    $('mk-out').innerHTML=L.t('<b>{{n}}. {{title}}</b>: {{body}}',{n:i+1,title:L.t(ST[i][0]),body:L.t(ST[i][1])});$('mk-n').textContent=(i+1)+' / 4';}
  $('mk-next').addEventListener('click',()=>{if(i<3){i++;draw();}});$('mk-prev').addEventListener('click',()=>{if(i>0){i--;draw();}});draw();
  const F=['huvudstad','Frankrike','Tyskland'];const on=[true,true,false];
  function mem(){const fb=$('mk-feat');clear(fb);F.forEach((f,k)=>{const b=H('button','chip '+(on[k]?'new':''),(on[k]?'✓ ':'')+f,fb);b.style.cursor='pointer';b.addEventListener('click',()=>{on[k]=!on[k];mem();});});
    const n1=silu(2*(on[0]?1:0)+2*(on[1]?1:0)-3),n2=silu(2*(on[0]?1:0)+2*(on[2]?1:0)-3);
    const f=[];if(n1>0.5)f.push(L.t('j6.49',{v:L.num(n1,2)}));if(n2>0.5)f.push(L.t('j6.50',{v:L.num(n2,2)}));
    $('mk-mem').innerHTML=(f.length?f.join('; ')+'.':L.t('j6.51'))+' '+L.t('j6.52');}
  mem();
})();
