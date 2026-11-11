/* ================= v3: layer anatomy ================= */
(function layerAnat(){
  const svg=$('ly-svg'),info=$('ly-info');let nm='ours',sel='Wq';
  const N={
   g1:['w',120,30,480,36,'RMSNorm g₁','input_layernorm','input_layernorm','[4096]',4096,'Normaliserar en kopia av strömmen så att RMS blir 1, och skalar sedan varje dimension med en inlärd vikt. Strömmen själv ändras inte.'],
   Wq:['w',120,90,220,36,'Wq','self_attn.q_proj','qkv_proj (del av)','[4096, 4096]',16777216,'Gör en query per token: vad den här positionen letar efter. 32 heads × 128.'],
   Wk:['w',350,90,120,36,'Wk','self_attn.k_proj','qkv_proj (del av)','[4096, 1024]',4194304,'Gör en key per token: vad positionen erbjuder. 8 KV heads × 128. Skrivs till KV-cachen.'],
   Wv:['w',480,90,120,36,'Wv','self_attn.v_proj','qkv_proj (del av)','[4096, 1024]',4194304,'Gör en value per token: det som skickas vidare om positionen väljs. Skrivs till KV-cachen.'],
   rope:['op',120,148,480,30,'RoPE: rotera Q och K efter position',null,null,null,0,'Ingen vikt. En fast formel som vrider Q och K beroende på position, så att attention kan känna av avstånd.'],
   att:['op',120,194,480,30,'Q · Kᵀ / √128 + causal mask → softmax',null,null,null,0,'Ingen vikt. Jämför varje query med alla tidigare keys och gör poängen till vikter som summerar till 1.'],
   pv:['op',120,240,480,30,'P · V: viktad summa av values',null,null,null,0,'Ingen vikt. Här, och bara här, flyttas information mellan tokens.'],
   Wo:['w',120,286,480,36,'Wo','self_attn.o_proj','o_proj','[4096, 4096]',16777216,'Blandar ihop de 32 headsens resultat till ett bidrag med strömmens bredd, 4096.'],
   add1:['add',60,342,0,0,'x = x + attention-bidrag',null,null,null,0,'Ingen vikt. Attention-bidraget adderas till strömmen. Inget skrivs över.'],
   g2:['w',120,366,480,36,'RMSNorm g₂','post_attention_layernorm','post_attention_layernorm','[4096]',4096,'Samma sak som g₁, men före MLP:n och med egna vikter.'],
   Wg:['w',120,426,235,36,'W_gate','mlp.gate_proj','gate_up_proj (del av)','[4096, 14336]',58720256,'14 336 detektorer. Varje kolumn är ett mönster som jämförs med tokenens vektor.'],
   Wu:['w',365,426,235,36,'W_up','mlp.up_proj','gate_up_proj (del av)','[4096, 14336]',58720256,'Ett värde per detektor, som skalas av gaten.'],
   silu:['op',120,484,480,30,'SiLU(gate) ⊙ up',null,null,null,0,'Ingen vikt. Gaten släpper fram de detektorer som slog till och multipliceras elementvis med up.'],
   Wd:['w',120,530,480,36,'W_down','mlp.down_proj','down_proj','[14336, 4096]',58720256,'Komprimerar tillbaka till 4096 och skriver MLP:ns bidrag. Varje rad är vad en detektor skriver till strömmen.'],
   add2:['add',60,586,0,0,'x = x + MLP-bidrag',null,null,null,0,'Ingen vikt. MLP-bidraget adderas. Strömmen går vidare till nästa lager.']};
  const total=Object.values(N).reduce((s,n)=>s+n[9],0);
  $('ly-total').textContent='Summa vikter i ett lager: '+total.toLocaleString('sv-SE')+' parametrar. Gånger 32 lager blir det ungefär 6,98 miljarder; resten av de 8,03 miljarderna är embedding och LM head.';
  function label(k){const n=N[k];if(n[0]!=='w'||nm==='ours')return n[5];const s=nm==='ckpt'?n[6].split('.').pop():n[7];return s.replace(' (del av)','');}
  function draw(){clear(svg);
    S('line',{x1:60,y1:8,x2:60,y2:604,stroke:'var(--a)','stroke-width':6,style:'opacity:.45'},svg);
    txt(svg,18,320,'residual stream x [T, 4096]','s','middle').setAttribute('transform','rotate(-90 18 320)');
    S('rect',{x:108,y:80,width:504,height:248,rx:10,fill:'none',stroke:'var(--line)','stroke-dasharray':'4 4'},svg);txt(svg,100,204,'attention','s','middle').setAttribute('transform','rotate(-90 100 204)');
    S('rect',{x:108,y:416,width:504,height:156,rx:10,fill:'none',stroke:'var(--line)','stroke-dasharray':'4 4'},svg);txt(svg,100,494,'MLP','s','middle').setAttribute('transform','rotate(-90 100 494)');
    line(svg,64,48,118,48,'ln',true);line(svg,360,66,360,88,'ln',true);
    [[126,148],[178,194],[224,240],[270,286]].forEach(([a,b])=>line(svg,360,a,360,b-2,'ln',true));
    S('path',{d:'M360 322 V342 H72',class:'ln','marker-end':'url(#ah)'},svg);
    line(svg,64,384,118,384,'ln',true);line(svg,360,402,360,424,'ln',true);line(svg,237,462,237,482,'ln',true);line(svg,482,462,482,482,'ln',true);line(svg,360,514,360,528,'ln',true);
    S('path',{d:'M360 566 V586 H72',class:'ln','marker-end':'url(#ah)'},svg);
    Object.keys(N).forEach(k=>{const n=N[k];const g=S('g',{style:'cursor:pointer'},svg);g.addEventListener('click',()=>{sel=k;draw();});
      if(n[0]==='add'){S('circle',{cx:60,cy:n[2],r:12,class:'box',style:k===sel?'stroke:var(--tok);stroke-width:3':''},g);txt(g,60,n[2]+5,'+','b','middle');return;}
      const r=S('rect',{x:n[1],y:n[2],width:n[3],height:n[4],rx:6,class:n[0]==='w'?'bw':'bg',style:(n[0]==='op'?'stroke-dasharray:4 3;':'')+(k===sel?'stroke:var(--tok);stroke-width:3':'')},g);
      if(n[0]==='w'){txt(g,n[1]+n[3]/2,n[2]+16,label(k),'m','middle').setAttribute('style','font-size:'+(label(k).length>22?11:13)+'px;font-weight:600');txt(g,n[1]+n[3]/2,n[2]+30,n[8],'m tw','middle').setAttribute('style','font-size:11px');}
      else txt(g,n[1]+n[3]/2,n[2]+20,n[5],'s','middle');});
    const n=N[sel];clear(info);H('h3',null,n[5],info).style.marginTop='0';
    if(n[0]==='w'){const t=H('table','t',null,info);[['Shape (kursens konvention)',n[8]],['Parametrar',n[9].toLocaleString('sv-SE')],['I modellfilen','model.layers.N.'+n[6]+(n[6].indexOf('layernorm')>=0?'.weight':'.weight')],['I vLLM',n[7]]].forEach(([a,b])=>{const tr=H('tr',null,null,t);H('td',null,a,tr);H('td','n',b,tr);});}
    else{const p=H('p',null,'Ingen vikt, inget lagras i modellfilen.',info);p.style.cssText='font-family:var(--mono);font-size:13px;color:var(--ink2)';}
    H('p',null,n[10],info);}
  const bs={ours:$('ly-ours'),ckpt:$('ly-ckpt'),vllm:$('ly-vllm')};
  Object.keys(bs).forEach(k=>bs[k].addEventListener('click',()=>{nm=k;Object.keys(bs).forEach(j=>bs[j].classList.toggle('on',j===k));draw();}));draw();
})();
(function checkpoint(){
  const rows=[['self_attn.q_proj.weight','[4096, 4096]',16777216],['self_attn.k_proj.weight','[1024, 4096]',4194304],['self_attn.v_proj.weight','[1024, 4096]',4194304],['self_attn.o_proj.weight','[4096, 4096]',16777216],['mlp.gate_proj.weight','[14336, 4096]',58720256],['mlp.up_proj.weight','[14336, 4096]',58720256],['mlp.down_proj.weight','[4096, 14336]',58720256],['input_layernorm.weight','[4096]',4096],['post_attention_layernorm.weight','[4096]',4096]];
  function heat(parent,title,seed){const w=H('div',null,null,parent);H('div',null,title,w).style.cssText='font-family:var(--mono);font-size:12px;color:var(--ink2);margin-bottom:4px';
    const g=H('div','heat',null,w);g.style.gridTemplateColumns='repeat(24,1fr)';g.style.gap='1px';const R=rng(seed);
    for(let i=0;i<240;i++){const v=(R()+R()+R()-1.5)/1.5;const c=H('i',null,null,g);c.style.height='10px';c.style.background=v>=0?'var(--w)':'var(--neg)';c.style.opacity=(0.08+Math.min(1,Math.abs(v))*0.9).toFixed(2);}}
  function draw(){const L=+$('ck-l').value;$('ck-lv').textContent=String(L);
    let h='<tr><th>Tensor i lager '+L+'</th><th>Shape</th><th>Parametrar</th></tr>';rows.forEach(r=>{h+='<tr><td class="n">model.layers.<b>'+L+'</b>.'+r[0]+'</td><td class="n">'+r[1]+'</td><td class="n">'+r[2].toLocaleString('sv-SE')+'</td></tr>';});
    $('ck-tbl').innerHTML=h;const hh=$('ck-heat');clear(hh);heat(hh,'lager 0',7001);heat(hh,'lager '+L,7001+L*131);}
  $('ck-l').addEventListener('input',draw);draw();
})();
(function twoLines(){
  const x0=[2.0,-1.0,0.5,3.0,-0.5,1.0],a=[0.3,0.0,-0.2,0.1,0.6,-0.4],m=[-0.1,0.4,0.0,-0.3,0.2,0.5];
  const rms=v=>Math.sqrt(v.reduce((s,z)=>s+z*z,0)/v.length),nrm=v=>{const r=rms(v);return v.map(z=>z/r);};
  const x1=x0.map((v,i)=>v+a[i]),x2=x1.map((v,i)=>v+m[i]);
  const L1=['x',' = ','x +',' ','Attention(','RMSNorm(x)',')'],L2=['x',' = ','x +',' ','MLP(','RMSNorm(x)',')'];
  const st=[
   {hl:[],rows:[['x in',x0,'s']],t:['Strömmen kommer in','Det här är raden för token ”den” när den kommer in i lagret, efter alla tidigare lager. Den bär allt som hittills är känt om positionen.']},
   {hl:[[1,5]],rows:[['x',x0,'s'],['RMSNorm(x)',nrm(x0),'c']],t:['Gör en normaliserad kopia','RMSNorm delar varje tal med vektorns RMS, så kopian får RMS 1 men samma riktning. Strömmen x själv är orörd. (Inlärda vikten g₁ är satt till 1 här.)']},
   {hl:[[1,4],[1,6]],rows:[['x',x0,'s'],['RMSNorm(x)',nrm(x0),'c'],['Attention(…)',a,'b']],t:['Attention räknar ett bidrag','Attention läser kopian för den här positionen och för alla tidigare positioner, och hämtar det som är relevant. Ut kommer ett bidrag med samma shape som x. Det är litet jämfört med x.']},
   {hl:[[1,2]],rows:[['x före',x0,'s'],['+ bidrag',a,'b'],['x efter',x1,'s']],t:['Addera till strömmen','Bidraget läggs ovanpå. Inget raderas: varje dimension har bara justerats lite. Första raden är klar.']},
   {hl:[[2,5]],rows:[['x',x1,'s'],['RMSNorm(x)',nrm(x1),'c']],t:['Ny kopia, nu av uppdaterade x','Andra raden börjar likadant, men x innehåller nu det attention just hämtade. Kopian normaliseras med en egen vikt, g₂.']},
   {hl:[[2,4],[2,6]],rows:[['x',x1,'s'],['RMSNorm(x)',nrm(x1),'c'],['MLP(…)',m,'b']],t:['MLP:n räknar ett bidrag','MLP:n ser bara den här positionens kopia, inga andra tokens. Den blandar om dimensionerna och ger ett bidrag med samma shape.']},
   {hl:[[2,2]],rows:[['x före',x1,'s'],['+ bidrag',m,'b'],['x ut',x2,'s']],t:['Lagret är klart','Bidraget adderas och x går vidare till nästa lager, där samma två rader körs igen med nya vikter. Efter 32 lager är x summan av embedding och 64 sådana bidrag.']}];
  let i=0;
  function code(){const s=st[i].hl;const ln=(parts,li)=>parts.map((p,k)=>{const on=s.some(h=>h[0]===li&&h[1]===k);const e=p.replace(/</g,'&lt;');return on?'<mark style="background:color-mix(in srgb,var(--tok) 25%,transparent);color:inherit;border-radius:3px">'+e+'</mark>':e;}).join('');
    $('tl-code').innerHTML=ln(L1,1)+'\n'+ln(L2,2);}
  function rows(){const box=$('tl-rows');clear(box);st[i].rows.forEach(([lb,v,k])=>{const r=H('div',null,null,box);r.style.cssText='display:grid;grid-template-columns:110px repeat(6,1fr) 64px;gap:4px;align-items:center;margin:6px 0';
      const l=H('span',null,lb,r);l.style.cssText='font-family:var(--mono);font-size:12px;color:var(--ink2)';
      v.forEach(z=>{const c=H('span',null,nf(z,2),r);let st='font-family:var(--mono);font-size:12px;text-align:center;padding:7px 0;border-radius:4px;';
        if(k==='s')st+='background:color-mix(in srgb,var(--a) '+Math.round(15+Math.min(1,Math.abs(z)/3)*55)+'%,transparent);';
        else if(k==='c')st+='background:var(--soft);border:1px solid var(--a);';
        else st+='background:color-mix(in srgb,var(--kv) '+Math.round(10+Math.min(1,Math.abs(z)/0.7)*30)+'%,transparent);border:1px dashed var(--kv);';
        if(z<0)st+='color:var(--neg);';c.style.cssText=st;});
      const q=H('span',null,'RMS '+nf(rms(v),2),r);q.style.cssText='font-family:var(--mono);font-size:11px;color:var(--ink2);text-align:right';});}
  function draw(){code();rows();const tx=$('tl-text');clear(tx);H('h3',null,(i+1)+'. '+st[i].t[0],tx);H('p',null,st[i].t[1],tx);$('tl-n').textContent=(i+1)+' / '+st.length;}
  $('tl-next').addEventListener('click',()=>{if(i<st.length-1){i++;draw();}});$('tl-prev').addEventListener('click',()=>{if(i>0){i--;draw();}});draw();
})();
(function attVsMlp(){
  const svg=$('am-svg');const T=['Katten','satt','på','mattan','eftersom','den'];let mode='att',sel=5;
  const W={5:[0.55,0.05,0.04,0.12,0.04,0.2],4:[0.2,0.3,0.05,0.15,0.3],3:[0.1,0.15,0.5,0.25],2:[0.2,0.5,0.3],1:[0.6,0.4],0:[1]};
  const R0=rng(77);const val=T.map(()=>Array.from({length:12},()=>R0()));const x0=150,y0=50,cw=24,rh=40;
  function draw(){clear(svg);txt(svg,x0,24,'d: 12 av 4096 dimensioner →','s');txt(svg,x0-10,y0-10,'T ↓','s','end');
    T.forEach((t,r)=>{const y=y0+r*rh;const masked=mode==='att'&&r>sel;const w=mode==='att'?((W[sel]||[])[r]||0):(r===sel?1:0);
      const lb=txt(svg,x0-10,y+rh/2+2,t,r===sel?'b':'s','end');lb.setAttribute('style','cursor:pointer');lb.addEventListener('click',()=>{sel=r;draw();});
      for(let c=0;c<12;c++){const cx=x0+c*cw;if(masked){S('rect',{x:cx,y:y+4,width:cw-2,height:rh-8,rx:2,fill:'url(#hatch)'},svg);continue;}
        const on=mode==='att'?(r<=sel):(r===sel);const op=on?(mode==='att'?0.12+w*0.88:0.25+val[r][c]*0.7):0.08+val[r][c]*0.1;
        S('rect',{x:cx,y:y+4,width:cw-2,height:rh-8,rx:2,fill:'var(--a)',style:'opacity:'+op.toFixed(2)},svg);}
      const hit=S('rect',{x:0,y,width:x0+12*cw,height:rh,fill:'transparent',style:'cursor:pointer'},svg);hit.addEventListener('click',()=>{sel=r;draw();});
      if(r===sel)S('rect',{x:x0-3,y:y+1,width:12*cw+4,height:rh-2,rx:4,class:'hl'},svg);});
    const ex=x0+12*cw+14;
    if(mode==='att'){(W[sel]||[]).forEach((w,r)=>{if(r===sel||w<0.03)return;const y1=y0+r*rh+rh/2,y2=y0+sel*rh+rh/2,h=Math.abs(y2-y1);
        S('path',{d:'M'+ex+' '+y1+' C'+(ex+30+h*0.25)+' '+y1+' '+(ex+30+h*0.25)+' '+y2+' '+(ex+4)+' '+y2,fill:'none',stroke:'var(--a)','stroke-width':(1+w*8).toFixed(1),'stroke-linecap':'round',style:'opacity:'+(0.35+0.65*w).toFixed(2)},svg);
        txt(svg,ex+6,y1-6,Math.round(w*100)+' %','m').setAttribute('style','font-size:11px');});}
    else{T.forEach((t,r)=>{const y=y0+r*rh;const on=r===sel;line(svg,ex,y+rh/2,ex+22,y+rh/2,on?'ln':'lnf',on);S('rect',{x:ex+26,y:y+6,width:70,height:rh-12,rx:5,class:on?'bw':'bg',style:on?'':'opacity:.45'},svg);txt(svg,ex+61,y+rh/2+4,'MLP','s','middle');});
      txt(svg,ex+61,y0+T.length*rh+18,'samma vikter','s','middle');}
    const n=T[sel];
    $('am-out').innerHTML=mode==='att'?('<b>Attention</b> för ”'+n+'”: hämtar en viktad blandning av raderna ovanför och sin egen (procenten). Rader under är maskade. Information flyttas mellan tokens, längs T.'):('<b>MLP</b> för ”'+n+'”: bara den egna raden läses. Dimensionerna blandas om inom raden, längs d. Varje rad går genom samma MLP-vikter oberoende av de andra.');}
  $('am-att').addEventListener('click',()=>{mode='att';$('am-att').classList.add('on');$('am-mlp').classList.remove('on');draw();});
  $('am-mlp').addEventListener('click',()=>{mode='mlp';$('am-mlp').classList.add('on');$('am-att').classList.remove('on');draw();});draw();
})();
(function detectors(){
  const F=['syftar på katt','djur','trött','plural','kodkontext','negation'];const on=[true,true,true,false,false,false];
  const NEU=[['vilande djur',[0,1.2,1.2,0,0,0],-1.4,'sov, vilade, låg'],['husdjur',[1.5,0.5,0,0,0,0],-0.8,'morrhår, kisse, spann'],['trött människa',[0,-1.6,1.5,0,0,0],-0.4,'kaffe, jobbet, sömnbrist'],['flera subjekt',[0,0,0,2,0,0],-1,'de, dem, alla'],['kodkontext',[0,0,0,0,2.2,0],-1,'self, return, ('],['negation',[0,0,0,0,0,2],-1,'inte, aldrig, ingen']];
  const silu=z=>z/(1+Math.exp(-z));
  function draw(){const fb=$('dt-feat');clear(fb);F.forEach((f,i)=>{const b=H('button','chip '+(on[i]?'new':''),(on[i]?'✓ ':'')+f,fb);b.style.cursor='pointer';b.setAttribute('aria-pressed',on[i]?'true':'false');b.addEventListener('click',()=>{on[i]=!on[i];draw();});});
    const x=on.map(v=>v?1:0);const box=$('dt-rows');clear(box);
    const hd=H('div',null,null,box);hd.style.cssText='display:grid;grid-template-columns:120px 1fr 1fr;gap:10px;font-size:12px;color:var(--ink2);margin-bottom:4px';['neuron','gate = h · mönster','SiLU(gate)'].forEach(t=>H('span',null,t,hd));
    const fired=[];
    NEU.forEach(([n,w,b,wr])=>{const g=w.reduce((s,wi,i)=>s+wi*x[i],0)+b;const a=silu(g);if(a>0.3)fired.push([n,wr,a]);
      const r=H('div',null,null,box);r.style.cssText='display:grid;grid-template-columns:120px 1fr 1fr;gap:10px;align-items:center;margin:5px 0;font-size:14px';
      const l=H('span',null,n,r);l.style.fontWeight=a>0.3?'600':'400';
      [[g,'var(--tok)',2],[a,'var(--w)',2]].forEach(([v,c,mx])=>{const t=H('div',null,null,r);t.style.cssText='position:relative;height:20px;background:var(--soft);border-radius:3px';
        const f=H('div',null,null,t);const wd=Math.min(1,Math.abs(v)/mx)*50;f.style.cssText='position:absolute;top:0;bottom:0;border-radius:3px;background:'+(v>=0?c:'var(--neg)')+';'+(v>=0?'left:50%;width:'+wd+'%':'right:50%;width:'+wd+'%');
        const z=H('div',null,null,t);z.style.cssText='position:absolute;left:50%;top:0;bottom:0;width:1px;background:var(--ink2)';
        const s=H('span',null,nf(v,2),t);s.style.cssText='position:absolute;right:4px;top:1px;font-family:var(--mono);font-size:11px';});});
    $('dt-out').innerHTML=fired.length?'Neuroner som slår till skriver sin riktning till strömmen, vilket gör vissa fortsättningar troligare: '+fired.map(f=>'<b>'+f[0]+'</b> → '+f[1]).join('; ')+'.':'Ingen neuron slår till tydligt. MLP-bidraget blir nästan noll, och strömmen passerar i stort sett oförändrad.';}
  draw();
})();
(function lens(){
  const L=[0,8,16,24,32];
  const D=[[[' var',0.16],[' är',0.08],[',',0.06],[' inte',0.05],[' en',0.04]],[[' inte',0.12],[' så',0.10],[' en',0.08],[' väldigt',0.06],[' trött',0.04]],[[' trött',0.18],[' hungrig',0.09],[' inte',0.08],[' så',0.07],[' sömnig',0.05]],[[' trött',0.34],[' sömnig',0.14],[' hungrig',0.10],[' lat',0.06],[' så',0.04]],[[' trött',0.46],[' sömnig',0.12],[' hungrig',0.09],[' lat',0.05],[' mätt',0.03]]];
  const C=['Strömmen är fortfarande nästan bara embedding för ”var”. Toppgissningarna ekar den egna tokenen.','Grammatiken har tagit form: efter ”den var” brukar en förstärkning eller ett adjektiv komma.','Attention har hämtat ”Katten” och ”mattan”. Tillstånd som passar en katt börjar dyka upp.','Senare lager har dragit slutsatser av sammanhanget. ”trött” leder tydligt.','Efter sista lagret: den fördelning som samplingen faktiskt drar från.'];
  function draw(){const k=+$('ll-k').value;$('ll-kv').textContent=String(L[k]);const svg=$('ll-svg');clear(svg);
    for(let i=0;i<32;i++){S('rect',{x:14+i*16.5,y:14,width:14,height:22,rx:3,class:i<L[k]?'bw':'bg'},svg);}
    const mx=14+L[k]*16.5-1.5;S('line',{x1:mx,y1:6,x2:mx,y2:44,stroke:'var(--tok)','stroke-width':3},svg);txt(svg,Math.min(Math.max(mx,40),520),54,L[k]===0?'efter embedding':'efter lager '+L[k],'s','middle');
    const b=$('ll-bars');clear(b);D[k].forEach(([t,p])=>hbar(b,t,p/0.5,nf(p*100,0)+' %','var(--tok)'));$('ll-out').textContent=C[k];}
  $('ll-k').addEventListener('input',draw);draw();
})();
