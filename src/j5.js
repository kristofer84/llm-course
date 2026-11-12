/* ================= v4: gentle intro to the block ================= */
(function task(){
  // Word-level teaching rows, NOT the verified BPE embedding positions in module 2.
  // Include the final article in English/German: it belongs to the actual prompt.
  const roles=EX.scene.roles;
  let end=roles.preposition+1;
  while(end<EX.scene.context.length && EX.scene.context.slice(0,end).join(' ')!==EX.tokenizer.prompt.text)end++;
  const words=EX.scene.context.slice(0,end);
  const tr=(key,vars)=>L.t(key,vars);
  const prep=tr('j5.task.preposition');
  function features(i,contextual){
    if(i===roles.subject)return contextual?[tr('j5.32'),tr('j5.3')]:[tr('j5.32'),tr('j5.33'),...(EX.locale==='sv'?[tr('j5.1')]:[])];
    if(i===roles.verb)return contextual?[tr('j5.4',{lemma:EX.words.verbLemma}),tr('j5.5')]:[tr('j5.34',{lemma:EX.words.verbLemma}),tr('j5.2')];
    if(i===roles.preposition)return contextual?[prep,tr('j5.6'),tr('j5.7')]:[prep];
    // Definite articles own their grammar features, rather than noun suffixes.
    return [tr(i<roles.subject?'j5.task.subjectArticle':'j5.task.placeArticle'),...(contextual?[tr(i<roles.subject?'j5.task.subjectLink':'j5.task.placeLink')]:[])];
  }
  let s=0;
  function draw(){const v=$('tk-view');clear(v);
    words.forEach((t,i)=>{const ch=features(i,!!s);const last=i===words.length-1;if(last&&s)ch.push(tr('j5.35'));
      const c=H('div',null,null,v);c.style.cssText='border:1px solid '+(last&&s?'var(--tok)':'var(--line)')+';border-radius:10px;padding:10px 12px;margin:8px 0;background:var(--bg)';
      const h=H('div',null,null,c);h.style.cssText='display:flex;flex-wrap:wrap;gap:8px;justify-content:space-between;align-items:center';H('b',null,t,h);H('span','mk','x['+i+'] [4096]',h);
      const cs=H('div','chips',null,c);ch.forEach((x,k)=>H('span','chip '+(s&&k>0?'new':''),x,cs));});
    if(s){const p=H('div',null,null,v);p.style.cssText='text-align:right;font-size:15px;margin-top:4px';p.innerHTML=tr('j5.8');}
    $('tk-out').innerHTML=tr(s?'j5.9':'j5.10',{last:words[words.length-1],feature:features(words.length-1,false)[0]});
    $('tk-0').classList.toggle('on',!s);$('tk-1').classList.toggle('on',!!s);
    $('tk-0').setAttribute('aria-pressed',String(!s));$('tk-1').setAttribute('aria-pressed',String(!!s));}
  $('tk-0').addEventListener('click',()=>{s=0;draw();});$('tk-1').addEventListener('click',()=>{s=1;draw();});draw();
})();
(function dcMasks(){const g=$('dc-masks');const c=9;
  function grid(x0,y0,f,lbl){for(let i=0;i<5;i++)for(let j=0;j<5;j++){const on=f(i,j);S('rect',{x:x0+j*c,y:y0+i*c,width:c-1.5,height:c-1.5,rx:1,class:on?'bt':'',fill:on?undefined:'url(#hatch)'},g);}txt(g,x0+22,y0+60,L.t(lbl),'s','middle');}
  grid(53,292,()=>true,L.t('j5.36'));grid(183,292,(i,j)=>j<=i,L.t('j5.11'));grid(398,292,(i,j)=>j<=i,L.t('j5.11'));})();
(function stack(){
  const svg=$('st-svg');
  function draw(){const nL=+$('st-l').value;$('st-lv').textContent=String(nL);clear(svg);
    rect(svg,30,8,130,28,'bw',6);txt(svg,95,27,L.t('Embedding'),'s','middle');
    const top=48,avail=222,h=Math.min(26,avail/nL-2);
    S('line',{x1:95,y1:36,x2:95,y2:top+nL*(h+2)+6,stroke:'var(--a)','stroke-width':5,style:'opacity:.45'},svg);
    for(let i=0;i<nL;i++){const y=top+i*(h+2);S('rect',{x:30,y,width:62,height:h,rx:2,class:'bw',style:'fill-opacity:.7'},svg);S('rect',{x:98,y,width:62,height:h,rx:2,class:'bw',style:'fill-opacity:.35'},svg);
      if(h>=14){txt(svg,61,y+h/2+4,L.t('attn'),'s','middle').setAttribute('style','font-size:10px');txt(svg,129,y+h/2+4,L.t('MLP'),'s','middle').setAttribute('style','font-size:10px');}}
    const yb=top+nL*(h+2)+8;rect(svg,30,yb,130,26,'bw',6);txt(svg,95,yb+17,L.t('p3.hela-modellen-i-en-bild.20'),'s','middle');
    txt(svg,170,top+8,L.t('block 1'),'s');if(nL>1)txt(svg,170,top+(nL-1)*(h+2)+h/2+4,L.t('block {{n}}',{n:nL}),'s');
    // Each block holds ~0.218 B weights; embedding and LM head (0.525 B each)
    // sit outside the stack and do not grow with L.
    const per=0.218,emb=0.525,head=0.525,outside=emb+head,inBlocks=per*nL,P=outside+inBlocks;const x0=230;
    const rows=[[L.t('j5.37'),nf(P,2)+' B'],[L.t('j5.38'),'≈ '+nf(P*2,1)+' GB'],[L.t('j5.12'),'≈ '+nf(P*2,1)+' GFLOP'],[L.t('j5.13'),String(nL)]];
    rows.forEach(([a,b],i)=>{txt(svg,x0,56+i*30,a,'s');txt(svg,x0+300,56+i*30,b,'m','end');line(svg,x0,64+i*30,x0+300,64+i*30,'lnf');});
    txt(svg,x0,196,L.t('j5.39'),'s');
    const total=300,blockW=inBlocks/P*total;
    rect(svg,x0,222,total,18,'bg',3);
    rect(svg,x0,222,blockW,18,'bw',3);
    rect(svg,x0+blockW,222,total-blockW,18,'',3).setAttribute('style','fill:var(--ink2);opacity:.35');
    // Percentages above the bar, one at each end, so narrow segments stay readable.
    txt(svg,x0,216,nf(inBlocks/P*100,0)+' %','s').setAttribute('style','font-size:10.5px;font-weight:600');
    txt(svg,x0+total,216,nf(outside/P*100,0)+' %','s','end').setAttribute('style','font-size:10.5px;fill:var(--ink2)');
    S('rect',{x:x0,y:252,width:9,height:9,rx:2,fill:'var(--w)'},svg);
    txt(svg,x0+14,260,L.t('j5.53'),'s').setAttribute('style','font-size:10.5px');
    S('rect',{x:x0+110,y:252,width:9,height:9,rx:2,fill:'var(--ink2)',style:'opacity:.35'},svg);
    txt(svg,x0+124,260,L.t('j5.54'),'s').setAttribute('style','font-size:10.5px');
    svg.dataset.blocks=String(nL);svg.dataset.total=String(P);svg.dataset.inside=String(inBlocks);svg.dataset.outside=String(outside);
    let m;if(nL===1)m=L.t('j5.14');
    else if(nL<8)m=L.t('j5.15');
    else if(nL<24)m=L.t('j5.16');
    else m=L.t('j5.17',{n:nL});
    $('st-out').innerHTML=m+'<br><span style="font-size:13px">'+L.t('j5.50',{n:nL,each:nf(per,3),p:nf(inBlocks,2)})
      +' · '+L.t('j5.51',{emb:nf(emb,3),head:nf(head,3),p:nf(outside,2)})+' — '+L.t('j5.52')+'</span>';}
  $('st-l').addEventListener('input',draw);draw();
})();
(function shapes(){
  const svg=$('sp-svg');let i=0;const T=EX.tokenizer.prompt.count;
  exampleSvg(svg,560,400,560);
  const S0=[[L.t('j5.40'),'['+T+']','ids',L.t('j5.18')],
   [L.t('Embedding'),'['+T+', 4096]','x',L.t('j5.19')],
   [L.t('j5.41'),'['+T+', 4096]','x',L.t('j5.20')],
   [L.t('j5.42'),'['+T+', 4096]','x',L.t('j5.21')],
   [L.t('j5.43'),'['+T+', 4096]','dots',L.t('j5.44')],
   [L.t('j5.45'),'['+T+', 4096]','x',L.t('j5.22')],
   ['p3.hela-modellen-i-en-bild.19','['+T+', 4096]','x',L.t('j5.23')],
   ['p3.hela-modellen-i-en-bild.20','['+T+', 128256]','logits',L.t('j5.24')],
   [L.t('j5.46'),'[128256]','last',L.t('j5.25')]];
  function draw(){clear(svg);S0.forEach((s,k)=>{const y=12+k*42;const cur=k===i,fut=k>i;const g=S('g',{style:'opacity:'+(fut?0.3:1)},svg);
      txt(g,10,y+18,L.t(s[0]),cur?'b':'s');txt(g,140,y+18,s[1],'m '+(s[2]==='ids'?'tt':'ta'));
      if(s[2]==='ids')S('rect',{x:250,y:y+3,width:8,height:25,rx:2,class:'bt',style:cur?'stroke:var(--tok);stroke-width:2.5':''},g);
      else if(s[2]==='dots')txt(g,310,y+20,'⋮','b','middle');
      else if(s[2]==='x')S('rect',{x:250,y:y+3,width:120,height:25,rx:2,class:'ba',style:cur?'stroke:var(--tok);stroke-width:2.5':''},g);
      else{const hh=s[2]==='last'?6:25;S('rect',{x:250,y:y+3+(s[2]==='last'?19:0),width:290,height:hh,rx:2,class:'ba',style:cur?'stroke:var(--tok);stroke-width:2.5':''},g);if(s[2]==='logits')txt(g,530,y+20,L.t('j5.47'),'s','end');}});
    S('line',{x1:370,y1:50,x2:370,y2:12+7*42-4,stroke:'var(--ink2)','stroke-dasharray':'3 3'},svg);
    $('sp-out').innerHTML='<b>'+(i+1)+'. '+L.t(S0[i][0])+'</b>: '+L.t(S0[i][3]);}
  $('sp-next').addEventListener('click',()=>{if(i<S0.length-1){i++;draw();}});$('sp-prev').addEventListener('click',()=>{if(i>0){i--;draw();}});draw();
})();
(function prenorm(){
  let pre=true;
  function diag(){const svg=$('pn-diag');clear(svg);
    S('line',{x1:10,y1:110,x2:550,y2:110,stroke:'var(--a)','stroke-width':6,style:'opacity:.45'},svg);txt(svg,10,140,L.t('j5.26'),'s');
    if(pre){S('path',{d:'M60 107 V46 H88',class:'ln','marker-end':'url(#ah)'},svg);rect(svg,90,28,80,36,'bg',6);txt(svg,130,51,L.t('norm'),'s','middle');
      line(svg,170,46,196,46,'ln',true);rect(svg,198,28,120,36,'bw',6);txt(svg,258,51,L.t('attention / MLP'),'s','middle');
      S('path',{d:'M318 46 H350 V96',class:'ln','marker-end':'url(#ah)'},svg);S('circle',{cx:350,cy:110,r:11,class:'box'},svg);txt(svg,350,115,'+','b','middle');
      txt(svg,130,18,L.t('j5.48'),'s','middle');
      rect(svg,440,92,100,36,'bg',6);txt(svg,490,115,L.t('final norm'),'s','middle');txt(svg,490,84,L.t('j5.27'),'s','middle');}
    else{S('path',{d:'M60 107 V46 H196',class:'ln','marker-end':'url(#ah)'},svg);rect(svg,198,28,120,36,'bw',6);txt(svg,258,51,L.t('attention / MLP'),'s','middle');
      S('path',{d:'M318 46 H350 V96',class:'ln','marker-end':'url(#ah)'},svg);S('circle',{cx:350,cy:110,r:11,class:'box'},svg);txt(svg,350,115,'+','b','middle');
      rect(svg,380,92,80,36,'bg',6);txt(svg,420,115,L.t('norm'),'s','middle');txt(svg,420,84,L.t('j5.28'),'s','middle');}}
  function chart(){const svg=$('pn-chart');clear(svg);const X=l=>50+l/32*480,Y=v=>190-v/7*170;
    [0,2,4,6].forEach(v=>{line(svg,50,Y(v),530,Y(v),'lnf');txt(svg,44,Y(v)+4,String(v),'s','end');});[0,8,16,24,32].forEach(l=>txt(svg,X(l),210,String(l),'s','middle'));
    txt(svg,290,226,L.t('block'),'s','middle');txt(svg,50,14,L.t('j5.49'),'s');
    const st=l=>pre?Math.sqrt(1+1.1*l):1;let d1='',d2='';for(let l=0;l<=32;l++){d1+=(l?'L':'M')+X(l).toFixed(1)+' '+Y(st(l)).toFixed(1);d2+=(l?'L':'M')+X(l).toFixed(1)+' '+Y(1).toFixed(1);}
    S('path',{d:d1,fill:'none',stroke:'var(--a)','stroke-width':3},svg);S('path',{d:d2,fill:'none',stroke:'var(--tok)','stroke-width':2.5,'stroke-dasharray':pre?'6 4':'0'},svg);
    txt(svg,X(32)-4,Y(st(32))-8,L.t('j5.26'),'ta b','end');txt(svg,X(32)-4,Y(1)+(pre?-8:18),L.t('j5.29'),'tt b','end');}
  function draw(){diag();chart();$('pn-pre').classList.toggle('on',pre);$('pn-post').classList.toggle('on',!pre);
    $('pn-out').innerHTML=pre?L.t('j5.30'):L.t('j5.31');}
  $('pn-pre').addEventListener('click',()=>{pre=true;draw();});$('pn-post').addEventListener('click',()=>{pre=false;draw();});draw();
})();
