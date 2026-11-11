/* ================= M3 ================= */
(function lmrows(){const g=$('lm-rows');for(let r=0;r<7;r++)rect(g,20,40+r*24,80,20,'ba',2).setAttribute('style',r===6?'':'opacity:.35');})();
(function sampling(){
  const svg=$('smp-svg');const C=[' mattan',' golvet',' soffan',' bordet',' taket',' månen'];const L=[5.1,4.3,4.0,3.2,1.5,0.2];
  const tI=$('smp-t'),pI=$('smp-p'),kI=$('smp-k');let last=null;
  function dist(){const t=+tI.value,tp=+pI.value,k=+kI.value;const mx=Math.max(...L);const ex=L.map(l=>Math.exp((l-mx)/t));const s=ex.reduce((a,b)=>a+b,0);const p=ex.map(e=>e/s);
    const keep=p.map(()=>true);if(k>0)p.forEach((_,i)=>{if(i>=k)keep[i]=false;});
    let cum=0;p.forEach((v,i)=>{if(!keep[i])return;if(cum>=tp-1e-9)keep[i]=false;else cum+=v;});
    const ks=p.reduce((a,v,i)=>a+(keep[i]?v:0),0);return {p,keep,q:p.map((v,i)=>keep[i]?v/ks:0)};}
  function draw(){$('smp-tv').textContent=(+tI.value).toFixed(2);$('smp-pv').textContent=(+pI.value).toFixed(2);clear(svg);const d=dist();
    C.forEach((c,i)=>{const y=20+i*40;txt(svg,100,y+20,c,'m','end');S('rect',{x:110,y,width:400,height:26,rx:3,class:'bg'},svg);
      if(d.keep[i]){S('rect',{x:110,y,width:Math.max(1,d.q[i]*400),height:26,rx:3,fill:'var(--tok)',style:'opacity:.85'},svg);txt(svg,116+d.q[i]*400,y+18,nf(d.q[i]*100,1)+' %','m');}
      else{S('rect',{x:110,y,width:Math.max(1,d.p[i]*400),height:26,rx:3,fill:'url(#hatch)'},svg);txt(svg,116+d.p[i]*400,y+18,'bortklippt','s');}});
    txt(svg,110,262,'Blått: sannolikhet efter klippning och renormalisering.','s');}
  [tI,pI,kI].forEach(e=>e.addEventListener('input',draw));
  $('smp-draw').addEventListener('click',()=>{const d=dist();const cnt=C.map(()=>0);for(let n=0;n<20;n++){let r=Math.random(),k=0;for(;k<C.length;k++){r-=d.q[k];if(r<=0)break;}cnt[Math.min(k,C.length-1)]++;}
    $('smp-out').innerHTML='20 dragningar: '+C.map((c,i)=>cnt[i]?'<b>'+c.trim()+'</b> ×'+cnt[i]:'').filter(Boolean).join(', ');});
  draw();
})();
/* ================= M4 ================= */
(function shift(){const g=$('shift-g');const a=['<bos>','Katten',' satt',' på',' mattan'],b=['Katten',' satt',' på',' mattan','.'];
  a.forEach((t,i)=>{const x=80+i*94;rect(g,x,40,84,30,'bt',6);txt(g,x+42,60,t,'m','middle');rect(g,x,150,84,30,'bt',6);txt(g,x+42,170,b[i],'m','middle');line(g,x+42,72,x+42,146,'ln',true);
    if(i===3){S('rect',{x:x-4,y:34,width:92,height:152,rx:8,class:'hl'},g);}});
  txt(g,280,212,'Varje kolumn är en förutsägelse. Alla räknas i samma forward pass.','s','middle');})();
(function mem(){const svg=$('mem-svg');const u=24,x0=110;
  txt(svg,100,62,'Inference','','end');rect(svg,x0,40,2*u,36,'bw',3);txt(svg,x0+2*u+8,63,'2 B/param  →  ≈ 16 GB för 8B','m');
  txt(svg,100,142,'Träning','','end');const segs=[['vikter bf16',2,'bw'],['gradienter',2,'ba'],['fp32-kopia',4,'bw'],['Adam m',4,'bkv'],['Adam v',4,'bkv']];
  let x=x0;segs.forEach(([n,b,c],i)=>{const r=rect(svg,x,120,b*u,36,c,0);if(i===2)r.setAttribute('style','fill-opacity:.4');if(i===4)r.setAttribute('style','fill-opacity:.4');txt(svg,x+b*u/2,190+(i%2)*16,n,'s','middle');line(svg,x+b*u/2,158,x+b*u/2,178-(i%2?-2:0),'lnf');x+=b*u;});
  txt(svg,x0,240,'16 B/param  →  ≈ 128 GB för 8B, plus aktiveringar','m');})();
/* ================= M5 ================= */
(function kvstep(){
  const svg=$('kv-svg');const toks=['Katten',' satt',' på',' en',' matta',' och',' sov',' gott','.'];const P=4;let s=0,withC=0,without=0;
  const x0=100,cw=52;
  function draw(){clear(svg);txt(svg,90,62,'token','s','end');txt(svg,90,112,'q (ny)','s','end');txt(svg,90,172,'K-cache','s','end');txt(svg,90,222,'V-cache','s','end');
    const filled=s===0?0:(s===1?P:P+s-1);const newFrom=s===1?0:filled-1;
    for(let c=0;c<toks.length;c++){const x=x0+c*cw;S('rect',{x,y:150,width:cw-6,height:34,rx:3,class:'bg'},svg);S('rect',{x,y:200,width:cw-6,height:34,rx:3,class:'bg'},svg);
      if(c<filled){const nw=s>0&&c>=newFrom;const st=nw?'stroke:var(--a);stroke-width:2.5':'';
        S('rect',{x,y:150,width:cw-6,height:34,rx:3,class:'bkv',style:st},svg);S('rect',{x,y:200,width:cw-6,height:34,rx:3,class:'bkv',style:st},svg);
        }
      if(c<Math.max(filled,P)){rect(svg,x,45,cw-6,26,'bt',4);txt(svg,x+(cw-6)/2,63,toks[c],'m','middle').setAttribute('style','font-size:10.5px');}}
    if(s>0){const qc=filled-1;const qx=x0+qc*cw;rect(svg,qx,96,cw-6,26,'ba',4);txt(svg,qx+(cw-6)/2,114,'q','m','middle');
      for(let c=0;c<filled;c++)line(svg,qx+(cw-6)/2,122,x0+c*cw+(cw-6)/2,148,'lnf');}
    let msg;
    if(s===0)msg='Prompten har 4 tokens. Inget är beräknat än.';
    else if(s===1)msg='<b>Prefill</b>: K och V för alla 4 positioner räknas i ett pass och sparas. Sista positionens q ger nästa token: <b>”'+toks[P].trim()+'”</b>.';
    else{const pos=filled-1;msg='<b>Decode</b>, position '+pos+': bara ”'+toks[pos].trim()+'” räknas. Dess K och V läggs till, q jämförs mot alla '+filled+' keys. Ut: <b>”'+(toks[pos+1]||'').trim()+'”</b>.';}
    $('kv-out').innerHTML=msg+'<br>K/V-vektorer räknade hittills: med cache <b>'+withC+'</b>, utan cache <b>'+without+'</b>.';
    txt(svg,x0,280,'Orange kontur: nyräknat i detta steg. Resten läses bara.','s');}
  $('kv-next').addEventListener('click',()=>{const max=toks.length-P;if(s>=max)return;s++;if(s===1){withC+=P;without+=P;}else{withC+=1;without+=P+s-1;}draw();});
  $('kv-reset').addEventListener('click',()=>{s=0;withC=0;without=0;draw();});draw();
})();
(function dec(){const svg=$('dec-svg');rect(svg,10,60,70,34,'ba',4);txt(svg,45,82,'q','m','middle');txt(svg,45,112,'[32, 1, 128]','s','middle');
  txt(svg,150,18,'K_cache [8, 12, 128]','m tkv');
  for(let h=0;h<8;h++)for(let c=0;c<12;c++){const r=rect(svg,150+c*28,26+h*14,26,12,'bkv',1);if(c===11)r.setAttribute('style','stroke:var(--a);stroke-width:2');}
  line(svg,80,77,146,77,'ln',true);txt(svg,150+11*28+13,154,'ny','s','middle');txt(svg,150,154,'position 0','s');})();
(function kvcalc(){
  const PRE=[{n:'Llama-3-8B',L:32,kv:8,hd:128,w:16.1},{n:'Llama-3-70B',L:80,kv:8,hd:128,w:141},{n:'Mistral-7B',L:32,kv:8,hd:128,w:14.5},{n:'Qwen2.5-7B',L:28,kv:4,hd:128,w:15.2},{n:'Hypotetisk 8B med MHA',L:32,kv:32,hd:128,w:16.1},{n:'DeepSeek-V3 (MLA, fp8-vikter)',L:61,mla:576,w:671}];
  const sel=$('kvc-preset');PRE.forEach((p,i)=>{const o=document.createElement('option');o.value=i;o.textContent=p.n;sel.appendChild(o);});
  const svg=$('kvc-svg');
  function draw(){const p=PRE[+sel.value],gpu=+$('kvc-gpu').value,dt=+$('kvc-dt').value,ctx=Math.pow(2,+$('kvc-ctx').value),n=Math.pow(2,+$('kvc-n').value);
    $('kvc-ctxv').textContent=ctx.toLocaleString('sv-SE');$('kvc-nv').textContent=String(n);
    const bt=p.mla?p.L*p.mla*dt:2*p.L*p.kv*p.hd*dt;const perSeq=bt*ctx/1e9,tot=perSeq*n;const usable=gpu*0.9,kvRoom=usable-p.w-5;
    clear(svg);const W=520,sc=W/gpu;let x=20;
    const ww=Math.min(p.w,gpu)*sc;rect(svg,x,30,ww,40,'bw',0);if(ww>60)txt(svg,x+ww/2,55,'vikter','s','middle');x+=ww;
    if(kvRoom>0){const kw=Math.min(tot,kvRoom)*sc;rect(svg,x,30,Math.max(1,kw),40,'bkv',0);if(kw>60)txt(svg,x+kw/2,55,'KV-cache','s','middle');x+=kw;}
    S('rect',{x:20,y:30,width:W,height:40,fill:'none',class:'lnf'},svg);S('line',{x1:20+usable*sc,y1:22,x2:20+usable*sc,y2:78,stroke:'var(--ink2)','stroke-dasharray':'3 3'},svg);
    txt(svg,20+usable*sc,94,'90 %','s','middle');txt(svg,20,18,gpu+' GB GPU-minne','s');
    let msg='Per token: <b>'+nf(bt/1024,1)+' KiB</b>. Per sekvens: <b>'+nf(perSeq,2)+' GB</b>. Totalt: <b>'+nf(tot,1)+' GB</b>. ';
    if(p.w>usable)msg+='<br><b>Vikterna får inte plats på en GPU.</b> Kräver kvantisering eller flera GPU:er (tensor parallel).';
    else{const maxS=Math.floor(kvRoom*1e9/(bt*ctx));msg+='<br>KV-utrymme ≈ '+nf(kvRoom,0)+' GB → högst <b>'+maxS.toLocaleString('sv-SE')+'</b> samtidiga sekvenser à '+ctx.toLocaleString('sv-SE')+' tokens.'+(tot>kvRoom?' <b>Valt antal får inte plats.</b>':'');}
    $('kvc-out').innerHTML=msg;}
  ['kvc-preset','kvc-gpu','kvc-dt','kvc-ctx','kvc-n'].forEach(id=>$(id).addEventListener('input',draw));draw();
})();
(function roof(){
  const svg=$('rf-svg');const W=16.06e9,KV=131072,BW=3.35e12,PK=989e12,PAR=8.03e9;const room=80*0.9e9-16.1e9-5e9;
  function step(b,c){const by=W+b*c*KV,fl=b*(2*PAR+4*32*4096*c);return{t:Math.max(by/BW,fl/PK),mem:by/BW>=fl/PK,by,fl};}
  const X=v=>60+v/9*470,Y=r=>260-(Math.log10(r)-2)/3*230;
  function draw(){const bi=+$('rf-b').value,ci=+$('rf-c').value;const b=Math.pow(2,bi),c=Math.pow(2,ci);$('rf-bv').textContent=String(b);$('rf-cv').textContent=c.toLocaleString('sv-SE');
    clear(svg);[100,1000,10000,100000].forEach(v=>{line(svg,60,Y(v),530,Y(v),'lnf');txt(svg,54,Y(v)+4,v>=1000?(v/1000)+'k':String(v),'s','end');});
    for(let k=0;k<=9;k++)txt(svg,X(k),278,String(Math.pow(2,k)),'s','middle');txt(svg,295,296,'batch','s','middle');txt(svg,14,20,'tokens/s totalt','s');
    const bmax=room/(c*KV);if(bmax<512){const xm=X(Math.max(0,Math.log2(Math.max(bmax,1))));S('rect',{x:xm,y:30,width:530-xm,height:230,fill:'url(#hatch)',style:'opacity:.6'},svg);txt(svg,Math.min(xm+6,440),46,'KV får inte plats','s');}
    let d='';for(let k=0;k<=90;k++){const v=k/10;const bb=Math.pow(2,v);const r=bb/step(bb,c).t;d+=(k?'L':'M')+X(v).toFixed(1)+' '+Y(Math.min(r,99999)).toFixed(1);}
    S('path',{d,fill:'none',stroke:'var(--tok)','stroke-width':2.5},svg);
    const s=step(b,c);const r=b/s.t;S('circle',{cx:X(bi),cy:Y(r),r:6,fill:'var(--a)'},svg);
    const wf=W/s.by*100;$('rf-out').innerHTML='Ett steg ≈ <b>'+nf(s.t*1000,1)+' ms</b>, '+(s.mem?'minnesbundet (vikter '+nf(wf,0)+' %, KV '+nf(100-wf,0)+' % av läsningen)':'beräkningsbundet')+'. ≈ <b>'+Math.round(1/s.t)+'</b> tokens/s per sekvens, <b>'+Math.round(r).toLocaleString('sv-SE')+'</b> totalt.'+(b>bmax?' <b>KV-cachen får inte plats</b> på 80 GB.':'');}
  $('rf-b').addEventListener('input',draw);$('rf-c').addEventListener('input',draw);draw();
})();
(function itl(){const g=$('itl-g');for(let k=0;k<10;k++)rect(g,388+k*56,92,8,36,'',2).setAttribute('style','fill:var(--a)');txt(g,960,84,'tokens','s','end');})();
(function quant(){const svg=$('q-svg');const sc=380/141;const rows=[['8B',[['bf16',16.1],['fp8',8.0],['int4',4.5]]],['70B',[['bf16',141],['fp8',70.6],['int4',39.5]]]];
  let y=14;rows.forEach(([m,v])=>{txt(svg,10,y+12,m,'b');y+=20;v.forEach(([f,g])=>{txt(svg,90,y+15,f,'m','end');rect(svg,100,y,g*sc,20,'bw',2).setAttribute('style','fill-opacity:'+(f==='bf16'?.9:f==='fp8'?.6:.35));txt(svg,106+g*sc,y+15,'≈ '+nf(g,g<20?1:0)+' GB','m');y+=26;});y+=10;});
  [[24,'24 GB'],[80,'80 GB']].forEach(([g,l])=>{S('line',{x1:100+g*sc,y1:30,x2:100+g*sc,y2:236,stroke:'var(--neg)','stroke-dasharray':'4 3'},svg);txt(svg,100+g*sc,246,l,'s','middle');});
  const s4=$('q4-svg');txt(s4,10,16,'int4: 16 nivåer × skala per grupp. Vikterna avrundas till närmaste nivå.','s');
  for(let k=-8;k<=7;k++){const x=280+k*32;line(s4,x,48,x,62,'ln');}line(s4,24,55,516,55,'lnf');
  const R=rng(5);for(let i=0;i<9;i++){const w=(R()*2-1)*7.2;const x=280+w*32,q=280+Math.round(w)*32;S('circle',{cx:x,cy:84,r:4,fill:'var(--w)'},s4);S('line',{x1:x,y1:80,x2:q,y2:64,stroke:'var(--a)','stroke-width':1.2},s4);}
  txt(s4,10,104,'Prickar: verkliga vikter. Linjer: avrundning till int4.','s');})();
/* ================= M6 ================= */
(function moe(){const g=$('moe-experts');const act=[1,4];for(let e=0;e<8;e++){const x=226+e*36,a=act.indexOf(e)>=0;
  line(g,370,126,x+15,170,a?'ln':'lnf',a);const r=rect(g,x,172,30,60,a?'bw':'bg',4);if(!a)r.setAttribute('style','opacity:.6');txt(g,x+15,206,'E'+(e+1),'s','middle');
  if(a)line(g,x+15,232,370,268,'ln',false);}
  S('circle',{cx:370,cy:278,r:12,class:'box'},g);txt(g,370,283,'Σ','b','middle');txt(g,470,284,'2 av 8 aktiva','s');})();
(function router(){const toks=['def',' self','(',' katten',' 42',' och'];const box=$('rt-chips'),svg=$('rt-svg');let cur=0;
  const logits=toks.map((t,i)=>{const R=rng(100+i*37);const l=Array.from({length:8},()=>R()*2);l[(i*3+1)%8]+=2.2;l[(i*5+4)%8]+=1.4;return l;});
  function draw(){clear(box);toks.forEach((t,i)=>{const b=document.createElement('button');b.className='chip t'+(i===cur?' new':'');b.style.cursor='pointer';b.textContent=t;b.addEventListener('click',()=>{cur=i;draw();});box.appendChild(b);});
    clear(svg);const l=logits[cur];const mx=Math.max(...l);const ex=l.map(v=>Math.exp(v-mx));const s=ex.reduce((a,b)=>a+b,0);const p=ex.map(e=>e/s);
    const idx=p.map((v,i)=>i).sort((a,b)=>p[b]-p[a]);const top=idx.slice(0,2);
    const pm=Math.max(...p);p.forEach((v,e)=>{const x=40+e*62,h=v/pm*150,on=top.indexOf(e)>=0;rect(svg,x,200-h,40,Math.max(1,h),on?'bw':'bg',3);txt(svg,x+20,218,'E'+(e+1),'s','middle');txt(svg,x+20,194-h,nf(v*100,0)+' %','m','middle');});
    const g1=p[top[0]]/(p[top[0]]+p[top[1]]);
    $('rt-out').innerHTML='Top-2: <b>E'+(top[0]+1)+'</b> och <b>E'+(top[1]+1)+'</b>. Renormaliserade vikter: '+nf(g1,2)+' och '+nf(1-g1,2)+'. De andra sex experterna körs inte alls för den här token.';}
  draw();})();
(function ep(){const g=$('ep-g');const map=[0,5,2,7,1,3,6,4];
  for(let gp=0;gp<4;gp++){const x=10+gp*137;rect(g,x,160,125,110,'box',8);txt(g,x+62,182,'GPU '+gp,'s','middle');
    for(let k=0;k<2;k++){const e=gp*2+k;rect(g,x+12+k*54,196,48,56,'bw',4);txt(g,x+36+k*54,228,'E'+(e+1),'m','middle');}}
  for(let t=0;t<8;t++){const x=30+t*64;rect(g,x,20,44,26,'ba',4);txt(g,x+22,38,'t'+t,'m','middle');const e=map[t],gp=Math.floor(e/2),k=e%2;line(g,x+22,46,10+gp*137+36+k*54,194,'lnf',true);}
  txt(g,280,290,'Varje token går till GPU:n som har dess expert, och tillbaka.','s','middle');})();
(function attv(){const svg=$('attv-svg');const d=[['MHA (32 KV heads)',512],['GQA-8',128],['MLA',36],['MQA',16]];
  d.forEach(([n,v],i)=>{const y=20+i*52;txt(svg,10,y-2+14,n,'s');const w=v/512*380;rect(svg,10,y+20,Math.max(2,w),22,'bkv',3);txt(svg,18+w,y+36,v+' KiB per token','m');});
  txt(svg,10,236,'32 lager, d_h = 128, bf16.','s');})();
(function lc(){const svg=$('lc-svg');const X=v=>60+(v-10)/7*460,Y=p=>240-p*200;
  [0,0.25,0.5,0.75,1].forEach(p=>{line(svg,60,Y(p),520,Y(p),'lnf');txt(svg,54,Y(p)+4,(p*100)+' %','s','end');});
  for(let k=10;k<=17;k++)txt(svg,X(k),262,(Math.pow(2,k)/1024)+'K','s','middle');txt(svg,290,278,'kontextlängd','s','middle');
  const sh=T=>{const a=4*32*4096*T;return a/(a+2*8.03e9);};let d='';for(let i=0;i<=70;i++){const v=10+i/10;d+=(i?'L':'M')+X(v).toFixed(1)+' '+Y(sh(Math.pow(2,v))).toFixed(1);}
  S('path',{d,fill:'none',stroke:'var(--tok)','stroke-width':2.5},svg);
  [[13,'8K'],[17,'128K']].forEach(([v,l])=>{const p=sh(Math.pow(2,v));S('circle',{cx:X(v),cy:Y(p),r:5,fill:'var(--a)'},svg);txt(svg,X(v)-8,Y(p)-10,l+': '+nf(p*100,0)+' %','m','end');});
  txt(svg,60,22,'Andel av FLOPs per genererad token som går till attention mot kontexten','s');})();
(function rs(){const svg=$('rs-svg');const sc=400/3500;const rows=[['Vanlig',[['prompt',200,'bt'],['svar',300,'ba']]],['Resonerande',[['prompt',200,'bt'],['thinking',3000,'bkv'],['svar',300,'ba']]]];
  rows.forEach(([n,segs],i)=>{const y=30+i*80;txt(svg,10,y-8,n,'b');let x=10;segs.forEach(([l,v,c])=>{rect(svg,x,y,v*sc,32,c,0);if(v*sc>50)txt(svg,x+v*sc/2,y+21,l+' '+v.toLocaleString('sv-SE'),'s','middle');x+=v*sc;});});
  txt(svg,10,200,'Decode-steg: 300 mot 3 300. Prefill är densamma.','s');})();
(function mm(){const g=$('mm-g');for(let r=0;r<4;r++)for(let c=0;c<4;c++)rect(g,20+c*30,40+r*30,28,28,'bg',2);txt(g,80,30,'bild → 16 patches','s','middle');
  line(g,144,100,176,100,'ln',true);rect(g,180,75,120,50,'bw',8);txt(g,240,98,'Vision','','middle');txt(g,240,114,'encoder','','middle');
  line(g,300,100,326,100,'ln',true);rect(g,330,75,100,50,'bw',8);txt(g,380,105,'Projektor','','middle');
  line(g,380,125,380,186,'ln',true);txt(g,390,160,'[16, 4096]','m ta');
  const seq=[['Beskriv','t'],null,['kort.','t']];let x=20;rect(g,x,195,80,30,'bt',5);txt(g,x+40,215,'Beskriv','m','middle');x+=86;
  for(let k=0;k<16;k++){rect(g,x,195,16,30,'ba',2);x+=19;}x+=4;rect(g,x,195,70,30,'bt',5);txt(g,x+35,215,'kort.','m','middle');
  txt(g,20,260,'Blått: token-ids via embedding. Orange: vektorer direkt från encodern.','s');
  txt(g,20,280,'Från position 1 och framåt är allt vanliga positioner i residual stream.','s');})();
(function arch(){const g=$('arch-g');const cs=20,n=6;
  function grid(x0,y0,f){for(let i=0;i<n;i++)for(let j=0;j<n;j++){const on=f(i,j);S('rect',{x:x0+j*cs,y:y0+i*cs,width:cs-2,height:cs-2,rx:2,class:on?'bt':'',fill:on?undefined:'url(#hatch)'},g);}}
  grid(30,40,(i,j)=>j<=i);txt(g,90,190,'Decoder-only','b','middle');txt(g,90,208,'causal','s','middle');
  grid(280,40,()=>true);txt(g,340,190,'Encoder-only','b','middle');txt(g,340,208,'alla ser alla','s','middle');
  for(let i=0;i<n;i++)for(let j=0;j<n;j++){S('rect',{x:500+j*cs,y:40+i*cs,width:cs-2,height:cs-2,rx:2,class:'bkv'},g);}
  txt(g,560,30,'decoder × encoder','s','middle');txt(g,590,190,'Encoder-decoder','b','middle');txt(g,590,208,'cross-attention','s','middle');
  for(let k=0;k<4;k++){const x=770+k*55;rect(g,x,80,40,40,'bw',6);txt(g,x+20,105,'s'+k,'m','middle');if(k<3)line(g,x+40,100,x+53,100,'ln',true);rect(g,x+8,140,24,24,'bt',4);line(g,x+20,140,x+20,122,'ln',true);}
  txt(g,860,190,'SSM','b','middle');txt(g,860,208,'tillstånd av fast storlek','s','middle');})();
/* ================= M7 ================= */
(function frag(){const svg=$('frag-svg');const W=500,x0=30,tot=6144,u=[300,900,120];const c=['var(--tok)','var(--a)','var(--kv)'];
  txt(svg,x0,24,'Förallokering: 3 × 2 048 platser','b');let x=x0;u.forEach((v,i)=>{const w=2048/tot*W;S('rect',{x,y:34,width:w,height:40,fill:'url(#hatch)'},svg);S('rect',{x,y:34,width:v/tot*W,height:40,fill:c[i],style:'opacity:.8'},svg);S('rect',{x,y:34,width:w,height:40,fill:'none',class:'lnf'},svg);x+=w;});
  txt(svg,x0,94,'Används: 1 320 av 6 144 platser (21 %). Resten reserverat men tomt.','s');
  txt(svg,x0,140,'Paged: block om 16 efter behov','b');x=x0;u.forEach((v,i)=>{const b=Math.ceil(v/16);for(let k=0;k<b;k++){const w=16/tot*W;S('rect',{x,y:150,width:Math.max(.8,w-.4),height:40,fill:c[i],style:'opacity:'+(k===b-1?.45:.8)},svg);x+=w;}});
  S('rect',{x,y:150,width:x0+W-x,height:40,class:'bg'},svg);txt(svg,x+(x0+W-x)/2,175,'ledigt för andra requests','s','middle');
  txt(svg,x0,210,'Allokerat: 84 block = 1 344 platser, 98 % används.','s');})();
(function paged(){
  const svg=$('pg-svg'),out=$('pg-out');const BS=4,NB=32;const plens=[6,9,3,7,5,11,4,8];const names='ABCDEFGH';
  let free,seqs,nextReq,msg,blocks;
  function reset(){free=[...Array(NB).keys()];seqs=[];nextReq=0;blocks=Array(NB).fill(null);msg='Tomt minne: 32 fysiska block om 4 tokens.';draw();}
  function alloc(s){if(!free.length)return false;const b=free.shift();blocks[b]=s.id;s.table.push(b);return true;}
  function release(s){s.table.forEach(b=>{blocks[b]=null;free.unshift(b);});s.table=[];}
  function newReq(){if(nextReq>=plens.length){msg='Inga fler requests i kön.';return draw();}
    const s={id:nextReq,name:names[nextReq],len:plens[nextReq],table:[]};const need=Math.ceil(s.len/BS);
    if(free.length<need){msg='Inte tillräckligt med lediga block för request '+s.name+'. Den får vänta i kön.';return draw();}
    for(let k=0;k<need;k++)alloc(s);seqs.push(s);nextReq++;msg='Request <b>'+s.name+'</b>: prompt på '+s.len+' tokens → '+need+' block: ['+s.table.join(', ')+'].';draw();}
  function stepAll(){if(!seqs.length){msg='Inga körande sekvenser.';return draw();}const notes=[];
    for(const s of seqs.slice()){s.len++;if((s.len-1)%BS===0){if(!alloc(s)){const v=seqs[seqs.length-1];release(v);seqs.splice(seqs.indexOf(v),1);notes.push('Minnet slut: <b>'+v.name+'</b> preemptas och dess block frigörs.');if(v===s)continue;alloc(s);}notes.push('<b>'+s.name+'</b> fick nytt block '+s.table[s.table.length-1]+'.');}}
    msg='Decode-steg: varje sekvens fick en token. '+(notes.join(' ')||'Alla fick plats i sina befintliga block.');draw();}
  function fin(){if(!seqs.length){msg='Inget att avsluta.';return draw();}const s=seqs.shift();const fr=s.table.slice();release(s);msg='<b>'+s.name+'</b> klar. Block ['+fr.join(', ')+'] är lediga igen och används först av nästa allokering.';draw();}
  function draw(){clear(svg);txt(svg,20,18,'Fysiska block','s');
    for(let b=0;b<NB;b++){const c=b%8,r=Math.floor(b/8);const x=20+c*64,y=26+r*46;const owner=blocks[b];
      const re=S('rect',{x,y,width:58,height:40,rx:4,class:owner==null?'bg':''},svg);
      txt(svg,x+4,y+12,String(b),'s').setAttribute('style','font-size:10px');
      if(owner!=null){const s=seqs.find(q=>q.id===owner);re.setAttribute('style','fill:'+SEQC[owner%SEQC.length]+';opacity:.25');S('rect',{x,y,width:58,height:40,rx:4,fill:'none',stroke:SEQC[owner%SEQC.length],'stroke-width':1.5},svg);
        txt(svg,x+29,y+24,names[owner],'b','middle');const li=s.table.indexOf(b);const used=li<s.table.length-1?BS:s.len-li*BS;
        for(let k=0;k<BS;k++)S('rect',{x:x+8+k*11,y:y+30,width:8,height:5,rx:1,fill:k<used?SEQC[owner%SEQC.length]:'var(--line)'},svg);}}
    txt(svg,20,222,'Block tables (logiskt → fysiskt)','s');
    seqs.forEach((s,i)=>{txt(svg,20+(i%2)*270,244+Math.floor(i/2)*22,s.name+' ('+s.len+' tokens): ['+s.table.join(', ')+']','m').setAttribute('style','fill:'+SEQC[s.id%SEQC.length]);});
    out.innerHTML=msg+' Lediga block: '+free.length+'.';}
  $('pg-new').addEventListener('click',newReq);$('pg-step').addEventListener('click',stepAll);$('pg-fin').addEventListener('click',fin);$('pg-reset').addEventListener('click',reset);
  reset();newReq();newReq();msg='Två requests startade. Lägg till fler, kör decode-steg och avsluta för att se hur blocken återanvänds.';draw();
})();
(function pcache(){const svg=$('pc-svg');
  function row(y,label,blocks){txt(svg,10,y+22,label,'s');blocks.forEach((b,i)=>{const x=90+i*72;rect(svg,x,y,64,34,b[1],5);txt(svg,x+32,y+21,b[0],'m','middle');});}
  row(20,'Request 1',[['sys₁','bkv'],['sys₂','bkv'],['sys₃','bkv'],['fråga₁','ba'],['fråga₁','ba']]);
  row(80,'Request 2',[['sys₁','bkv'],['sys₂','bkv'],['sys₃','bkv'],['fråga₂','ba']]);
  txt(svg,10,180,'Fysiska block','s');const phys=[['#4','h₁ ref 2','bkv'],['#9','h₂ ref 2','bkv'],['#2','h₃ ref 2','bkv'],['#11','','ba'],['#5','','ba'],['#7','','ba']];
  phys.forEach((p,i)=>{const x=90+i*72;rect(svg,x,190,64,40,p[2],5);txt(svg,x+32,206,p[0],'m','middle');if(p[1])txt(svg,x+32,222,p[1],'s','middle').setAttribute('style','font-size:10px');});
  const map1=[0,1,2,3,4],map2=[0,1,2,5];
  map1.forEach((p,i)=>line(svg,90+i*72+32,54,90+p*72+32,188,'lnf'));map2.forEach((p,i)=>line(svg,90+i*72+32,114,90+p*72+32,188,i<3?'ln':'lnf'));
  txt(svg,10,270,'Request 2 hittar h₁, h₂, h₃ i cachen och prefillar bara sitt sista block.','s');})();
(function cbatch(){
  const svg=$('cb-svg');const Lr=[6,2,4,3,5,2,6,3];let mode='static';
  function sim(){const slots=[[],[],[],[]];let t=0;
    if(mode==='static'){for(let b=0;b<2;b++){const grp=[0,1,2,3].map(k=>b*4+k);const mx=Math.max(...grp.map(r=>Lr[r]));grp.forEach((r,k)=>{for(let s=0;s<mx;s++)slots[k][t+s]=s<Lr[r]?r:null;});t+=mx;}}
    else{const q=[...Lr.keys()];const rem=[0,0,0,0],who=[null,null,null,null];while(q.length||who.some(w=>w!=null)){for(let k=0;k<4;k++){if(who[k]==null&&q.length){who[k]=q.shift();rem[k]=Lr[who[k]];}}
      for(let k=0;k<4;k++){slots[k][t]=who[k];if(who[k]!=null){rem[k]--;if(rem[k]===0)who[k]=null;}}t++;}}
    return{slots,t};}
  function draw(){clear(svg);const {slots,t}=sim();const cw=36;
    for(let k=0;k<4;k++){txt(svg,60,24+k*40+18,'plats '+(k+1),'s','end');for(let s=0;s<12;s++){const x=70+s*cw,y=20+k*40;const r=slots[k][s];
      if(s>=t){S('rect',{x,y,width:cw-3,height:34,rx:3,class:'bg',style:'opacity:.3'},svg);continue;}
      if(r==null){S('rect',{x,y,width:cw-3,height:34,rx:3,fill:'url(#hatch)'},svg);continue;}
      S('rect',{x,y,width:cw-3,height:34,rx:3,fill:SEQC[r%4],style:'opacity:'+(r<4?.75:.45)},svg);txt(svg,x+(cw-3)/2,y+22,String(r+1),'m','middle');}}
    txt(svg,70,192,'tid (steg) →','s');const used=Lr.reduce((a,b)=>a+b,0);
    $('cb-out').innerHTML='Alla 8 requests klara efter <b>'+t+' steg</b>. Utnyttjande: <b>'+Math.round(used/(t*4)*100)+' %</b> av platserna. Streckat: tom plats som ändå kostar.';}
  $('cb-static').addEventListener('click',()=>{mode='static';$('cb-static').classList.add('on');$('cb-cont').classList.remove('on');draw();});
  $('cb-cont').addEventListener('click',()=>{mode='cont';$('cb-cont').classList.add('on');$('cb-static').classList.remove('on');draw();});draw();
})();
(function chunk(){const svg=$('ch-svg');const sc=180/2048;const st=[[30,2018],[30,2018],[30,964],[31,0]];
  S('line',{x1:40,y1:220-2048*sc,x2:540,y2:220-2048*sc,stroke:'var(--ink2)','stroke-dasharray':'4 4'},svg);txt(svg,540,220-2048*sc-6,'budget 2 048','s','end');
  st.forEach(([d,p],i)=>{const x=70+i*120;let y=220;const hd=Math.max(3,d*sc);rect(svg,x,y-hd,70,hd,'bt',0);y-=hd;if(p){rect(svg,x,y-p*sc,70,p*sc,'ba',0);txt(svg,x+35,y-p*sc/2+4,String(p),'m','middle');}
    txt(svg,x+35,240,'steg '+(i+1),'s','middle');txt(svg,x+35,256,d+' decode','s','middle');});
  txt(svg,40,20,'Prompt på 5 000 tokens anländer medan 30 requests är i decode','s');})();
(function flat(){const t=$('flat-tbl');const cols=[['A','Hur',0,48],['A',' fungerar',1,49],['A',' en',2,50],['A',' KV',3,51],['A','-cache',4,52],['B',' block',37,149],['C',' och',12,76]];
  const cc={A:'var(--tok)',B:'var(--a)',C:'var(--kv)'};let h='<tr><th>Per token</th>'+cols.map((c,i)=>'<th style="color:'+cc[c[0]]+'">'+i+'</th>').join('')+'</tr>';
  h+='<tr><td>request</td>'+cols.map(c=>'<td class="n" style="color:'+cc[c[0]]+'">'+c[0]+(c[0]==='A'?' prefill':' decode')+'</td>').join('')+'</tr>';
  h+='<tr><td>input_ids</td>'+cols.map(c=>'<td class="n">'+c[1].replace(/ /g,'␣')+'</td>').join('')+'</tr>';
  h+='<tr><td>positions</td>'+cols.map(c=>'<td class="n">'+c[2]+'</td>').join('')+'</tr>';
  h+='<tr><td>slot_mapping</td>'+cols.map(c=>'<td class="n">'+c[3]+'</td>').join('')+'</tr>';
  h+='<tr><th>Per request</th><th colspan="7"></th></tr>';
  h+='<tr><td>query_start_loc</td><td class="n" colspan="7">[0, 5, 6, 7]</td></tr>';
  h+='<tr><td>seq_lens</td><td class="n" colspan="7">[5, 38, 13]</td></tr>';
  h+='<tr><td>block_table</td><td class="n" colspan="7">A: [3]   B: [7, 1, 9]   C: [4]</td></tr>';
  h+='<tr><td>logits_indices</td><td class="n" colspan="7">[4, 5, 6]   sista token per request</td></tr>';
  t.innerHTML=h;})();
(function smpl(){const g=$('smpl-g');const b=[['logits','[R, V]','ba'],['penalties','','box'],['grammatik-','mask','box'],['temperature','','box'],['top-k','top-p','box'],['sampling','','bt'],['nya ids','[R]','bt']];
  b.forEach(([a,c,cl],i)=>{const x=6+i*141;rect(g,x,40,120,56,cl,8);txt(g,x+60,c?64:73,a,'','middle');if(c)txt(g,x+60,82,c,'m','middle');if(i<b.length-1)line(g,x+120,68,x+139,68,'ln',true);});
  txt(g,6,124,'R = antal requests i steget, V = 128 256','s');})();
(function tp(){const svg=$('tp-svg');txt(svg,145,14,'GPU 0','b','middle');txt(svg,415,14,'GPU 1','b','middle');
  const rows=[['x [T, 4096] (kopia)','ba','ba'],['qkv: heads 0–15, kv 0–3','bw','bw','qkv: heads 16–31, kv 4–7'],['attention + KV-cache','bkv','bkv','attention + KV-cache'],['o_proj: delsumma','bw','bw','o_proj: delsumma'],['ALL-REDUCE'],['gate_up: halva d_ff','bw','bw','gate_up: halva d_ff'],['down: delsumma','bw','bw','down: delsumma'],['ALL-REDUCE']];
  rows.forEach((r,i)=>{const y=24+i*39;if(r[0]==='ALL-REDUCE'){rect(svg,20,y,520,28,'bn',6);txt(svg,280,y+19,'all-reduce: summera delsummorna, alla får samma x','','middle');return;}
    rect(svg,20,y,250,28,r[1],5);txt(svg,145,y+19,r[0],'s','middle');rect(svg,290,y,250,28,r[2],5);txt(svg,415,y+19,r[3]||r[0],'s','middle');});})();
(function par(){const g=$('par-g');
  txt(g,160,20,'Pipeline','b','middle');rect(g,20,50,120,60,'bw',8);txt(g,80,85,'lager 0–15','','middle');line(g,140,80,176,80,'ln',true);rect(g,180,50,120,60,'bw',8);txt(g,240,85,'lager 16–31','','middle');txt(g,160,135,'x [T, 4096] skickas mellan','s','middle');
  txt(g,500,20,'Data','b','middle');[0,1].forEach(k=>{rect(g,380+k*130,50,110,60,'bw',8);txt(g,435+k*130,85,'hel modell','','middle');rect(g,395+k*130,135,80,26,'bt',5);txt(g,435+k*130,153,k?'req 2, 4':'req 1, 3','s','middle');line(g,435+k*130,133,435+k*130,112,'ln',true);});
  txt(g,840,20,'Expert','b','middle');[0,1,2].forEach(k=>{rect(g,720+k*85,60,75,50,'bw',8);txt(g,757+k*85,90,'E'+(2*k+1)+', E'+(2*k+2),'s','middle');line(g,840,145,757+k*85,112,'lnf',true);});rect(g,800,145,80,26,'bt',5);txt(g,840,163,'router','s','middle');})();
(function spec(){const v=$('sd-view');let s=0;
  const draft=[' på',' mattan',' och',' sov'],tgt=[' på',' mattan',' eftersom'];
  function chip(t,c){return '<span class="chip '+c+'">'+t+'</span>';}
  function row(l,html){return '<div style="margin:8px 0"><div style="font-size:13px;color:var(--ink2)">'+l+'</div><div class="chips">'+html+'</div></div>';}
  function draw(){let h=row('Kontext',chip('Katten','t')+chip(' satt','t'));
    if(s===0)h+='<p class="out">Utan spekulation: 4 pass genom stora modellen för 4 tokens.</p>';
    if(s>=1)h+=row('Draft föreslår k = 4',draft.map(t=>chip(t,'new')).join(''));
    if(s>=2)h+=row('Stora modellen, ett pass över 5 positioner: vad den själv skulle välja',tgt.map((t,i)=>chip(t,i<2?'ok':'s')).join('')+chip('…','')) ;
    if(s>=3)h+=row('Jämförelse',draft.map((t,i)=>chip(t,i<2?'ok':'bad')).join(''));
    if(s>=4)h+=row('Resultat',chip('Katten','t')+chip(' satt','t')+chip(' på','ok')+chip(' mattan','ok')+chip(' eftersom','s'));
    const m=['Steg 0: utgångsläge.','Steg 1: draften är billig och föreslår 4 tokens.','Steg 2: stora modellen verifierar alla förslag i ett enda forward pass, ungefär som en liten prefill.','Steg 3: ” på” och ” mattan” stämmer. ” och” stämmer inte, så den och allt efter kastas.','Steg 4: 3 nya tokens för ett pass med stora modellen. Hade alla 4 stämt hade passet gett en femte på köpet.'];
    v.innerHTML=h+'<p class="out">'+m[s]+'</p>';}
  $('sd-next').addEventListener('click',()=>{if(s<4){s++;draw();}});$('sd-reset').addEventListener('click',()=>{s=0;draw();});draw();})();
(function flow(){const svg=$('fl-svg'),det=$('fl-detail');
  const N={n1:[20,20,'Klient'],n2:[20,100,'Frontend: template, tokenizer'],n3:[400,20,'Waiting-kö'],n4:[400,100,'Scheduler + KV-block'],n5:[400,180,'Model runner: platta ut'],n6:[400,260,'Forward: 32 lager'],n7:[400,340,'Logits + sampler'],n8:[20,340,'Output: detok, stopp, SSE']};
  const R={};Object.keys(N).forEach(k=>{const [x,y,t]=N[k];R[k]=rect(svg,x,y,220,44,k==='n6'||k==='n5'||k==='n7'?'bw':(k==='n3'||k==='n4'?'bkv':'bt'),8);txt(svg,x+110,y+27,t,'','middle').setAttribute('style','font-size:13px');});
  line(svg,130,64,130,98,'ln',true);S('path',{d:'M240 122 H320 V42 H398',class:'ln','marker-end':'url(#ah)'},svg);
  line(svg,510,64,510,98,'ln',true);line(svg,510,144,510,178,'ln',true);line(svg,510,224,510,258,'ln',true);line(svg,510,304,510,338,'ln',true);
  line(svg,400,362,242,362,'ln',true);S('path',{d:'M20 340 H8 V42 H18',class:'ln','marker-end':'url(#ah)'},svg);
  S('path',{d:'M620 362 H632 V122 H622',class:'ln','marker-end':'url(#ah)'},svg);txt(svg,648,242,'nästa steg','s','middle').setAttribute('transform','rotate(-90 648 242)');
  const st=[['n1','Request in','POST /v1/chat/completions med messages, max_tokens och temperature.'],
    ['n2','Template och tokenisering','Chat template ger en sträng, tokenizern ger 1 210 ids. Parametrarna valideras.'],
    ['n3','I kön','Requesten skickas till EngineCore och hamnar i waiting-kön.'],
    ['n4','Schedulern väljer','Systemprompten på 1 008 tokens finns i prefix-cachen (63 block). 202 tokens återstår att prefilla. Totalt behövs 76 block, varav 13 nya allokeras. Token-budgeten räcker för hela resten i det här steget.'],
    ['n5','Platta ut','Stegets tokens: 202 från denna request + 1 från var och en av 40 requests i decode. input_ids [242], positions [242], slot_mapping [242], query_start_loc [42], block tables.'],
    ['n6','Forward','Embedding [242, 4096] → 32 lager. I varje lager: qkv_proj, RoPE, nya K och V skrivs till sina slots, PagedAttention läser via block tables (inklusive de 63 cachade blocken), MLP.'],
    ['n7','Logits och sampling','Logits bara för 41 positioner, en per request: [41, 128256]. Samplern drar en token per request.'],
    ['n8','Strömma ut','Nya token detokeniseras inkrementellt, stoppvillkor kontrolleras och texten skickas som SSE. Första token är framme: TTFT är passerad.'],
    ['n4','Nästa steg: decode','Requesten får nu 1 token per steg. Var 16:e token behövs ett nytt KV-block.'],
    ['n6','Varje decode-steg','En rad [1, 4096] för denna request i en större platt batch. Attention läser 1 211, 1 212, … positioner ur cachen.'],
    ['n8','Klar','Modellen producerar <|eot_id|>. Requesten är finished, blocken frigörs men ligger kvar i prefix-cachen tills minnet behövs.']];
  let i=0;function draw(){Object.keys(R).forEach(k=>R[k].setAttribute('style',''));R[st[i][0]].setAttribute('style','stroke:var(--tok);stroke-width:3');
    det.innerHTML='';const h=document.createElement('h3');h.style.marginTop='0';h.textContent=(i+1)+'. '+st[i][1];const p=document.createElement('p');p.textContent=st[i][2];det.append(h,p);$('fl-n').textContent=(i+1)+' / '+st.length;}
  $('fl-next').addEventListener('click',()=>{if(i<st.length-1){i++;draw();}});$('fl-prev').addEventListener('click',()=>{if(i>0){i--;draw();}});draw();})();
/* ================= M8 ================= */
(function dir(){const svg=$('dir-svg');const R=rng(11);const A=[],B=[];
  for(let i=0;i<28;i++){A.push([160+(R()-.5)*120,230+(R()-.5)*110]);B.push([340+(R()-.5)*120,120+(R()-.5)*110]);}
  A.forEach(p=>S('circle',{cx:p[0],cy:p[1],r:5,fill:'none',stroke:'var(--ink2)','stroke-width':1.5},svg));B.forEach(p=>S('circle',{cx:p[0],cy:p[1],r:5,fill:'var(--a)'},svg));
  const ma=[A.reduce((s,p)=>s+p[0],0)/A.length,A.reduce((s,p)=>s+p[1],0)/A.length],mb=[B.reduce((s,p)=>s+p[0],0)/B.length,B.reduce((s,p)=>s+p[1],0)/B.length];
  S('line',{x1:ma[0],y1:ma[1],x2:mb[0],y2:mb[1],stroke:'var(--tok)','stroke-width':3,'marker-end':'url(#ah)'},svg);
  const mx=(ma[0]+mb[0])/2,my=(ma[1]+mb[1])/2,dx=mb[0]-ma[0],dy=mb[1]-ma[1];const L=Math.hypot(dx,dy);const px=-dy/L*170,py=dx/L*170;
  S('line',{x1:mx-px,y1:my-py,x2:mx+px,y2:my+py,stroke:'var(--ink2)','stroke-dasharray':'5 4'},svg);
  txt(svg,mb[0]+8,mb[1]-10,'r','b tt');txt(svg,20,330,'Ofyllda: utan egenskapen. Orange: med. Streckat: en linear probe.','s');})();
(function steer(){const svg=$('st-svg');const ra=20*Math.PI/180,rx=Math.cos(ra),ry=Math.sin(ra);let abl=false;const cx=200,cy=200,sc=110;
  const P=(x,y)=>[cx+x*sc,cy-y*sc];
  function arrow(x,y,c,w,dash){const [a,b]=P(x,y);S('line',{x1:cx,y1:cy,x2:a,y2:b,stroke:c,'stroke-width':w,'stroke-dasharray':dash||'','stroke-linecap':'round'},svg);S('circle',{cx:a,cy:b,r:w+1.5,fill:c},svg);return[a,b];}
  function draw(){clear(svg);const ang=+$('st-ang').value*Math.PI/180,al=+$('st-a').value;$('st-av').textContent=al.toFixed(1);
    const [e1,e2]=P(-rx*1.6,-ry*1.6),[f1,f2]=P(rx*2.6,ry*2.6);S('line',{x1:e1,y1:e2,x2:f1,y2:f2,stroke:'var(--line)','stroke-width':1},svg);
    const x=[Math.cos(ang)*1.2,Math.sin(ang)*1.2];let y=x.slice();const d0=x[0]*rx+x[1]*ry;
    if(abl){y=[x[0]-d0*rx,x[1]-d0*ry];}y=[y[0]+al*rx,y[1]+al*ry];const d1=y[0]*rx+y[1]*ry;
    const [ux,uy]=arrow(rx,ry,'var(--tok)',3);txt(svg,ux+10,uy+16,'r̂','b tt');
    arrow(x[0],x[1],'var(--ink2)',2,'5 4');const [xa,xb]=P(x[0],x[1]);txt(svg,xa+8,xb-6,'x','b');
    const [ya,yb]=arrow(y[0],y[1],'var(--a)',3);txt(svg,ya+8,yb+16,"x′",'b ta');
    const [pa,pb]=P(d1*rx,d1*ry);S('line',{x1:ya,y1:yb,x2:pa,y2:pb,stroke:'var(--a)','stroke-dasharray':'2 3'},svg);
    $('st-out').innerHTML='x · r̂ = <b>'+nf(d0,2)+'</b> → efter ingrepp <b>'+nf(d1,2)+'</b>.'+(abl?' Ablation tog bort komponenten längs r̂; det vinkelräta är orört.':'');}
  $('st-ang').addEventListener('input',draw);$('st-a').addEventListener('input',draw);
  $('st-abl').addEventListener('click',()=>{abl=!abl;$('st-abl').classList.toggle('on',abl);$('st-abl').textContent=abl?'Ablation på':'Ablation av';draw();});draw();})();

