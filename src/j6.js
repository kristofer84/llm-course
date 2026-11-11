/* ================= v5: plain-language walkthroughs ================= */
(function conveyor(){
  const st=[
   ['Normalisera en kopia','RMSNorm g₁','Strömmen x för alla ord, [T, 4096]. Storleken har vuxit genom tidigare block.','En kopia av varje rad skalas om så att storleken blir 1. Riktningen behålls.','h, samma shape som x. Strömmen x själv är orörd.','Attention fungerar bäst med indata i jämn skala. Att bara normalisera kopian håller vägen rakt genom strömmen ren.'],
   ['Attention: samla information','Wq, Wk, Wv, Wo','h för det här ordet och alla ord före det.','Query jämförs med tidigare keys, poängen blir procent, values blandas efter procenten. Wo gör om blandningen till strömmens format.','Ett bidrag per ord med information från andra ord.','Det enda stället där ord kan påverka varandra.'],
   ['Addera','ingen vikt','x och attention-bidraget.','x = x + bidrag, tal för tal.','x, som nu bär sammanhang. Shape oförändrad.','Inget skrivs över. Det som stod i strömmen innan finns kvar.'],
   ['Normalisera en kopia igen','RMSNorm g₂','Det uppdaterade x.','Samma sak som station 1, med egna vikter.','En ny kopia h med storlek 1.','MLP:n vill också ha jämn skala.'],
   ['MLP: bearbeta','W_gate, W_up, W_down','h för ett ord i taget. Inga andra ord syns.','Expandera till 14 336 neuroner, släpp fram de vars mönster passar, tryck ihop till 4096.','Ett bidrag per ord: vad modellen vet om det som hämtats.','Här används lagrad kunskap för att dra slutsatser.'],
   ['Addera','ingen vikt','x och MLP-bidraget.','x = x + bidrag.','x, redo för nästa block.','Blocket är klart. Nästa block upprepar samma sex stationer med nya vikter.']];
  const svg=$('lb-svg');let i=0;
  function draw(){clear(svg);S('line',{x1:60,y1:14,x2:60,y2:458,stroke:'var(--a)','stroke-width':6,style:'opacity:.45'},svg);txt(svg,60,10,L.t('x in'),'s','middle');
    txt(svg,30,240,L.t('strömmen x'),'s','middle').setAttribute('transform','rotate(-90 30 240)');
    st.forEach((s,k)=>{const y=24+k*72;const add=s[1]==='ingen vikt';const on=k===i;const g=S('g',{style:'cursor:pointer'},svg);g.addEventListener('click',()=>{i=k;draw();});
      const head=L.t('{{n}}. {{title}}',{n:k+1,title:L.t(s[0])});
      if(add){S('circle',{cx:60,cy:y+26,r:14,class:'box',style:on?'stroke:var(--tok);stroke-width:3':''},g);txt(g,60,y+31,'+','b','middle');txt(g,90,y+31,head,on?'b':'s');}
      else{line(g,66,y+26,104,y+26,'ln',true);S('rect',{x:106,y:y+4,width:400,height:44,rx:8,class:k===1||k===4?'bw':'bg',style:on?'stroke:var(--tok);stroke-width:3':''},g);
        txt(g,122,y+23,head,on?'b':'');txt(g,122,y+40,L.t(s[1]),'m tw').setAttribute('style','font-size:11px');
        if(k===1||k===4)S('path',{d:'M306 '+(y+48)+' V'+(y+98)+' H76',class:'ln','marker-end':'url(#ah)'},g);}
      if(on)S('circle',{cx:60,cy:y+26,r:6,fill:'var(--tok)'},svg);});
    const d=$('lb-detail');clear(d);const s=st[i];H('h3',null,L.t('{{n}}. {{title}}',{n:i+1,title:L.t(s[0])}),d).style.marginTop='0';
    const box=H('div','ige',null,d);[['in','Inmatning',s[2]],['do','Genomförande',s[3]],['out','Resultat',s[4]],['why','Varför',s[5]]].forEach(([c,l,t])=>{const e=H('div',c,null,box);H('span','lb',L.t(l),e);e.appendChild(document.createTextNode(L.t(t)));});
    $('lb-n').textContent=(i+1)+' / 6';}
  $('lb-next').addEventListener('click',()=>{if(i<5){i++;draw();}});$('lb-prev').addEventListener('click',()=>{if(i>0){i--;draw();}});draw();
})();
(function videoAnalogy(){
  const T=[['Katten','djur, substantiv, subjekt','information om katten'],['satt','verb, dåtid','information om att sitta'],['på','preposition','information om en plats'],['mattan','föremål, substantiv','information om mattan'],['eftersom','bisatsinledare','information om orsak']];
  const Q=[['ett substantiv som ”den” kan syfta på',[0.62,0.04,0.03,0.27,0.04]],['vad som hände',[0.15,0.58,0.12,0.08,0.07]],['var det hände',[0.08,0.12,0.38,0.37,0.05]]];
  let q=0;const bx=$('yt-q');Q.forEach((x,k)=>{const b=H('button','btn'+(k===0?' on':''),L.t(x[0]),bx);b.addEventListener('click',()=>{q=k;[...bx.children].forEach((c,j)=>c.classList.toggle('on',j===k));draw();});});
  function draw(){const v=$('yt-view');clear(v);const hd=H('div',null,null,v);hd.style.cssText='display:grid;grid-template-columns:90px 1fr 110px;gap:8px;font-size:12px;color:var(--ink2);margin-bottom:4px';['ord','key = ”titel”','vikt'].forEach(t=>H('span',null,L.t(t),hd));
    T.forEach((t,k)=>{const w=Q[q][1][k];const r=H('div',null,null,v);r.style.cssText='display:grid;grid-template-columns:90px 1fr 110px;gap:8px;align-items:center;margin:6px 0;font-size:14px';
      H('b',null,t[0],r);const ti=H('span','chip',L.t(t[1]),r);ti.style.cssText='white-space:normal;border-color:'+(w>0.25?'var(--tok)':'var(--line)');
      const bar=H('div',null,null,r);bar.style.cssText='height:18px;background:var(--soft);border-radius:3px;position:relative';const f=H('div',null,null,bar);f.style.cssText='height:100%;border-radius:3px;background:var(--tok);width:'+(w*100)+'%';const s=H('span',null,L.t('{{n}} %',{n:Math.round(w*100)}),bar);s.style.cssText='position:absolute;right:4px;top:0;font-family:var(--mono);font-size:11px';});
    const top=Q[q][1].map((w,k)=>[w,k]).sort((a,b)=>b[0]-a[0]);
    $('yt-out').innerHTML=L.t('Query = sökningen: <b>{{q}}</b>. Keys = videornas titlar. Values = innehållet. ”den” får inte en enda video, utan {{p1}} % {{d1}}, {{p2}} % {{d2}} och lite av resten. I modellen är query, key och value vektorer, och ”titlarna” är inte ord utan tal.',{q:L.t(Q[q][0]),p1:Math.round(top[0][0]*100),d1:L.t(T[top[0][1]][2]),p2:Math.round(top[1][0]*100),d2:L.t(T[top[1][1]][2])});}
  draw();
})();
(function formula(){
  const P=[
   ['Q','Q, K och V','Tre versioner av varje ords vektor, framräknade med de inlärda matriserna Wq, Wk och Wv. Själva Q, K och V är alltså inte vikter, utan räknas fram på nytt för varje token.','Q [32, T, 128], K och V [8, T, 128]','I exemplet: q för ”den” = [1,5; 0,5]. Keys: Katten [2; 0], satt [0; 1], den [1; 1].'],
   ['QKᵀ','Q · Kᵀ: jämför','Varje query multipliceras med varje key. Pekar de åt samma håll blir talet stort. Resultatet är en poängtabell: hur väl varje ord matchar varje annat.','[32, T, T]','3,00 för Katten, 0,50 för satt, 2,00 för den.'],
   ['/√dₖ','÷ √d: skala ner','Skalärprodukter av långa vektorer blir stora tal. Utan nedskalning skulle softmax lägga nästan all vikt på ett enda ord, och modellen skulle lära sig dåligt. d är 128 i Llama.','samma shape','÷ √2: 2,12, 0,35 och 1,41.'],
   ['+ mask','+ mask: inte framåt','Poäng mot ord som kommer senare sätts till minus oändligheten. Efter softmax blir deras vikt exakt noll. Formeln brukar skrivas utan masken, men decoder-only-modeller har alltid med den.','samma shape','I exemplet finns inga senare ord, så inget maskas.'],
   ['softmax','softmax: gör procent','Varje rad görs om till positiva tal som summerar till 1. Stora skillnader i poäng blir stora skillnader i vikt.','[32, T, T]','60 % Katten, 10 % satt, 30 % den.'],
   ['· V','· V: blanda innehållet','Varje ord får en blandning av alla values, viktad med procenten. Därefter blandar Wo ihop de 32 headsen, och resultatet adderas till strömmen.','[32, T, 128] → [T, 4096]','0,60 · [1; 0] + 0,10 · [0; 1] + 0,30 · [0,5; 0,5] = [0,75; 0,25]. Närmast Katten.']];
  const row=$('fx-row');let cur=1;
  const parts=[['softmax(',4],['Q',0],['Kᵀ',1],['/ √d',2],['+ mask',3],[')',4],['· V',5]];
  const bs=parts.map(([t,k])=>{const b=H('button',null,t,row);b.addEventListener('click',()=>{cur=k;draw();});return[b,k];});
  function draw(){bs.forEach(([b,k])=>b.classList.toggle('on',k===cur));const p=P[cur];const t=$('fx-text');clear(t);H('h3',null,L.t(p[1]),t).style.marginTop='0';H('p',null,L.t(p[2]),t);
    const pn=$('fx-panel');clear(pn);const tb=H('table','t',null,pn);[['Shape i Llama-3-8B',p[3]],['I räkneexemplet',p[4]]].forEach(([a,b])=>{const tr=H('tr',null,null,tb);H('td',null,L.t(a),tr);H('td','n',L.t(b),tr).style.whiteSpace='normal';});
    const g=H('button','btn',L.t('Se hela uträkningen'),pn);g.style.marginTop='12px';g.dataset.goto='Attention räknat för hand';}
  draw();
})();
(function mlpPlain(){
  const svg=$('mk-svg');let i=0;const R=rng(314);const inV=Array.from({length:16},()=>R()*2-1);const ex=Array.from({length:48},()=>R()*2.4-1.2);const silu=z=>z/(1+Math.exp(-z));const gated=ex.map(silu);const outV=Array.from({length:16},()=>(R()*2-1)*0.6);
  const ST=[['Inmatning','4096 tal för ett ord (16 visas).'],['Expansion','Jämförs med 14 336 mönster (48 visas). Varje stapel är hur väl ett mönster passar.'],['Aktivering','SiLU dämpar allt som inte passar. Bara en del neuroner lyser tydligt kvar.'],['Projektion','De neuroner som tändes översätts tillbaka till 4096 tal: MLP:ns bidrag.']];
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
    const f=[];if(n1>0.5)f.push(L.t('neuronen ”huvudstad + Frankrike” slår till ({{v}}) och skriver en riktning som gör <b>Paris</b> troligare',{v:L.num(n1,2)}));if(n2>0.5)f.push(L.t('neuronen ”huvudstad + Tyskland” slår till ({{v}}) och skriver mot <b>Berlin</b>',{v:L.num(n2,2)}));
    $('mk-mem').innerHTML=(f.length?f.join('; ')+'.':L.t('Ingen nyckel matchar fullt ut, så inget värde skrivs. Neuronerna kräver båda egenskaperna samtidigt, vilket bara går tack vare den icke-linjära dimmern.'))+' '+L.t('(Förenklat: verkliga fakta är utspridda över många neuroner.)');}
  mem();
})();
