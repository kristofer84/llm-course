/* ================= v4: gentle intro to the block ================= */
(function task(){
  const B=[['Katten',['ordet katt','substantiv','bestämd form']],['satt',['verbet sitta','dåtid']],['på',['preposition']]];
  const A=[['Katten',['ordet katt','subjekt: den som gör något']],['satt',['sitta, dåtid','det är katten som satt']],['på',['preposition','katten satt på något','här ska en plats komma','troligt: mattan, golvet, soffan']]];
  let s=0;
  function draw(){const v=$('tk-view');clear(v);const D=s?A:B;
    D.forEach(([t,ch],i)=>{const c=H('div',null,null,v);const last=i===D.length-1;c.style.cssText='border:1px solid '+(last&&s?'var(--tok)':'var(--line)')+';border-radius:10px;padding:10px 12px;margin:8px 0;background:var(--bg)';
      const h=H('div',null,null,c);h.style.cssText='display:flex;justify-content:space-between;align-items:center';H('b',null,t,h);H('span','mk','x['+i+'] [4096]',h);
      const cs=H('div','chips',null,c);ch.forEach(x=>H('span','chip '+(s&&i===2&&x!=='preposition'?'new':''),x,cs));});
    if(s){const p=H('div',null,null,v);p.style.cssText='text-align:right;font-size:15px;margin-top:4px';p.innerHTML='sista raden → nästa token: <b>” mattan”</b>';}
    $('tk-out').innerHTML=s?'Efter alla block har vektorn för ”på” fått med sig sammanhanget från de andra orden. Den sista raden räcker nu för att gissa fortsättningen.':'Direkt efter embedding är raderna oberoende av varandra. ”på” vet bara att det är en preposition.';
    $('tk-0').classList.toggle('on',!s);$('tk-1').classList.toggle('on',!!s);}
  $('tk-0').addEventListener('click',()=>{s=0;draw();});$('tk-1').addEventListener('click',()=>{s=1;draw();});draw();
})();
(function dcMasks(){const g=$('dc-masks');const c=9;
  function grid(x0,y0,f,lbl){for(let i=0;i<5;i++)for(let j=0;j<5;j++){const on=f(i,j);S('rect',{x:x0+j*c,y:y0+i*c,width:c-1.5,height:c-1.5,rx:1,class:on?'bt':'',fill:on?undefined:'url(#hatch)'},g);}txt(g,x0+22,y0+60,lbl,'s','middle');}
  grid(53,292,()=>true,'alla ser alla');grid(183,292,(i,j)=>j<=i,'bara bakåt');grid(398,292,(i,j)=>j<=i,'bara bakåt');})();
(function stack(){
  const svg=$('st-svg');
  function draw(){const L=+$('st-l').value;$('st-lv').textContent=String(L);clear(svg);
    rect(svg,30,8,130,28,'bw',6);txt(svg,95,27,'Embedding','s','middle');
    const top=48,avail=222,h=Math.min(26,avail/L-2);
    S('line',{x1:95,y1:36,x2:95,y2:top+L*(h+2)+6,stroke:'var(--a)','stroke-width':5,style:'opacity:.45'},svg);
    for(let i=0;i<L;i++){const y=top+i*(h+2);S('rect',{x:30,y,width:62,height:h,rx:2,class:'bw',style:'fill-opacity:.7'},svg);S('rect',{x:98,y,width:62,height:h,rx:2,class:'bw',style:'fill-opacity:.35'},svg);
      if(h>=14){txt(svg,61,y+h/2+4,'attn','s','middle').setAttribute('style','font-size:10px');txt(svg,129,y+h/2+4,'MLP','s','middle').setAttribute('style','font-size:10px');}}
    const yb=top+L*(h+2)+8;rect(svg,30,yb,130,26,'bw',6);txt(svg,95,yb+17,'LM head','s','middle');
    txt(svg,170,top+8,'block 1','s');if(L>1)txt(svg,170,top+(L-1)*(h+2)+h/2+4,'block '+L,'s');
    const P=1.05+L*0.218;const x0=230;
    const rows=[['Parametrar',nf(P,2)+' B'],['Minne i bf16','≈ '+nf(P*2,1)+' GB'],['Beräkning per token','≈ '+nf(P*2,1)+' GFLOP'],['Block i följd per token',String(L)]];
    rows.forEach(([a,b],i)=>{txt(svg,x0,60+i*34,a,'s');txt(svg,x0+300,60+i*34,b,'m','end');line(svg,x0,68+i*34,x0+300,68+i*34,'lnf');});
    const W=Math.min(300,L*0.218/(1.05+32*0.218)*300);txt(svg,x0,214,'andel av parametrarna i blocken','s');rect(svg,x0,222,300,14,'bg',3);rect(svg,x0,222,L*0.218/P*300,14,'bw',3);txt(svg,x0+300,250,nf(L*0.218/P*100,0)+' %','m','end');
    let m;if(L===1)m='Ett block ger en enda runda: varje token kan hämta information från andra tokens och bearbeta den en gång, men aldrig bygga vidare på det den hämtat.';
    else if(L<8)m='Några få rundor räcker för enkla samband, till exempel att koppla ”den” till ”Katten”. Längre kedjor av slutsatser får inte plats.';
    else if(L<24)m='Fler rundor ger utrymme för kedjor: först hitta vad ”den” syftar på, sedan vad man vet om det, sedan vad som brukar följa.';
    else m='L = '+L+'. Varje token passerar alla block i tur och ordning. Blocken kan inte köras parallellt för samma token, eftersom varje block behöver det föregående blockets resultat.';
    $('st-out').textContent=m;}
  $('st-l').addEventListener('input',draw);draw();
})();
(function shapes(){
  const svg=$('sp-svg');let i=0;
  const S0=[['Token-ids','[5]','ids','Utgångsläget: fem heltal, ett per token. Inga vektorer än.'],
   ['Embedding','[5, 4096]','x','Varje id blir en rad med 4096 tal. Här föds strömmen x.'],
   ['Efter block 1','[5, 4096]','x','Block 1 har adderat två bidrag. Innehållet har ändrats, shapen inte.'],
   ['Efter block 2','[5, 4096]','x','Samma shape igen. Därför kan block 2:s utdata gå rakt in i block 3.'],
   ['Block 3–31','[5, 4096]','dots','29 block till, alla med samma in- och utshape.'],
   ['Efter block 32','[5, 4096]','x','Sista blocket. Strömmen har fått 64 bidrag ovanpå embedding.'],
   ['Final RMSNorm','[5, 4096]','x','Strömmen normaliseras en enda gång. Fortfarande samma shape.'],
   ['LM head','[5, 128256]','logits','Här, och först här, byter shapen form: 4096 tal per rad blir 128 256, ett per token i vokabulären.'],
   ['Sista raden','[128256]','last','För att generera behövs bara raden för sista token. Den går till samplingen.']];
  function draw(){clear(svg);S0.forEach((s,k)=>{const y=12+k*42;const cur=k===i,fut=k>i;const g=S('g',{style:'opacity:'+(fut?0.3:1)},svg);
      txt(g,10,y+18,s[0],cur?'b':'s');txt(g,140,y+18,s[1],'m '+(s[2]==='ids'?'tt':'ta'));
      if(s[2]==='ids')S('rect',{x:250,y:y+3,width:8,height:25,rx:2,class:'bt',style:cur?'stroke:var(--tok);stroke-width:2.5':''},g);
      else if(s[2]==='dots')txt(g,310,y+20,'⋮','b','middle');
      else if(s[2]==='x')S('rect',{x:250,y:y+3,width:120,height:25,rx:2,class:'ba',style:cur?'stroke:var(--tok);stroke-width:2.5':''},g);
      else{const hh=s[2]==='last'?6:25;S('rect',{x:250,y:y+3+(s[2]==='last'?19:0),width:290,height:hh,rx:2,class:'ba',style:cur?'stroke:var(--tok);stroke-width:2.5':''},g);if(s[2]==='logits')txt(g,530,y+20,'… 31 × bredare','s','end');}});
    S('line',{x1:370,y1:50,x2:370,y2:12+7*42-4,stroke:'var(--ink2)','stroke-dasharray':'3 3'},svg);
    $('sp-out').innerHTML='<b>'+(i+1)+'. '+S0[i][0]+'</b>: '+S0[i][3];}
  $('sp-next').addEventListener('click',()=>{if(i<S0.length-1){i++;draw();}});$('sp-prev').addEventListener('click',()=>{if(i>0){i--;draw();}});draw();
})();
(function prenorm(){
  let pre=true;
  function diag(){const svg=$('pn-diag');clear(svg);
    S('line',{x1:10,y1:110,x2:550,y2:110,stroke:'var(--a)','stroke-width':6,style:'opacity:.45'},svg);txt(svg,10,140,'strömmen x','s');
    if(pre){S('path',{d:'M60 107 V46 H88',class:'ln','marker-end':'url(#ah)'},svg);rect(svg,90,28,80,36,'bg',6);txt(svg,130,51,'norm','s','middle');
      line(svg,170,46,196,46,'ln',true);rect(svg,198,28,120,36,'bw',6);txt(svg,258,51,'attention / MLP','s','middle');
      S('path',{d:'M318 46 H350 V96',class:'ln','marker-end':'url(#ah)'},svg);S('circle',{cx:350,cy:110,r:11,class:'box'},svg);txt(svg,350,115,'+','b','middle');
      txt(svg,130,18,'kopian normaliseras','s','middle');
      rect(svg,440,92,100,36,'bg',6);txt(svg,490,115,'final norm','s','middle');txt(svg,490,84,'en gång, i slutet','s','middle');}
    else{S('path',{d:'M60 107 V46 H196',class:'ln','marker-end':'url(#ah)'},svg);rect(svg,198,28,120,36,'bw',6);txt(svg,258,51,'attention / MLP','s','middle');
      S('path',{d:'M318 46 H350 V96',class:'ln','marker-end':'url(#ah)'},svg);S('circle',{cx:350,cy:110,r:11,class:'box'},svg);txt(svg,350,115,'+','b','middle');
      rect(svg,380,92,80,36,'bg',6);txt(svg,420,115,'norm','s','middle');txt(svg,420,84,'strömmen själv','s','middle');}}
  function chart(){const svg=$('pn-chart');clear(svg);const X=l=>50+l/32*480,Y=v=>190-v/7*170;
    [0,2,4,6].forEach(v=>{line(svg,50,Y(v),530,Y(v),'lnf');txt(svg,44,Y(v)+4,String(v),'s','end');});[0,8,16,24,32].forEach(l=>txt(svg,X(l),210,String(l),'s','middle'));
    txt(svg,290,226,'block','s','middle');txt(svg,50,14,'storlek (RMS)','s');
    const st=l=>pre?Math.sqrt(1+1.1*l):1;let d1='',d2='';for(let l=0;l<=32;l++){d1+=(l?'L':'M')+X(l).toFixed(1)+' '+Y(st(l)).toFixed(1);d2+=(l?'L':'M')+X(l).toFixed(1)+' '+Y(1).toFixed(1);}
    S('path',{d:d1,fill:'none',stroke:'var(--a)','stroke-width':3},svg);S('path',{d:d2,fill:'none',stroke:'var(--tok)','stroke-width':2.5,'stroke-dasharray':pre?'6 4':'0'},svg);
    txt(svg,X(32)-4,Y(st(32))-8,'strömmen x','ta b','end');txt(svg,X(32)-4,Y(1)+(pre?-8:18),'det blocken läser','tt b','end');}
  function draw(){diag();chart();$('pn-pre').classList.toggle('on',pre);$('pn-post').classList.toggle('on',!pre);
    $('pn-out').innerHTML=pre?'<b>Pre-norm</b>: strömmen får växa fritt, men varje block läser en normaliserad kopia med storlek 1. Därför behövs en final norm innan LM head.':'<b>Post-norm</b>: strömmen själv normaliseras efter varje addition, så den hålls på storlek 1 hela vägen. Den direkta vägen genom strömmen störs i varje block, vilket gör mycket djupa modeller svårare att träna.';}
  $('pn-pre').addEventListener('click',()=>{pre=true;draw();});$('pn-post').addEventListener('click',()=>{pre=false;draw();});draw();
})();
