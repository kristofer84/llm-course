/* ================= v7: layer contents for beginners ================= */
(function layerNine(){
  const G=[[L.t('j8.19'),'var(--w)',[
     ['Wq',L.t('j8.1'),'[4096, 4096]',16.78],
     ['Wk',L.t('j8.2'),'[4096, 1024]',4.19],
     ['Wv',L.t('j8.3'),'[4096, 1024]',4.19],
     ['Wo',L.t('j8.4'),'[4096, 4096]',16.78]]],
    [L.t('j8.20'),'var(--a)',[
     ['W_gate',L.t('j8.5'),'[4096, 14336]',58.72],
     ['W_up',L.t('j8.6'),'[4096, 14336]',58.72],
     ['W_down',L.t('j8.7'),'[14336, 4096]',58.72]]],
    [L.t('j8.21'),'var(--kv)',[
     ['g₁ (RMSNorm)',L.t('j8.8'),'[4096]',0.004],
     ['g₂ (RMSNorm)',L.t('j8.9'),'[4096]',0.004]]]];
  const R={};let sel='W_gate';const list=$('ln-list');
  function rows(){clear(list);G.forEach(([gt,c,items])=>{const h=H('h3',null,L.t(gt),list);h.style.cssText='margin:14px 0 6px;border-left:4px solid '+c+';padding-left:10px';
      items.forEach(([n,d,sh,m])=>{const b=H('button',null,null,list);b.style.cssText='display:grid;grid-template-columns:110px 1fr;gap:10px;width:100%;text-align:left;border:1px solid '+(n===sel?'var(--tok)':'var(--line)')+';background:'+(n===sel?'color-mix(in srgb,var(--tok) 7%,var(--surface))':'var(--surface)')+';border-radius:8px;padding:8px 10px;margin:5px 0;cursor:pointer;font-size:14px';
        const l=H('span',null,null,b);H('b',null,n,l).style.fontFamily='var(--mono)';const s2=H('div',null,sh,l);s2.style.cssText='font-family:var(--mono);font-size:11px;color:var(--ink2)';H('span',null,L.t(d),b);
        b.addEventListener('click',()=>{sel=n;rows();pic();});});});}
  function pic(){const svg=$('ln-svg');clear(svg);const k=60/4096;
    const P={'Wq':[20,40,4096,4096],'Wk':[100,40,4096,1024],'Wv':[135,40,4096,1024],'Wo':[170,40,4096,4096],'W_gate':[20,160,4096,14336],'W_up':[20,240,4096,14336],'W_down':[260,160,14336,4096],'g₁ (RMSNorm)':[360,40,4096,1],'g₂ (RMSNorm)':[380,40,4096,1]};
    txt(svg,20,28,L.t('attention'),'s');txt(svg,20,150,L.t('MLP'),'s');txt(svg,360,28,L.t('j8.22'),'s');
    const col={};G.forEach(([_,c,it])=>it.forEach(x=>col[x[0]]=c));
    Object.keys(P).forEach(n=>{const [x,y,r,c]=P[n];const w=Math.max(3,c*k),h=r*k;const on=n===sel;
      const e=S('rect',{x,y,width:w,height:h,rx:2,fill:col[n],style:'cursor:pointer;opacity:'+(on?0.9:0.35)+(on?';stroke:var(--tok);stroke-width:3':'')},svg);e.addEventListener('click',()=>{sel=n;rows();pic();});
      const lb=n.replace(' (RMSNorm)','');if(w>30)txt(svg,x+w/2,y+h/2+4,lb,'m','middle').setAttribute('style','font-size:11px;pointer-events:none');else txt(svg,x+w/2,y+h+14,lb,'m','middle').setAttribute('style','font-size:10px');});
    txt(svg,20,374,L.t('j8.10'),'s');txt(svg,20,392,L.t('j8.11'),'s');
    let it;G.forEach(g=>g[2].forEach(x=>{if(x[0]===sel)it=x;}));const tot=G.reduce((s,g)=>s+g[2].reduce((a,x)=>a+x[3],0),0);
    const sz=it[3]<0.01?L.t('j8.23'):L.t('j8.24',{n:nf(it[3],1)});
    const sh2=it[3]/tot*100<0.01?L.t('j8.25'):nf(it[3]/tot*100,1);
    $('ln-out').innerHTML=L.t('j8.26',{name:it[0],shape:it[2],size:sz,share:sh2,total:nf(tot,1)});}
  rows();pic();
})();
(function billions(){
  const svg=$('bn-svg');let i=0;
  const L1=218.11,att=41.94,mlp=176.16;
  const st=[
   [L.t('j8.27'),L.t('j8.12'),L1/1000],
   [L.t('j8.13'),L.t('j8.28'),32*L1/1000],
   [L.t('j8.29'),L.t('j8.14'),32*L1/1000+0.525],
   [L.t('j8.30'),L.t('j8.15'),32*L1/1000+1.05],
   [L.t('j8.31'),L.t('j8.16'),32*L1/1000+1.05+0.000004],
   [L.t('j8.17'),L.t('j8.18'),8.03]];
  function draw(){clear(svg);const W=500,x0=30,sc=W/8.1;
    txt(svg,x0,22,L.t('j8.32'),'s');[0,2,4,6,8].forEach(v=>{line(svg,x0+v*sc,34,x0+v*sc,96,'lnf');txt(svg,x0+v*sc,112,String(v),'s','middle');});
    let x=x0;const seg=(w,c,l)=>{if(w<=0)return;S('rect',{x,y:40,width:Math.max(1,w*sc),height:50,fill:c,style:'opacity:.8'},svg);if(w*sc>46)txt(svg,x+w*sc/2,70,l,'s','middle').setAttribute('style','fill:var(--surface);font-weight:600');x+=w*sc;};
    const nl=i===0?1:32;for(let k=0;k<nl;k++){seg(att/1000,'var(--w)',nl===1?'':'');seg(mlp/1000,'var(--a)','');}
    if(i>=2)seg(0.525,'var(--tok)','emb');if(i>=3)seg(0.525,'var(--kv)','LM');
    for(let k=0;k<32;k++){const on=i>0||k===0;S('rect',{x:x0+(k%16)*31,y:150+Math.floor(k/16)*42,width:27,height:34,rx:4,class:on?'bw':'bg',style:on?'':'opacity:.4'},svg);txt(svg,x0+(k%16)*31+13.5,150+Math.floor(k/16)*42+22,String(k+1),'s','middle').setAttribute('style','font-size:10px');}
    txt(svg,x0,140,L.t('j8.33'),'s');
    const tot=st[i][2];txt(svg,x0,270,i===5?L.t('j8.34'):L.t('j8.35',{n:nf(tot,2)}),'b');
    const lg=[['var(--w)','attention'],['var(--a)','MLP'],['var(--tok)','embedding'],['var(--kv)','LM head']];lg.forEach(([c,l],k)=>{S('rect',{x:x0+k*120,y:296,width:12,height:12,fill:c},svg);txt(svg,x0+k*120+18,306,L.t(l),'s');});
    const tx=$('bn-text');clear(tx);H('h3',null,(i+1)+'. '+L.t(st[i][0]),tx).style.marginTop='0';H('p',null,L.t(st[i][1]),tx);$('bn-n').textContent=(i+1)+' / '+st.length;
    const rowsT=[[L.t('j8.36'),1.34,2,i>=1],[L.t('j8.37'),5.64,2,i>=1],[L.t('j8.38'),0.0003,4,i>=1],['Embedding',0.53,2,i>=2],['LM head',0.53,2,i>=3],['Final norm',0.000004,6,i>=4],[L.t('j8.39'),8.03,2,i>=4]];
    $('bn-tbl').innerHTML='<tr><th>'+L.t('Del')+'</th><th>'+L.t('j8.40')+'</th></tr>'+rowsT.map(r=>'<tr style="opacity:'+(r[3]?1:0.3)+'"><td>'+L.t(r[0])+'</td><td class="n">'+nf(r[1],r[2])+' B</td></tr>').join('');}
  $('bn-next').addEventListener('click',()=>{if(i<st.length-1){i++;draw();}});$('bn-prev').addEventListener('click',()=>{if(i>0){i--;draw();}});draw();
})();
