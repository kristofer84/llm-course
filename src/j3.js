/* ================= v2: new interactives ================= */
function heatRow(parent,label,vals,color,bold){const l=H('span',null,label,parent);l.style.cssText='font-family:var(--mono);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;'+(bold?'font-weight:600;color:var(--a)':'color:var(--ink2)');
  vals.forEach(v=>{const c=H('i',null,null,parent);c.style.background=v>=0?color:'var(--neg)';c.style.opacity=(0.1+Math.min(1,Math.abs(v))*0.9).toFixed(2);});}
function hbar(parent,label,frac,text,color,dim){const r=H('div',null,null,parent);r.style.cssText='display:grid;grid-template-columns:90px 1fr 70px;gap:8px;align-items:center;margin:4px 0;font-size:14px'+(dim?';opacity:.4':'');
  const a=H('span',null,label,r);a.style.cssText='font-family:var(--mono);text-align:right';const t=H('div',null,null,r);t.style.cssText='background:var(--soft);border-radius:3px;height:18px';
  const f=H('div',null,null,t);f.style.cssText='height:100%;border-radius:3px;background:'+color+';width:'+Math.max(0.5,frac*100)+'%';const v=H('span',null,text,r);v.style.cssText='font-family:var(--mono);font-size:13px';}
(function example(){
  const box=$('ex-stages'),view=$('ex-view'),tx=$('ex-text');let cur=0;
  const cand=[' mattan',' golvet',' soffan',' bordet',' taket'],lg=[5.1,4.3,4.0,3.2,1.5];const ex=lg.map(v=>Math.exp(v-5.1)),es=ex.reduce((a,b)=>a+b,0),pr=ex.map(v=>v/es);
  const tk=['<bos>','K','atten',' satt',' på'];
  function chips(arr,cls,nw){const d=H('div','chips',null,view);arr.forEach((t,i)=>H('span','chip '+(nw!=null&&i===nw?'new':cls),t,d));}
  function heat(seed,hi){const d=H('div','heat',null,view);d.style.gridTemplateColumns='70px repeat(20,1fr)';const R=rng(seed);tk.forEach((t,i)=>heatRow(d,t,Array.from({length:20},()=>R()*2-1),'var(--a)',i===hi));}
  function cap(t){const p=H('p',null,t,view);p.style.cssText='font-family:var(--mono);font-size:13px;color:var(--ink2);margin:10px 0 0';}
  const st=[
   ['Text',2,'Allt börjar som en vanlig textsträng. Modellen kan inte läsa den i den här formen.',()=>{chips(['Katten satt på'],'');cap('en sträng, 14 tecken');}],
   ['Tokens',2,'Tokenizern delar texten i bitar ur en fast vokabulär och ger varje bit ett id. Först läggs en specialtoken som markerar början.',()=>{chips(tk,'t');cap('ids [5]   fem heltal mellan 0 och 128 255');}],
   ['Embedding',2,'Varje id slår upp en rad i embedding-tabellen. Nu är varje token en vektor med 4096 tal. Det här är startvärdet i residual stream.',()=>{heat(11,-1);cap('x [5, 4096]   (20 av 4096 dimensioner visas)');}],
   ['32 block',3,'Varje block låter positionerna läsa från varandra (attention) och bearbetar sedan varje position för sig (MLP). Resultaten adderas till strömmen. Efter 32 block bär sista raden allt som behövs för att gissa nästa token.',()=>{heat(29,4);cap('x [5, 4096]   samma shape, nytt innehåll. Sista raden används.');}],
   ['Logits',4,'Sista radens vektor multipliceras med LM head. Resultatet är ett tal per token i vokabulären: ju högre, desto troligare fortsättning.',()=>{cand.forEach((c,i)=>hbar(view,c,lg[i]/5.5,nf(lg[i],1),'var(--a)'));cap('logits [128256]   de fem högsta visas');}],
   ['Sampling',4,'Softmax gör om logits till sannolikheter, och en token dras. Här blev det ” mattan”.',()=>{cand.forEach((c,i)=>hbar(view,c,pr[i],nf(pr[i]*100,0)+' %','var(--tok)',i>0));cap('ett id: token för ” mattan”');}],
   ['Nästa varv',6,'Den nya token läggs till och allt körs igen. Men bara den nya positionen behöver räknas: keys och values för de fem första ligger kvar i KV-cachen. Så växer svaret, en token per varv.',()=>{chips(tk.concat([' mattan']),'t',5);cap('1 ny position räknas, 5 läses ur KV-cachen');}]];
  function draw(){clear(box);st.forEach((s,i)=>{const b=H('button','btn'+(i===cur?' on':''),(i+1)+'. '+s[0],box);b.addEventListener('click',()=>{cur=i;draw();});});
    clear(view);st[cur][3]();clear(tx);H('h3',null,(cur+1)+'. '+st[cur][0],tx).style.marginTop='0';H('p',null,st[cur][2],tx);
    const g=H('button','btn','Fördjupning: modul '+st[cur][1]+', '+MODS[st[cur][1]],tx);g.dataset.gomod=st[cur][1];
    if(cur<st.length-1){const n=H('button','btn','Nästa steg',tx);n.style.marginLeft='8px';n.addEventListener('click',()=>{cur++;draw();});}}
  draw();
})();
(function dot(){
  const svg=$('dp-svg');const cx=260,cy=165,sc=115;
  function arrow(x,y,c,w,lbl){const X=cx+x*sc,Y=cy-y*sc;S('line',{x1:cx,y1:cy,x2:X,y2:Y,stroke:c,'stroke-width':w,'stroke-linecap':'round'},svg);S('circle',{cx:X,cy:Y,r:w+2,fill:c},svg);if(lbl)txt(svg,X+(x>=0?10:-18),Y+(y>=0?-8:18),lbl,'b');}
  function draw(){clear(svg);const A=+$('dp-a').value*Math.PI/180,B=+$('dp-b').value*Math.PI/180,L=+$('dp-l').value;
    S('circle',{cx,cy,r:sc,class:'lnf'},svg);line(svg,cx-150,cy,cx+150,cy,'lnf');line(svg,cx,cy-150,cx,cy+150,'lnf');
    const a=[Math.cos(A),Math.sin(A)],b=[L*Math.cos(B),L*Math.sin(B)];const d=a[0]*b[0]+a[1]*b[1];
    S('line',{x1:cx+b[0]*sc,y1:cy-b[1]*sc,x2:cx+a[0]*d*sc,y2:cy-a[1]*d*sc,stroke:'var(--ink2)','stroke-dasharray':'3 3'},svg);
    S('line',{x1:cx,y1:cy,x2:cx+a[0]*d*sc,y2:cy-a[1]*d*sc,stroke:d>=0?'var(--a)':'var(--neg)','stroke-width':7,'stroke-linecap':'round',style:'opacity:.55'},svg);
    arrow(a[0],a[1],'var(--tok)',3,'a');arrow(b[0],b[1],'var(--kv)',3,'b');
    let th=Math.abs((+$('dp-b').value)-(+$('dp-a').value))%360;if(th>180)th=360-th;
    const w=d>0.15?'pekar delvis åt samma håll':(d<-0.15?'pekar åt motsatta håll':'är nästan vinkelräta: b säger inget om a');
    $('dp-out').innerHTML='a · b = <b>'+nf(d,2)+'</b>  (|a| = 1, |b| = '+nf(L,1)+', vinkel '+Math.round(th)+'°). Vektorerna '+w+'. Det tjocka strecket är b:s skugga på a.';}
  ['dp-a','dp-b','dp-l'].forEach(id=>$(id).addEventListener('input',draw));draw();
})();
(function matvec(){
  const svg=$('mv-svg');const DI=5,DO=6,c=42,R0=rng(4242);const W=Array.from({length:DI},()=>Array.from({length:DO},()=>R0()*2-1));
  let seed=3,sel=2,x;function mk(){const R=rng(seed*97+5);x=Array.from({length:DI},()=>R());}
  function cell(xx,yy,v,pos,neg){return S('rect',{x:xx,y:yy,width:c-4,height:c-4,rx:4,fill:v>=0?pos:neg,style:'opacity:'+(0.12+Math.min(1,Math.abs(v))*0.88).toFixed(2)},svg);}
  function draw(){clear(svg);const wx=150,wy=44,xx=60;
    txt(svg,xx+19,30,'x [5]','m ta','middle');txt(svg,wx+DO*c/2,30,'W [5, 6]','m tw','middle');txt(svg,wx-14,wy+DI*c+38,'y [6]','m ta','end');
    const y=Array.from({length:DO},(_,j)=>x.reduce((s,v,i)=>s+v*W[i][j],0));const my=Math.max(...y.map(Math.abs),1e-6);
    for(let i=0;i<DI;i++){cell(xx,wy+i*c,x[i],'var(--a)','var(--neg)');txt(svg,xx+19,wy+i*c+24,nf(x[i],1),'m','middle').setAttribute('style','font-size:11px');
      for(let j=0;j<DO;j++){cell(wx+j*c,wy+i*c,W[i][j],'var(--w)','var(--neg)');txt(svg,wx+j*c+19,wy+i*c+24,nf(W[i][j],1),'m','middle').setAttribute('style','font-size:11px');}}
    txt(svg,wx-22,wy+DI*c/2+4,'@','b','middle');
    for(let j=0;j<DO;j++){const r=cell(wx+j*c,wy+DI*c+14,y[j]/my,'var(--a)','var(--neg)');txt(svg,wx+j*c+19,wy+DI*c+38,nf(y[j],1),'m','middle').setAttribute('style','font-size:11px');
      const hit=S('rect',{x:wx+j*c-2,y:wy+DI*c+12,width:c,height:c,fill:'transparent',style:'cursor:pointer'},svg);hit.addEventListener('click',()=>{sel=j;draw();});}
    S('rect',{x:wx+sel*c-3,y:wy-3,width:c+2,height:DI*c+2,rx:5,class:'hl'},svg);S('rect',{x:xx-3,y:wy-3,width:c+2,height:DI*c+2,rx:5,class:'hl'},svg);S('rect',{x:wx+sel*c-3,y:wy+DI*c+11,width:c+2,height:c+2,rx:5,class:'hl'},svg);
    $('mv-out').innerHTML='y['+sel+'] = x · W[:, '+sel+'] = '+x.map((v,i)=>nf(v,1)+'·'+(W[i][sel]<0?'(−'+nf(-W[i][sel],1)+')':nf(W[i][sel],1))).join(' + ')+' ≈ <b>'+nf(y[sel],2)+'</b>';}
  $('mv-rand').addEventListener('click',()=>{seed++;mk();draw();});mk();draw();
})();
(function nonlin(){
  const svg=$('nl-svg');let relu=true;const f=x=>Math.sin(1.3*x)+0.3*x;const X=x=>40+(x+3)/6*440,Y=y=>140-y*70;
  function draw(){clear(svg);const n=+$('nl-n').value;$('nl-nv').textContent=String(n);line(svg,40,Y(0),480,Y(0),'lnf');line(svg,X(0),20,X(0),260,'lnf');
    let d='';for(let i=0;i<=120;i++){const x=-3+i*0.05;d+=(i?'L':'M')+X(x).toFixed(1)+' '+Y(f(x)).toFixed(1);}
    S('path',{d,fill:'none',stroke:'var(--ink2)','stroke-width':1.5,'stroke-dasharray':'5 4'},svg);
    let g;if(relu){const kn=Array.from({length:n+1},(_,k)=>-3+k*6/n);g=x=>{let k=Math.min(n-1,Math.floor((x+3)/(6/n)));if(k<0)k=0;const x0=kn[k],x1=kn[k+1];return f(x0)+(f(x1)-f(x0))*(x-x0)/(x1-x0);};
      kn.forEach(k=>S('circle',{cx:X(k),cy:Y(f(k)),r:4,fill:'var(--a)'},svg));}
    else{let sx=0,sy=0,sxx=0,sxy=0,m=0;for(let x=-3;x<=3.001;x+=0.05){sx+=x;sy+=f(x);sxx+=x*x;sxy+=x*f(x);m++;}const b=(m*sxy-sx*sy)/(m*sxx-sx*sx),a=(sy-b*sx)/m;g=x=>a+b*x;}
    let d2='',err=0,m=0;for(let i=0;i<=120;i++){const x=-3+i*0.05;d2+=(i?'L':'M')+X(x).toFixed(1)+' '+Y(g(x)).toFixed(1);err+=Math.abs(g(x)-f(x));m++;}
    S('path',{d:d2,fill:'none',stroke:'var(--a)','stroke-width':2.5},svg);txt(svg,44,32,'streckad: kurvan som ska läras','s');txt(svg,44,50,'orange: vad nätet kan uttrycka','s ta');
    $('nl-out').innerHTML=relu?'Med '+n+' ReLU-neuroner får kurvan '+n+' raka bitar. Medelfel: <b>'+nf(err/m,2)+'</b>. Fler neuroner ger fler knäckar och bättre passform.':'Utan aktiveringsfunktion blir summan av alla neuroner en enda rät linje, oavsett om det är '+n+' eller en miljon. Medelfel: <b>'+nf(err/m,2)+'</b>.';}
  $('nl-n').addEventListener('input',draw);
  $('nl-relu').addEventListener('click',()=>{relu=true;$('nl-relu').classList.add('on');$('nl-lin').classList.remove('on');draw();});
  $('nl-lin').addEventListener('click',()=>{relu=false;$('nl-lin').classList.add('on');$('nl-relu').classList.remove('on');draw();});draw();
})();
(function softmaxDemo(){
  const svg=$('sm-svg'),ctl=$('sm-ctl');const z=[2,1,0.5,-1],nm=['A','B','C','D'];const ins=z.map((v,i)=>{const l=H('label',null,nm[i]+' ',ctl);const r=H('input',null,null,l);r.type='range';r.min=-4;r.max=4;r.step=0.5;r.value=v;r.style.width='90px';r.addEventListener('input',draw);return r;});
  function draw(){clear(svg);const c=+$('sm-c').value,s=+$('sm-s').value;$('sm-cv').textContent=String(c);$('sm-sv').textContent=s.toFixed(1);
    const zz=ins.map(r=>s*(+r.value)+c);const mx=Math.max(...zz);const e=zz.map(v=>Math.exp(v-mx));const su=e.reduce((a,b)=>a+b,0);const p=e.map(v=>v/su);
    zz.forEach((v,i)=>{const y=14+i*50;txt(svg,100,y+22,nm[i]+':  '+nf(v,1),'m','end');S('rect',{x:110,y:y+4,width:330,height:26,rx:3,class:'bg'},svg);S('rect',{x:110,y:y+4,width:Math.max(1,p[i]*330),height:26,rx:3,fill:'var(--tok)',style:'opacity:.85'},svg);txt(svg,448,y+22,nf(p[i]*100,1)+' %','m');});
    let m='Summan är alltid 100 %. ';if(c!==0)m+='Du har lagt till '+c+' på alla logits: sannolikheterna påverkas inte. ';if(s>1.05)m+='Skalning över 1 förstorar skillnaderna: fördelningen blir skarpare (som låg temperature). ';if(s<0.95)m+='Skalning under 1 krymper skillnaderna: fördelningen blir plattare (som hög temperature). ';$('sm-out').textContent=m;}
  $('sm-c').addEventListener('input',draw);$('sm-s').addEventListener('input',draw);draw();
})();
(function wact(){
  const svg=$('wa-svg');let mode='dense',tok=0;const routes=[[[0,2],[1,3],[0,1]],[[0,3],[2,3],[1,2]],[[1,2],[0,2],[3,0]]];const names=['katt','skatt','7×8'];
  function draw(){clear(svg);txt(svg,224,22,mode==='moe'?'Vikter (fasta), uppdelade i experter':'Vikter (fasta)','b','middle');txt(svg,468,22,'Aktiveringar','b','middle');
    for(let L=0;L<3;L++){const y=40+L*94;txt(svg,10,y+38,'Lager '+(L+1),'s');const wr=rng(1000+L*97);
      for(let e=0;e<4;e++){const bx=82+e*72;const on=mode==='dense'||routes[tok][L].indexOf(e)>=0;
        S('rect',{x:bx,y,width:66,height:70,rx:4,fill:'none',stroke:on?'var(--w)':'var(--line)','stroke-width':on?1.4:0.8},svg);
        for(let r=0;r<6;r++)for(let c=0;c<6;c++){const v=wr();S('rect',{x:bx+5+c*9.6,y:y+5+r*10.4,width:8,height:8.6,rx:1.5,fill:on?'var(--w)':'var(--ink2)',style:'opacity:'+(on?(0.2+v*0.7):(0.05+v*0.08)).toFixed(2)},svg);}
        if(mode==='moe')txt(svg,bx+33,y+84,'expert '+(e+1),'s','middle').setAttribute('style','font-size:10.5px');}
      line(svg,374,y+35,394,y+35,'ln',true);const ar=rng(5000+tok*331+L*17+(mode==='moe'?7:0));
      for(let i=0;i<8;i++){const v=Math.pow(ar(),1.6);S('rect',{x:400+i*18,y:y+20,width:15,height:30,rx:3,fill:'var(--a)',style:'opacity:'+(0.08+v*0.92).toFixed(2)},svg);}}
    $('wa-out').innerHTML=mode==='dense'?'Tät: alla vikter används för ”'+names[tok]+'”. Byt token: de gröna vikterna står helt still, bara de orange aktiveringarna ändras.':'MoE: routern väljer 2 av 4 experter per lager för ”'+names[tok]+'”. Byt token och se att andra viktblock används. Vikterna själva är fortfarande desamma.';}
  $('wa-dense').addEventListener('click',()=>{mode='dense';$('wa-dense').classList.add('on');$('wa-moe').classList.remove('on');draw();});
  $('wa-moe').addEventListener('click',()=>{mode='moe';$('wa-moe').classList.add('on');$('wa-dense').classList.remove('on');draw();});
  document.querySelectorAll('[data-wat]').forEach(b=>b.addEventListener('click',()=>{tok=+b.dataset.wat;document.querySelectorAll('[data-wat]').forEach(x=>x.classList.toggle('on',x===b));draw();}));draw();
})();
(function byhand(){
  const T=['Katten','satt','den'],k=[[2,0],[0,1],[1,1]],v=[[1,0],[0,1],[0.5,0.5]],q=[1.5,0.5];
  const s=k.map(r=>r[0]*q[0]+r[1]*q[1]),sd=s.map(x=>x/Math.SQRT2),ex=sd.map(Math.exp),su=ex.reduce((a,b)=>a+b,0),p=ex.map(x=>x/su),pv=v.map((r,i)=>[r[0]*p[i],r[1]*p[i]]),out=[pv.reduce((a,r)=>a+r[0],0),pv.reduce((a,r)=>a+r[1],0)];
  const f2=x=>x.toLocaleString('sv-SE',{maximumFractionDigits:2});const vec=a=>'['+a.map(f2).join('; ')+']';let st=0;
  const steps=[
   ['Utgångsläge','Varje token har en key och en value, framräknade ur dess vektor med Wk och Wv. Den token som ska uppdateras, ”den”, har också en query: q = '+vec(q)+'. Query beskriver vad ”den” letar efter.'],
   ['Skalärprodukt: q · k','Query jämförs med varje key. För ”Katten”: 1,5·2 + 0,5·0 = 3,0. Högst poäng får den key som pekar mest åt samma håll som q.'],
   ['Dela med √d_h','Poängen delas med √2 ≈ 1,41 (i Llama √128 ≈ 11,3). Utan det skulle skalärprodukter i många dimensioner bli så stora att softmax lägger all vikt på en enda token.'],
   ['Softmax','exp av varje poäng, delat med summan. Nu är poängen vikter som summerar till 1: ”den” ska hämta '+nf(p[0]*100,0)+' % från ”Katten”.'],
   ['Vikta values','Varje value multipliceras med sin vikt.'],
   ['Summera','Resultatet är summan: '+vec(out)+'. Det ligger närmast ”Katten”s value [1, 0]. Den här vektorn går genom Wo och adderas till ”den”s rad i residual stream. Informationen om katten har flyttat till en ny position.']];
  function draw(){const el=$('ah-tbl');let h='<table class="numtbl"><tr><th>token</th><th>key k</th><th>q · k</th><th>÷ √2</th><th>softmax P</th><th>value v</th><th>P · v</th></tr>';
    const cls=(c)=>st===c?' class="hi"':(st<c?' class="dim"':'');const val=(c,t)=>st>=c?t:'·';
    T.forEach((t,i)=>{h+='<tr><th>'+t+'</th><td'+(st===0?' class="hi"':'')+'>'+vec(k[i])+'</td><td'+cls(1)+'>'+val(1,nf(s[i],2))+'</td><td'+cls(2)+'>'+val(2,nf(sd[i],2))+'</td><td'+cls(3)+'>'+val(3,nf(p[i],2))+'</td><td'+(st===0||st===4?' class="hi"':'')+'>'+vec(v[i])+'</td><td'+cls(4)+'>'+val(4,vec(pv[i]))+'</td></tr>';});
    h+='<tr><th>summa</th><td></td><td></td><td></td><td'+cls(3)+'>'+val(3,'1,00')+'</td><td></td><td'+cls(5)+'>'+val(5,vec(out))+'</td></tr></table>';el.innerHTML=h;
    const tx=$('ah-text');clear(tx);H('h3',null,(st+1)+'. '+steps[st][0],tx).style.marginTop='0';H('p',null,steps[st][1],tx);$('ah-n').textContent=(st+1)+' / '+steps.length;}
  $('ah-next').addEventListener('click',()=>{if(st<steps.length-1){st++;draw();}});$('ah-prev').addEventListener('click',()=>{if(st>0){st--;draw();}});draw();
})();
(function mini(){
  const V=['katten','satt','på','mattan','och','sov','en','hund','.','den','var','trött'],d=16,NH=2,dh=8,NL=2,dff=32;const R=rng(20261);
  const M=(r,c,s)=>Array.from({length:r},()=>Array.from({length:c},()=>(R()*2-1)*s));
  const E=M(V.length,d,1),U=M(d,V.length,0.9);const Ls=Array.from({length:NL},()=>({q:M(d,d,.6),k:M(d,d,.6),v:M(d,d,.6),o:M(d,d,.5),a:M(d,dff,.5),b:M(dff,d,.5)}));
  const mv=(x,W)=>{const o=new Array(W[0].length).fill(0);for(let i=0;i<x.length;i++){const xi=x[i],w=W[i];for(let j=0;j<o.length;j++)o[j]+=xi*w[j];}return o;};
  const norm=x=>{const r=Math.sqrt(x.reduce((s,a)=>s+a*a,0)/x.length+1e-6);return x.map(a=>a/r);};
  const posv=p=>Array.from({length:d},(_,i)=>(i%2?Math.cos:Math.sin)(p/Math.pow(50,(i-i%2)/d))*0.5);
  function run(ids,start,cache){let rows=0;let xs=ids.map((id,t)=>E[id].map((a,i)=>a+posv(start+t)[i]));
    for(let l=0;l<NL;l++){const W=Ls[l],C=cache[l];const hs=xs.map(norm);const qs=hs.map(h=>mv(h,W.q));
      hs.forEach(h=>{C.K.push(mv(h,W.k));C.V.push(mv(h,W.v));});rows+=xs.length;
      xs=xs.map((x,t)=>{const p=start+t;const o=new Array(d).fill(0);
        for(let h=0;h<NH;h++){const sc=[];for(let j=0;j<=p;j++){let s=0;for(let i=0;i<dh;i++)s+=qs[t][h*dh+i]*C.K[j][h*dh+i];sc.push(s/Math.sqrt(dh));}
          const mx=Math.max(...sc);const e=sc.map(s=>Math.exp(s-mx));const su=e.reduce((a,b)=>a+b,0);
          for(let j=0;j<=p;j++){const w=e[j]/su;for(let i=0;i<dh;i++)o[h*dh+i]+=w*C.V[j][h*dh+i];}}
        const ao=mv(o,W.o);const x1=x.map((a,i)=>a+ao[i]);const m=mv(norm(x1),W.a).map(z=>Math.max(0,z));const mo=mv(m,W.b);return x1.map((a,i)=>a+mo[i]);});}
    return{logits:mv(norm(xs[xs.length-1]),U),rows};}
  const newCache=()=>Array.from({length:NL},()=>({K:[],V:[]}));
  let seq,cache,pending,log,SR;
  function compare(newIds,start,label){const c=run(newIds,start,cache);const f=run(seq,0,newCache());let dm=0;c.logits.forEach((v,i)=>{dm=Math.max(dm,Math.abs(v-f.logits[i]));});
    log.push([label,V[seq[seq.length-1]],f.rows,c.rows,dm]);pending=c.logits;}
  function reset(){seq=[0,1,2];cache=newCache();log=[];SR=rng(99);compare(seq,0,'prefill');draw();}
  function step(){if(seq.length>=10)return;const mx=Math.max(...pending);const e=pending.map(v=>Math.exp((v-mx)*1.5));const su=e.reduce((a,b)=>a+b,0);let r=SR()*su,id=0;for(;id<e.length;id++){r-=e[id];if(r<=0)break;}id=Math.min(id,e.length-1);
    seq.push(id);compare([id],seq.length-1,'decode '+(seq.length-3));draw();}
  function draw(){const sq=$('mm-seq');clear(sq);seq.forEach((id,i)=>H('span','chip '+(i<3?'t':(i===seq.length-1?'new':'ok')),V[id],sq));
    let h='<tr><th>steg</th><th>bearbetad token</th><th>rader utan cache</th><th>rader med cache</th><th>max |Δ logit|</th></tr>';let a=0,b=0;
    log.forEach(r=>{a+=r[2];b+=r[3];h+='<tr><th>'+r[0]+'</th><td>'+r[1]+'</td><td>'+r[2]+'</td><td class="hi">'+r[3]+'</td><td>'+(r[4]===0?'0':r[4].toExponential(1))+'</td></tr>';});
    h+='<tr><th>totalt</th><td></td><td>'+a+'</td><td class="hi">'+b+'</td><td></td></tr>';$('mm-tbl').innerHTML=h;
    const ht=$('mm-heat');clear(ht);cache[0].K.forEach((k,p)=>heatRow(ht,p+' '+V[seq[p]],k.slice(0,8).map(x=>x/2.5),'var(--kv)',p===seq.length-1&&p>2));
    $('mm-out').innerHTML=seq.length>=10?'Max längd nådd. Utan cache räknades <b>'+a+'</b> rader genom lagren, med cache <b>'+b+'</b>. Samma logits.':'”Rader” är positioner som körs genom ett lager. Utan cache växer arbetet med sekvensens längd i varje steg, med cache är det 2 rader (en per lager).';
    $('mm-step').disabled=seq.length>=10;}
  $('mm-step').addEventListener('click',step);$('mm-reset').addEventListener('click',reset);reset();
})();
(function capacity(){
  const MD={8:{P:8.03e9,L:32,kv:8},70:{P:70.6e9,L:80,kv:8}};
  function draw(){const m=MD[+$('cp-model').value],prec=+$('cp-prec').value,g=+$('cp-gpus').value,u=Math.pow(2,+$('cp-u').value),c=Math.pow(2,+$('cp-c').value);
    $('cp-uv').textContent=String(u);$('cp-cv').textContent=c.toLocaleString('sv-SE');
    const W=m.P*prec,perGpu=72e9-5e9,pool=g*perGpu-W,kvTok=2*m.L*m.kv*128*2,kvSeq=kvTok*c,maxS=Math.max(0,Math.floor(pool/kvSeq)),fits=pool>0;
    const act=Math.min(u,maxS);const bytes=W+act*kvSeq,t=Math.max(bytes/(3.35e12*g),act*2*m.P/(989e12*g));
    const row=(a,b,ok)=>'<tr><td>'+a+'</td><td class="n"'+(ok===false?' style="color:var(--neg)"':'')+'>'+b+'</td></tr>';
    let h=row('1. Vikter',nf(W/1e9,1)+' GB på '+g+' × 80 GB'+(fits?'':'   får inte plats'),fits);
    if(fits){h+=row('2. KV-pool',nf(pool/1e9,0)+' GB')+row('   KV per konversation',nf(kvSeq/1e9,2)+' GB')+row('3. Ryms samtidigt',maxS.toLocaleString('sv-SE')+' konversationer',maxS>=u)
      +row('4. Ett decode-steg (ITL)',act?nf(t*1000,1)+' ms':'–')+row('   Per användare',act?Math.round(1/t)+' tokens/s':'–')+row('   Totalt',act?Math.round(act/t).toLocaleString('sv-SE')+' tokens/s':'–');}
    $('cp-tbl').innerHTML=h;let msg;
    if(!fits)msg='<b>Vikterna får inte plats.</b> Kvantisera eller lägg till GPU:er.';
    else if(maxS<u)msg='<b>KV-minnet tar slut först.</b> Bara '+maxS+' av '+u+' användare ryms. Resten hamnar i kö eller preemptas. Kortare kontext, fp8 för KV, fler GPU:er eller fler repliker.';
    else{const kvShare=act*kvSeq/bytes;msg='Alla '+u+' ryms. '+(kvShare>0.5?'Det mesta av varje steg går åt till att läsa KV-cache ('+nf(kvShare*100,0)+' %), så ITL växer med antalet användare och kontextlängden.':'Varje steg domineras av att läsa vikterna ('+nf((1-kvShare)*100,0)+' %), så fler användare är nästan gratis.');}
    $('cp-out').innerHTML=msg;}
  ['cp-model','cp-prec','cp-gpus','cp-u','cp-c'].forEach(id=>$(id).addEventListener('input',draw));draw();
})();
