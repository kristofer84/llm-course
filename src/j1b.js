/* ================= M1 ================= */
(function bpe(){
  const steps=[null,['t','t'],['k','a'],['ka','tt'],['u','n'],['un','g'],['a','r']];
  let toks,i;const box=$('bpe-chips'),out=$('bpe-out');
  function render(nt){clear(box);toks.forEach(t=>{const c=document.createElement('span');c.className='chip t'+(t===nt?' new':'');c.textContent=t;box.appendChild(c);});}
  function reset(){toks='kattungar'.split('');i=0;render();out.innerHTML=L.t('Start: <b>9 tokens</b>, ett per tecken.');}
  $('bpe-next').addEventListener('click',()=>{
    if(i>=steps.length-1){out.innerHTML=L.t('Klart: <b>{{n}} tokens</b> i stället för 9. ”katt” är nu en egen token som återanvänds i alla ord där den förekommer.',{n:toks.length});return;}
    i++;const p=steps[i];const o=[];for(let j=0;j<toks.length;j++){if(j<toks.length-1&&toks[j]===p[0]&&toks[j+1]===p[1]){o.push(p[0]+p[1]);j++;}else o.push(toks[j]);}toks=o;
    render(p[0]+p[1]);out.innerHTML=L.t('Merge {{i}}: ({{x}}, {{y}}) → <b>{{xy}}</b>. Nu {{n}} tokens.',{i:i,x:p[0],y:p[1],xy:p[0]+p[1],n:toks.length});});
  $('bpe-reset').addEventListener('click',reset);reset();
})();
(function emb(){
  const g=$('emb-rows');const toks=['<|begin_of_text|>','K','atten',' satt',' på'];const rows=[13,3,7,5,10];
  for(let r=0;r<15;r++){const used=rows.indexOf(r)>=0;rect(g,260,20+r*20,200,17,used?'bw':'bg',2);}
  toks.forEach((t,i)=>{const y=40+i*55;rect(g,10,y,150,30,'bt',6);txt(g,85,y+20,t,'m','middle');
    const ry=20+rows[i]*20+8;line(g,160,y+15,256,ry,'ln',true);
    const oy=90+i*28;rect(g,540,oy,170,22,'ba',3);line(g,460,ry,536,oy+11,'lnf',false);txt(g,532,oy+15,'x['+i+']','s','end');});
  txt(g,360,336,L.t('15 av 128 256 rader visas'),'s','middle');
})();

/* ================= M2 ================= */
(function residual(){
  const svg=$('res-svg');const names=['embedding','attn₁','mlp₁','attn₂','mlp₂','attn₃','mlp₃','attn₄','mlp₄'];
  const R=rng(31);const contrib=names.map((n,k)=>Array.from({length:8},()=>(R()*2-1)*(k===0?1.1:0.55)));
  let n=1;const base=130,sc=45;
  function draw(){clear(svg);line(svg,30,base,540,base,'lnf');
    const sum=Array(8).fill(0),prev=Array(8).fill(0);
    for(let k=0;k<n;k++)for(let d=0;d<8;d++){if(k===n-1)prev[d]=sum[d];sum[d]+=contrib[k][d];}
    for(let d=0;d<8;d++){const x=50+d*62;const v=Math.max(-2.4,Math.min(2.4,sum[d]));
      if(n>0){const y=v>=0?base-v*sc:base;rect(svg,x,y,40,Math.max(1,Math.abs(v)*sc),v>=0?'':'',2).setAttribute('style','fill:'+(v>=0?'var(--a)':'var(--neg)')+';opacity:.85');}
      if(n>1){const p=Math.max(-2.4,Math.min(2.4,prev[d]));const y1=base-Math.max(p,v)*sc,y2=base-Math.min(p,v)*sc;
        S('rect',{x:x-4,y:y1,width:48,height:Math.max(1,y2-y1),rx:2,fill:'none',stroke:'var(--tok)','stroke-width':1.5,'stroke-dasharray':'3 2'},svg);}
      txt(svg,x+20,250,'d'+d,'s','middle');}
    $('res-out').innerHTML=n===0?L.t('Strömmen är tom innan embedding.'):'x = '+names.slice(0,n).join(' + ')+(n<names.length?'':' '+L.t('<b>(klart)</b>'));}
  $('res-next').addEventListener('click',()=>{if(n<names.length){n++;draw();}});
  $('res-reset').addEventListener('click',()=>{n=1;draw();});draw();
})();
(function rms(){
  const svg=$('rms-svg');const v=[3.0,-1.2,0.6,2.2,-2.6,0.4,1.4,-0.8];const r=Math.sqrt(v.reduce((s,a)=>s+a*a,0)/v.length);
  const base=150,sc=36;
  function grp(x0,vals,title){line(svg,x0-6,base,x0+8*30,base,'lnf');vals.forEach((a,i)=>{const h=Math.abs(a)*sc;rect(svg,x0+i*30,a>=0?base-h:base,22,Math.max(1,h),'',2).setAttribute('style','fill:'+(a>=0?'var(--a)':'var(--neg)')+';opacity:.85');});txt(svg,x0+117,285,title,'s','middle');}
  grp(20,v,L.t('före: RMS = {{v}}',{v:nf(r,2)}));grp(300,v.map(a=>a/r),L.t('efter: RMS = 1,00'));
  txt(svg,280,30,'÷ '+nf(r,2),'m','middle');line(svg,262,40,300,40,'ln',true);
})();
(function heads(){
  const svg=$('heads-svg');txt(svg,20,20,'Q [T, 4096] = 32 heads × 128','m ta');
  for(let h=0;h<32;h++){rect(svg,20+h*20,30,19,28,'ba',2).setAttribute('style','opacity:'+(h%2?.6:1));}
  for(let g=0;g<8;g++){const x1=20+g*80+2,x2=20+g*80+78;S('path',{d:'M'+x1+' 64 V70 H'+x2+' V64',class:'ln'},svg);
    line(svg,20+g*80+40,70,20+g*20+10,110,'lnf');}
  txt(svg,20,128,'','m');txt(svg,200,128,'K [T, 1024] = 8 KV heads × 128','m ta');
  for(let h=0;h<8;h++)rect(svg,20+h*20,112,19,28,'ba',2).setAttribute('style','opacity:'+(h%2?.6:1));
  txt(svg,200,188,'V [T, 1024] = 8 KV heads × 128','m ta');
  for(let h=0;h<8;h++)rect(svg,20+h*20,172,19,28,'ba',2).setAttribute('style','opacity:'+(h%2?.6:1));
  txt(svg,20,236,L.t('Hakarna visar GQA: query heads 0–3 delar KV head 0, 4–7 delar KV head 1 och så vidare.'),'s');
})();
(function rope(){
  const svg=$('rope-svg');const mI=$('rope-m'),nI=$('rope-n');const th=[0.55,0.06],q0=0.35,k0=1.2;
  function arrow(cx,cy,a,color,lbl){const x=cx+Math.cos(a)*85,y=cy-Math.sin(a)*85;S('line',{x1:cx,y1:cy,x2:x,y2:y,stroke:color,'stroke-width':3,'stroke-linecap':'round'},svg);S('circle',{cx:x,cy:y,r:5,fill:color},svg);txt(svg,cx+Math.cos(a)*102,cy-Math.sin(a)*102+4,lbl,'m','middle');}
  function draw(){clear(svg);const m=+mI.value,n=+nI.value;const dots=[];
    [[140,L.t('par 0: snabb rotation')],[420,L.t('par 40: långsam rotation')]].forEach(([cx,t],i)=>{const cy=140;
      S('circle',{cx,cy,r:85,class:'lnf'},svg);txt(svg,cx,262,t,'s','middle');
      const qa=q0+m*th[i],ka=k0+n*th[i];arrow(cx,cy,qa,'var(--tok)','q');arrow(cx,cy,ka,'var(--kv)','k');dots.push(Math.cos(qa-ka));});
    $('rope-out').innerHTML=L.t('m − n = <b>{{d}}</b>. Skalärprodukt q·k: par 0 = <b>{{p0}}</b>, par 40 = <b>{{p40}}</b>. Flytta båda reglagen lika mycket: värdena står still, eftersom bara avståndet räknas.',{d:m-n,p0:nf(dots[0],2),p40:nf(dots[1],2)});}
  mI.addEventListener('input',draw);nI.addEventListener('input',draw);draw();
})();
(function attn(){
  const svg=$('att-svg');const T=['<bos>','Katten','satt','på','mattan','eftersom','den'];const n=T.length;const R=rng(7);
  const S0=T.map((_,i)=>T.map((_,j)=>{if(j>i)return null;let v=R()*2.4-1.2;if(j===0)v+=1.2;if(j===i)v+=0.6;if(i===6&&j===1)v=3.4;if(i===3&&j===2)v+=1.5;if(i===4&&j===3)v+=1.8;return v;}));
  const P=S0.map(r=>{const ok=r.filter(v=>v!=null);const mx=Math.max(...ok);const ex=r.map(v=>v==null?0:Math.exp(v-mx));const s=ex.reduce((a,b)=>a+b,0);return ex.map(e=>e/s);});
  let mode='raw',sel=6;const cs=44,x0=120,y0=90;
  function draw(){clear(svg);
    T.forEach((t,i)=>{txt(svg,x0-8,y0+i*cs+cs/2+4,t,'m','end');const tt=txt(svg,x0+i*cs+cs/2,y0-8,t,'m');tt.setAttribute('transform','rotate(-40 '+(x0+i*cs+cs/2)+' '+(y0-8)+')');});
    txt(svg,x0-8,y0-50,'query ↓  key →','s','end');
    for(let i=0;i<n;i++)for(let j=0;j<n;j++){const x=x0+j*cs,y=y0+i*cs;const v=S0[i][j];
      if(v==null){S('rect',{x,y,width:cs-2,height:cs-2,fill:'url(#hatch)'},svg);continue;}
      let fill,op;if(mode==='raw'){fill=v>=0?'var(--tok)':'var(--neg)';op=Math.min(1,Math.abs(v)/3.4)*0.85+0.08;}else{fill='var(--a)';op=0.08+P[i][j]*0.92;}
      S('rect',{x,y,width:cs-2,height:cs-2,fill,style:'opacity:'+op.toFixed(2)},svg);
      txt(svg,x+cs/2-1,y+cs/2+4,mode==='raw'?nf(v,1):nf(P[i][j],2),'m','middle').setAttribute('style','font-size:10.5px');}
    S('rect',{x:x0-3,y:y0+sel*cs-2,width:n*cs+2,height:cs+2,rx:4,class:'hl'},svg);
    for(let i=0;i<n;i++){const r=S('rect',{x:20,y:y0+i*cs,width:x0+n*cs-20,height:cs-2,fill:'transparent',style:'cursor:pointer'},svg);r.addEventListener('click',()=>{sel=i;draw();});}
    const row=P[sel];let best=0;row.forEach((p,j)=>{if(p>row[best])best=j;});
    $('att-out').innerHTML=L.t(sel?'Rad <b>{{t}}</b> ser {{n}} positioner.':'Rad <b>{{t}}</b> ser {{n}} position.',{t:T[sel],n:sel+1})+' '+(sel<n-1?L.t('Positionerna till höger är maskade (−∞ → 0 efter softmax).')+' ':'')+L.t('Högst vikt efter softmax: <b>{{t}}</b> ({{p}}).',{t:T[best],p:nf(row[best],2)});}
  $('att-raw').addEventListener('click',()=>{mode='raw';$('att-raw').classList.add('on');$('att-soft').classList.remove('on');draw();});
  $('att-soft').addEventListener('click',()=>{mode='soft';$('att-soft').classList.add('on');$('att-raw').classList.remove('on');draw();});
  draw();
})();
(function pv(){
  const svg=$('pv-svg');const toks=['Katten','satt','på','mattan','eftersom','den','var','trött'];
  const W=[{0:1},{0:.7,1:.3},{1:.5,2:.3,0:.2},{2:.55,3:.25,1:.1,0:.1},{1:.35,4:.3,3:.15,0:.2},{0:.62,3:.18,5:.12,4:.08},{5:.55,6:.25,0:.2},{0:.45,5:.3,6:.15,7:.1}];
  const notes={0:L.t('Första token har inget att titta bakåt på, så den hämtar bara från sig själv.'),5:L.t('”den” hämtar mest från ”Katten”. Huvudet har lärt sig koppla pronomen till troliga syftningar, så information om katten lyfts in i ”den”s vektor.'),7:L.t('”trött” hämtar från ”Katten” och ”den”: vem är trött? Det behövs för att förutsäga fortsättningen.')};
  let q=5;const X=i=>45+i*84,BY=150,BH=34;
  function draw(){clear(svg);const w=W[q];
    Object.keys(w).forEach(k=>{k=+k;if(k===q)return;const v=w[k];const x1=X(q),x2=X(k),h=22+Math.abs(q-k)*12;
      S('path',{d:'M'+x1+' '+(BY-2)+' Q'+((x1+x2)/2)+' '+(BY-2-h*2)+' '+x2+' '+(BY-2),fill:'none',stroke:'var(--a)','stroke-width':(1+v*9).toFixed(1),'stroke-linecap':'round',style:'opacity:'+(0.3+0.7*v).toFixed(2)},svg);});
    toks.forEach((t,i)=>{const masked=i>q;const g=S('g',{style:'cursor:pointer;opacity:'+(masked?.35:1)},svg);
      rect(g,X(i)-37,BY,74,BH,i===q?'ba':'box',6);txt(g,X(i),BY+BH/2+5,t,i===q?'b':'','middle').setAttribute('style','font-size:13px');
      g.addEventListener('click',()=>{q=i;draw();});
      const v=w[i]||0;if(!masked){S('rect',{x:X(i)-14,y:270-v*60,width:28,height:Math.max(1,v*60),rx:3,fill:'var(--a)',style:'opacity:'+(0.25+0.75*v).toFixed(2)},svg);txt(svg,X(i),292,Math.round(v*100)+' %','s','middle');}
      else txt(svg,X(i),292,L.t('dold'),'s','middle');});
    $('pv-out').innerHTML=(notes[q]||L.t('”{{t}}” hämtar mest från närliggande ord, typiskt för heads som bygger lokal grammatik.',{t:toks[q]}))+' '+L.t('Ord efter ”{{t}}” är dolda av masken.',{t:toks[q]});}
  draw();
})();
(function gqa(){
  const svg=$('gqa-svg');txt(svg,16,36,L.t('32 query heads'),'s');
  for(let g=0;g<8;g++){const kx=16+g*66+16;rect(svg,kx,180,24,24,'bkv',3);txt(svg,kx+12,197,String(g),'m','middle').setAttribute('style','font-size:11px');
    for(let h=0;h<4;h++){const x=16+g*66+h*14;rect(svg,x,50,12,12,'bt',2);line(svg,x+6,62,kx+12,178,'lnf');}}
  txt(svg,16,232,L.t('8 KV heads: varje KV head (K och V) delas av 4 query heads'),'s');
  txt(svg,16,270,L.t('Cachen lagrar bara de 8 lila. 32 blå räknas fram och kastas varje steg.'),'s');
})();
(function silu(){
  const svg=$('silu-svg');const X=x=>60+(x+5)/10*580,Y=y=>150-(y+0.5)/5.5*130;
  line(svg,60,Y(0),640,Y(0),'lnf');line(svg,X(0),20,X(0),165,'lnf');
  let d1='',d2='';for(let i=0;i<=200;i++){const x=-5+i*0.05;const s=x/(1+Math.exp(-x));const r=Math.max(0,x);d1+=(i?'L':'M')+X(x).toFixed(1)+' '+Y(s).toFixed(1);d2+=(i?'L':'M')+X(x).toFixed(1)+' '+Y(r).toFixed(1);}
  S('path',{d:d2,fill:'none',stroke:'var(--ink2)','stroke-width':1.5,'stroke-dasharray':'5 4'},svg);
  S('path',{d:d1,fill:'none',stroke:'var(--a)','stroke-width':2.5},svg);
  txt(svg,600,Y(4.4),'SiLU','ta b','end');txt(svg,600,Y(4.9)-6,'ReLU','s','end');
  txt(svg,X(-5),Y(0)+16,'−5','s');txt(svg,X(5),Y(0)+16,'5','s','end');
})();
(function params(){
  const svg=$('param-svg');const d=[['Embedding',0.525],['Attention ×32',1.342],['MLP ×32',5.637],['LM head',0.525]];
  d.forEach(([n,v],i)=>{const y=20+i*50;txt(svg,140,y+22,n,'','end');const w=v/5.637*330;rect(svg,150,y,w,32,'bw',3).setAttribute('style','fill-opacity:'+(i===2?.9:.35));txt(svg,158+w,y+22,nf(v,2)+' B','m');});
  txt(svg,150,222,L.t('Totalt ≈ 8,03 B parametrar'),'s');
})();
(function tracer(){
  const list=$('tr-list'),det=$('tr-detail');let mode='prefill',i=0;
  function steps(){const P=mode==='prefill';const T=P?7:1,c=12;const B='1, '+T;
    return [
      [L.t('Tokenisering'),P?'ids [1, 7]':'ids [1, 1]',P?L.t('Prompten blir 7 token-ids. Batch med en sekvens.'):L.t('Bara den senast samplade token. Övriga 11 finns redan i KV-cachen.')],
      ['Embedding','x = E[ids]   →   x ['+B+', 4096]',L.t('Tabelluppslagning, ingen beräkning.')],
      [L.t('RMSNorm, lager 0'),'h = RMSNorm(x)   →   ['+B+', 4096]',L.t('Normaliserar varje rad. x själv lämnas orörd.')],
      ['qkv_proj','h @ W_qkv [4096, 6144]   →   ['+B+', 6144]\nsplit → Q ['+B+', 4096]  K ['+B+', 1024]  V ['+B+', 1024]',P?L.t('7 rader mot samma 50 MB vikter. Bra återanvändning.'):L.t('1 rad mot 50 MB vikter. Läsningen dominerar.')],
      [L.t('Dela i heads'),'Q [1, 32, '+T+', 128]   K, V [1, 8, '+T+', 128]',L.t('view + transpose, ingen data kopieras i princip.')],
      ['RoPE',P?L.t('positions = [0..6]   Q, K roteras, shape oförändrad'):L.t('positions = [11]   Q, K roteras, shape oförändrad'),L.t('Vinkeln beror på positionen.')],
      [L.t('Skriv KV-cache'),P?L.t('K_cache, V_cache [8, 7, 128] för lager 0'):'append → K_cache, V_cache [8, 12, 128]',P?L.t('Alla 7 positioner skrivs.'):L.t('En ny position läggs till. De 11 gamla läses bara.')],
      ['Attention-scores',P?'S = Q Kᵀ / √128   →   [1, 32, 7, 7]   + causal mask':L.t('S = q Kᵀ / √128   →   [1, 32, 1, 12]   ingen mask behövs'),L.t('Query heads 0–3 använder KV head 0, osv. (GQA).')],
      ['Softmax','P   →   '+(P?'[1, 32, 7, 7]':'[1, 32, 1, 12]'),L.t('Varje rad summerar till 1.')],
      ['P @ V',(P?'[1, 32, 7, 128]':'[1, 32, 1, 128]')+'   →   reshape ['+B+', 4096]',L.t('Viktad summa av values, heads läggs bredvid varandra.')],
      ['o_proj + residual','out = O @ Wo [4096, 4096]   →   ['+B+', 4096]\nx = x + out',L.t('Första bidraget till strömmen i lagret.')],
      ['RMSNorm','h = RMSNorm(x)   →   ['+B+', 4096]',''],
      ['gate_up_proj','h @ W_gate_up [4096, 28672]   →   ['+B+', 28672]\nsplit → gate, up ['+B+', 14336]',L.t('Största matrisen i lagret: 235 MB i bf16.')],
      ['SiLU(gate) ⊙ up','a   →   ['+B+', 14336]',L.t('Elementvis, billigt.')],
      ['down_proj + residual','out = a @ W_down [14336, 4096]   →   ['+B+', 4096]\nx = x + out',L.t('Lager 0 klart.')],
      [L.t('Lager 1–31'),L.t('samma sak 31 gånger till\nx [{{sh}}, 4096] hela vägen',{sh:B}),L.t('Varje lager har egna vikter och egen KV-cache.')],
      ['Final RMSNorm','h   →   ['+B+', 4096]',''],
      ['LM head',P?'h[:, -1] [1, 4096] @ W_U [4096, 128256]   →   logits [1, 128256]':'h [1, 4096] @ W_U [4096, 128256]   →   logits [1, 128256]',P?L.t('Bara sista positionen behövs för nästa token.'):L.t('Den enda positionen är den sista.')],
      ['Sampling',L.t('softmax, temperature, top-p   →   ny id [1]'),P?L.t('Prefill klar. Nästa varv är ett decode-steg.'):L.t('Token nummer 13 i sekvensen. Nästa varv har kontext 13.')]];}
  function render(){const st=steps();clear(list);st.forEach((s,k)=>{const li=document.createElement('li');li.textContent=(k+1)+'. '+s[0];if(k===i)li.className='cur';else if(k<i)li.className='done';li.addEventListener('click',()=>{i=k;render();});list.appendChild(li);});
    const s=st[i];det.innerHTML='';const h=document.createElement('h3');h.style.marginTop='0';h.textContent=s[0];const e=document.createElement('div');e.className='eq';e.textContent=s[1];const p=document.createElement('p');p.textContent=s[2];det.append(h,e,p);}
  $('tr-next').addEventListener('click',()=>{if(i<steps().length-1){i++;render();}});
  $('tr-prev').addEventListener('click',()=>{if(i>0){i--;render();}});
  $('tr-prefill').addEventListener('click',()=>{mode='prefill';$('tr-prefill').classList.add('on');$('tr-decode').classList.remove('on');render();});
  $('tr-decode').addEventListener('click',()=>{mode='decode';$('tr-decode').classList.add('on');$('tr-prefill').classList.remove('on');render();});
  render();
})();
