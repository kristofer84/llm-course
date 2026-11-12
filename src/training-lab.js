/* CONTRACT DATA START */
QUIZ.m5.push(...[
  {
    "q": "trn.quiz.update.q",
    "o": [
      "trn.quiz.update.o1",
      "trn.quiz.update.o2",
      "trn.quiz.update.o3",
      "trn.quiz.update.o4"
    ],
    "a": 1,
    "e": "trn.quiz.update.e",
    "level": 1,
    "requires": [
      "Träning: ett synligt viktsteg"
    ]
  },
  {
    "q": "trn.quiz.sft.q",
    "o": [
      "trn.quiz.sft.o1",
      "trn.quiz.sft.o2",
      "trn.quiz.sft.o3",
      "trn.quiz.sft.o4"
    ],
    "a": 2,
    "e": "trn.quiz.sft.e",
    "level": 1,
    "requires": [
      "Förträning och SFT: olika data"
    ]
  },
  {
    "q": "trn.quiz.preference.q",
    "o": [
      "trn.quiz.preference.o1",
      "trn.quiz.preference.o2",
      "trn.quiz.preference.o3",
      "trn.quiz.preference.o4"
    ],
    "a": 0,
    "e": "trn.quiz.preference.e",
    "level": 1,
    "requires": [
      "Preferenser: RLHF och DPO"
    ]
  },
  {
    "q": "trn.quiz.lora.q",
    "o": [
      "trn.quiz.lora.o1",
      "trn.quiz.lora.o2",
      "trn.quiz.lora.o3",
      "trn.quiz.lora.o4"
    ],
    "a": 3,
    "e": "trn.quiz.lora.e",
    "level": 2,
    "requires": [
      "LoRA: frusen bas och låg rang",
      "QLoRA: vad har vilken precision?"
    ]
  }
]);
QUIZ.quantization = [
  {
    "q": "ql.quiz.round.q",
    "o": [
      "ql.quiz.round.o1",
      "ql.quiz.round.o2",
      "ql.quiz.round.o3",
      "ql.quiz.round.o4"
    ],
    "a": 1,
    "e": "ql.quiz.round.e",
    "level": 1,
    "requires": [
      "Skala, nollpunkt och avrundning"
    ]
  },
  {
    "q": "ql.quiz.group.q",
    "o": [
      "ql.quiz.group.o1",
      "ql.quiz.group.o2",
      "ql.quiz.group.o3",
      "ql.quiz.group.o4"
    ],
    "a": 2,
    "e": "ql.quiz.group.e",
    "level": 1,
    "requires": [
      "Grupper, utliggare och fel"
    ]
  },
  {
    "q": "ql.quiz.leak.q",
    "o": [
      "ql.quiz.leak.o1",
      "ql.quiz.leak.o2",
      "ql.quiz.leak.o3",
      "ql.quiz.leak.o4"
    ],
    "a": 0,
    "e": "ql.quiz.leak.e",
    "level": 1,
    "requires": [
      "Kalibrering utan dataläckage"
    ]
  },
  {
    "q": "ql.quiz.runtime.q",
    "o": [
      "ql.quiz.runtime.o1",
      "ql.quiz.runtime.o2",
      "ql.quiz.runtime.o3",
      "ql.quiz.runtime.o4"
    ],
    "a": 3,
    "e": "ql.quiz.runtime.e",
    "level": 1,
    "requires": [
      "Vikter, aktiveringar och mätning"
    ]
  },
  {
    "q": "ql.quiz.affine.q",
    "o": [
      "ql.quiz.affine.o1",
      "ql.quiz.affine.o2",
      "ql.quiz.affine.o3",
      "ql.quiz.affine.o4"
    ],
    "a": 1,
    "e": "ql.quiz.affine.e",
    "level": 2,
    "requires": [
      "Skala, nollpunkt och avrundning"
    ]
  },
  {
    "q": "ql.quiz.narrow.q",
    "o": [
      "ql.quiz.narrow.o1",
      "ql.quiz.narrow.o2",
      "ql.quiz.narrow.o3",
      "ql.quiz.narrow.o4"
    ],
    "a": 2,
    "e": "ql.quiz.narrow.e",
    "level": 2,
    "requires": [
      "Skala, nollpunkt och avrundning"
    ]
  }
];
GLOSS.push(...[
  [
    "trn.gloss.gradient.term",
    "trn.gloss.gradient.def"
  ],
  [
    "trn.gloss.rate.term",
    "trn.gloss.rate.def"
  ],
  [
    "trn.gloss.sft.term",
    "trn.gloss.sft.def"
  ],
  [
    "trn.gloss.rlhf.term",
    "trn.gloss.rlhf.def"
  ],
  [
    "trn.gloss.dpo.term",
    "trn.gloss.dpo.def"
  ],
  [
    "trn.gloss.kl.term",
    "trn.gloss.kl.def"
  ],
  [
    "trn.gloss.lora.term",
    "trn.gloss.lora.def"
  ],
  [
    "trn.gloss.qlora.term",
    "trn.gloss.qlora.def"
  ],
  [
    "trn.gloss.scale.term",
    "trn.gloss.scale.def"
  ],
  [
    "trn.gloss.zero.term",
    "trn.gloss.zero.def"
  ],
  [
    "trn.gloss.group.term",
    "trn.gloss.group.def"
  ],
  [
    "trn.gloss.calibration.term",
    "trn.gloss.calibration.def"
  ],
  [
    "trn.gloss.ptq.term",
    "trn.gloss.ptq.def"
  ],
  [
    "trn.gloss.qat.term",
    "trn.gloss.qat.def"
  ],
  [
    "trn.gloss.leakage.term",
    "trn.gloss.leakage.def"
  ]
]);
/* CONTRACT DATA END */

/* Pure arithmetic also makes the offline examples independently testable. */
function trnStep(eta){
  const start=1,gradient=-2,next=start-eta*gradient;
  return {start,gradient,next,delta:next-start,loss:0.5*(next-3)**2};
}
function trnPreference(m,beta){
  const z=beta*m;
  return {p:1/(1+Math.exp(-z)),loss:Math.max(0,-z)+Math.log1p(Math.exp(-Math.abs(z)))};
}
function qlEncode(x,bits,mode){
  const symmetric=mode==='symmetric',Q=symmetric?2**(bits-1)-1:2**bits-1;
  const lo=symmetric?-Q:0,hi=Q,s=symmetric?2/Q:4/Q;
  const clamp=v=>Math.min(hi,Math.max(lo,v));
  const z=symmetric?0:clamp(Math.round(1/s));
  // Math.round uses nearest with half-way ties toward positive infinity.
  const raw=Math.round(x/s)+z,q=clamp(raw),hat=s*(q-z);
  return {s,z,lo,hi,raw,q,hat,error:hat-x,clipped:q!==raw};
}
function qlGrouped(size,outlier){
  const values=[0.12,-0.18,0.24,-0.30,0.15,-0.21,0.27,outlier];
  const scales=[],reconstructed=[];
  for(let i=0;i<values.length;i+=size){
    const group=values.slice(i,i+size),s=Math.max(...group.map(Math.abs))/7;
    scales.push(s);
    group.forEach(x=>reconstructed.push(s*Math.max(-7,Math.min(7,Math.round(x/s)))));
  }
  const mse=values.reduce((sum,x,i)=>sum+(reconstructed[i]-x)**2,0)/values.length;
  return {values,scales,reconstructed,mse,metadata:scales.length*16,total:32+scales.length*16};
}

/* INTERACTIVE VISUALS START: controls remain mounted through every redraw. */
(function trainingUpdate(){
  const rate=$('trn-rate'),svg=$('trn-update-svg');
  function draw(){
    const eta=+rate.value,r=trnStep(eta),px=w=>35+w*80,py=l=>220-l*35;
    clear(svg);line(svg,35,220,525,220,'lnf');line(svg,35,32,35,220,'lnf');
    const points=Array.from({length:61},(_,i)=>{const w=i/10;return px(w)+','+py(0.5*(w-3)**2);}).join(' ');
    S('polyline',{points,fill:'none',stroke:'var(--a)','stroke-width':3},svg);
    [0,1,3,6].forEach(w=>txt(svg,px(w),237,nf(w,0),'m','middle'));
    S('circle',{cx:px(1),cy:py(2),r:6,fill:'var(--w)'},svg);
    S('circle',{cx:px(r.next),cy:py(r.loss),r:7,fill:'var(--tok)'},svg);
    txt(svg,50,25,L.t('trn.update.start'),'s');
    txt(svg,285,25,L.t('trn.update.next',{w:nf(r.next,2)}),'s');
    line(svg,px(1),250,px(r.next),250,'ln',eta!==0);
    txt(svg,285,268,L.t('trn.update.axis'),'s','middle');
    const effect=L.t(r.loss<2-1e-10?'trn.update.lower':r.loss>2+1e-10?'trn.update.higher':'trn.update.same');
    $('trn-update-out').textContent=L.t('trn.update.out',{eta:nf(eta,2),delta:nf(r.delta,2),w:nf(r.next,2),loss:nf(r.loss,3),effect});
    rate.setAttribute('aria-valuetext',nf(eta,2));
  }
  rate.addEventListener('input',draw);draw();
})();
(function trainingPreference(){
  const margin=$('trn-margin'),beta=$('trn-beta'),svg=$('trn-pref-svg');
  function draw(){
    const m=+margin.value,b=+beta.value,r=trnPreference(m,b);
    clear(svg);
    [[L.t('trn.pref.chosen'),r.p,'var(--tok)'],[L.t('trn.pref.rejected'),1-r.p,'var(--w)']].forEach(([label,p,color],i)=>{
      const y=30+i*70;txt(svg,20,y,label,'s');
      rect(svg,20,y+10,510,25,'bg');S('rect',{x:20,y:y+10,width:510*p,height:25,rx:4,fill:color},svg);
      txt(svg,525,y-1,nf(p*100,1)+' %','m','end');
    });
    txt(svg,20,190,L.t('trn.pref.score',{p:nf(r.p,4)}),'m');
    txt(svg,20,222,L.t('trn.pref.loss',{loss:nf(r.loss,4)}),'m');
    $('trn-pref-out').textContent=L.t('trn.pref.out',{m:nf(m,2),beta:nf(b,2),p:nf(r.p,4),loss:nf(r.loss,4)});
    margin.setAttribute('aria-valuetext',nf(m,2));
  }
  margin.addEventListener('input',draw);beta.addEventListener('change',draw);draw();
})();
(function trainingAdapter(){
  const rank=$('trn-rank'),svg=$('trn-lora-svg');
  function draw(){
    const r=+rank.value;clear(svg);
    txt(svg,10,32,L.t('trn.lora.input'),'m');
    rect(svg,150,40,270,50,'bw');txt(svg,285,69,L.t('trn.lora.base'),'s','middle');
    rect(svg,130,138,160,48,'ba');rect(svg,315,138,190,48,'ba');
    txt(svg,210,166,L.t('trn.lora.a',{r}),'s','middle');txt(svg,410,166,L.t('trn.lora.b',{r}),'s','middle');
    line(svg,70,42,70,65,'lnf');line(svg,70,65,150,65,'ln',true);
    line(svg,70,65,70,162,'lnf');line(svg,70,162,130,162,'ln',true);
    line(svg,290,162,315,162,'ln',true);line(svg,420,65,530,65,'lnf');line(svg,530,65,530,205,'ln',true);
    line(svg,505,162,515,162,'lnf');line(svg,515,162,515,205,'ln',true);
    S('circle',{cx:523,cy:220,r:17,class:'box'},svg);txt(svg,523,226,'+','b','middle');
    line(svg,523,237,523,249,'ln',true);txt(svg,523,273,L.t('trn.lora.output'),'m','end');
    // The miniature cell grids show how r changes A's columns and B's rows.
    for(let i=0;i<6;i++)for(let j=0;j<r;j++)rect(svg,140+j*8,194+i*8,6,6,'ba',0);
    for(let i=0;i<r;i++)for(let j=0;j<4;j++)rect(svg,328+j*8,194+i*8,6,6,'ba',0);
    $('trn-lora-out').textContent=L.t('trn.lora.out',{r,a:6*r,b:4*r,n:10*r});
    rank.setAttribute('aria-valuetext',nf(r,0));
  }
  rank.addEventListener('input',draw);draw();
})();
(function quantizationScale(){
  const bits=$('ql-bits'),mode=$('ql-mode'),value=$('ql-value'),svg=$('ql-scale-svg');
  function draw(){
    const x=+value.value,b=+bits.value,r=qlEncode(x,b,mode.value),px=v=>30+(v+4)*62.5;
    clear(svg);line(svg,30,110,530,110,'lnf');
    for(let q=r.lo;q<=r.hi;q++){
      const p=px(r.s*(q-r.z));
      S('line',{x1:p,x2:p,y1:92,y2:128,stroke:'var(--a)','stroke-width':b===8?1:2,style:'opacity:'+(b===8?0.4:0.8)},svg);
    }
    S('circle',{cx:px(x),cy:70,r:7,fill:'var(--w)'},svg);
    S('circle',{cx:px(r.hat),cy:150,r:7,fill:'var(--tok)'},svg);
    line(svg,px(x),79,px(r.hat),140,'ln',true);
    txt(svg,20,25,L.t('ql.scale.original',{x:nf(x,4)}),'m');
    txt(svg,20,188,L.t('ql.scale.reconstructed',{x:nf(r.hat,4)}),'m');
    txt(svg,535,25,L.t('ql.scale.levels',{n:r.hi-r.lo+1}),'s','end');
    txt(svg,280,216,L.t('ql.scale.axis'),'s','middle');
    $('ql-scale-out').textContent=L.t('ql.scale.out',{bits:b,s:nf(r.s,6),z:r.z,lo:r.lo,hi:r.hi,raw:r.raw,q:r.q,hat:nf(r.hat,6),error:nf(r.error,6),clipped:L.t(r.clipped?'ql.scale.clipped':'ql.scale.unclipped')});
    value.setAttribute('aria-valuetext',nf(x,2));
  }
  bits.addEventListener('change',draw);mode.addEventListener('change',draw);value.addEventListener('input',draw);draw();
})();
(function quantizationGroups(){
  const size=$('ql-group'),outlier=$('ql-outlier'),svg=$('ql-groups-svg');
  function draw(){
    const n=+size.value,o=+outlier.value,r=qlGrouped(n,o);clear(svg);
    txt(svg,20,18,L.t('ql.groups.legend'),'s');
    S('rect',{x:265,y:7,width:14,height:14,fill:'var(--w)'},svg);
    S('rect',{x:287,y:7,width:14,height:14,fill:'var(--tok)'},svg);
    line(svg,28,150,540,150,'lnf');
    r.values.forEach((x,i)=>{
      [x,r.reconstructed[i]].forEach((v,j)=>{
        const h=Math.min(105,Math.abs(v)*250);
        S('rect',{x:38+i*64+j*21,y:v>=0?150-h:150,width:18,height:h,fill:j?'var(--tok)':'var(--w)'},svg);
      });
      txt(svg,58+i*64,244,nf(i+1,0),'m','middle');
    });
    for(let k=n;k<8;k+=n)S('line',{x1:28+k*64,x2:28+k*64,y1:35,y2:230,class:'lnf','stroke-dasharray':'4 4'},svg);
    txt(svg,535,38,L.t('ql.groups.extreme',{o:nf(o,1)}),'s','end');
    r.scales.forEach((s,g)=>txt(svg,28+(g*n+n/2)*64,267,L.t('ql.groups.scale',{g:g+1,s:nf(s,4)}),'s','middle'));
    txt(svg,20,35,L.t('ql.groups.small'),'s');
    $('ql-groups-out').textContent=L.t('ql.groups.out',{size:n,scales:r.scales.map(s=>nf(s,6)).join('; '),mse:nf(r.mse,6),meta:r.metadata,total:r.total,bytes:r.total/8});
    outlier.setAttribute('aria-valuetext',nf(o,1));
  }
  size.addEventListener('change',draw);outlier.addEventListener('input',draw);draw();
})();
