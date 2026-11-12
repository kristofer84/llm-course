/* CONTRACT DATA START */
QUIZ.evaluation = [
  {
    "q": "op.quiz.loss.q",
    "o": [
      "op.quiz.loss.o1",
      "op.quiz.loss.o2",
      "op.quiz.loss.o3",
      "op.quiz.loss.o4"
    ],
    "a": 0,
    "e": "op.quiz.loss.e",
    "level": 2,
    "requires": [
      "Loss och perplexitet i siffror"
    ]
  },
  {
    "q": "op.quiz.split.q",
    "o": [
      "op.quiz.split.o1",
      "op.quiz.split.o2",
      "op.quiz.split.o3",
      "op.quiz.split.o4"
    ],
    "a": 1,
    "e": "op.quiz.split.e",
    "level": 1,
    "requires": [
      "Benchmark och egna testmängder"
    ]
  },
  {
    "q": "op.quiz.regression.q",
    "o": [
      "op.quiz.regression.o1",
      "op.quiz.regression.o2",
      "op.quiz.regression.o3",
      "op.quiz.regression.o4"
    ],
    "a": 2,
    "e": "op.quiz.regression.e",
    "level": 1,
    "requires": [
      "Faktastöd och regressioner"
    ]
  },
  {
    "q": "op.quiz.quantization.q",
    "o": [
      "op.quiz.quantization.o1",
      "op.quiz.quantization.o2",
      "op.quiz.quantization.o3",
      "op.quiz.quantization.o4"
    ],
    "a": 3,
    "e": "op.quiz.quantization.e",
    "level": 2,
    "requires": [
      "Kvalitet efter kvantisering"
    ]
  }
];
QUIZ.applications = [
  {
    "q": "op.quiz.tooldata.q",
    "o": [
      "op.quiz.tooldata.o1",
      "op.quiz.tooldata.o2",
      "op.quiz.tooldata.o3",
      "op.quiz.tooldata.o4"
    ],
    "a": 0,
    "e": "op.quiz.tooldata.e",
    "level": 1,
    "requires": [
      "Verktygsanrop är data"
    ]
  },
  {
    "q": "op.quiz.approval.q",
    "o": [
      "op.quiz.approval.o1",
      "op.quiz.approval.o2",
      "op.quiz.approval.o3",
      "op.quiz.approval.o4"
    ],
    "a": 1,
    "e": "op.quiz.approval.e",
    "level": 1,
    "requires": [
      "Verktygsloopen steg för steg"
    ]
  },
  {
    "q": "op.quiz.jsonlatency.q",
    "o": [
      "op.quiz.jsonlatency.o1",
      "op.quiz.jsonlatency.o2",
      "op.quiz.jsonlatency.o3",
      "op.quiz.jsonlatency.o4"
    ],
    "a": 2,
    "e": "op.quiz.jsonlatency.e",
    "level": 1,
    "requires": [
      "Labben: första anropet"
    ]
  },
  {
    "q": "op.quiz.tails.q",
    "o": [
      "op.quiz.tails.o1",
      "op.quiz.tails.o2",
      "op.quiz.tails.o3",
      "op.quiz.tails.o4"
    ],
    "a": 3,
    "e": "op.quiz.tails.e",
    "level": 1,
    "requires": [
      "Labben: mät rätt latens"
    ]
  }
];
QUIZ.m8.push(...[
  {
    "q": "op.quiz.cancel.q",
    "o": [
      "op.quiz.cancel.o1",
      "op.quiz.cancel.o2",
      "op.quiz.cancel.o3",
      "op.quiz.cancel.o4"
    ],
    "a": 0,
    "e": "op.quiz.cancel.e",
    "level": 1,
    "requires": [
      "Kö, antagning och avbrott"
    ]
  },
  {
    "q": "op.quiz.idempotency.q",
    "o": [
      "op.quiz.idempotency.o1",
      "op.quiz.idempotency.o2",
      "op.quiz.idempotency.o3",
      "op.quiz.idempotency.o4"
    ],
    "a": 1,
    "e": "op.quiz.idempotency.e",
    "level": 1,
    "requires": [
      "Robust drift och tenantgränser"
    ]
  }
]);
QUIZ.final.push(...[
  {
    "q": "op.quiz.evidence.q",
    "o": [
      "op.quiz.evidence.o1",
      "op.quiz.evidence.o2",
      "op.quiz.evidence.o3",
      "op.quiz.evidence.o4"
    ],
    "a": 2,
    "e": "op.quiz.evidence.e",
    "level": 1,
    "requires": [
      "Benchmark och egna testmängder",
      "Faktastöd och regressioner"
    ]
  },
  {
    "q": "op.quiz.boundary.q",
    "o": [
      "op.quiz.boundary.o1",
      "op.quiz.boundary.o2",
      "op.quiz.boundary.o3",
      "op.quiz.boundary.o4"
    ],
    "a": 3,
    "e": "op.quiz.boundary.e",
    "level": 1,
    "requires": [
      "Verktygsanrop är data",
      "Verktygsloopen steg för steg"
    ]
  },
  {
    "q": "op.quiz.cost.q",
    "o": [
      "op.quiz.cost.o1",
      "op.quiz.cost.o2",
      "op.quiz.cost.o3",
      "op.quiz.cost.o4"
    ],
    "a": 0,
    "e": "op.quiz.cost.e",
    "level": 1,
    "requires": [
      "Spårning, svanslatens och kostnad"
    ]
  }
]);
GLOSS.push(...[
  [
    "op.gloss.1.term",
    "op.gloss.1.def"
  ],
  [
    "op.gloss.2.term",
    "op.gloss.2.def"
  ],
  [
    "op.gloss.3.term",
    "op.gloss.3.def"
  ],
  [
    "op.gloss.4.term",
    "op.gloss.4.def"
  ],
  [
    "op.gloss.5.term",
    "op.gloss.5.def"
  ],
  [
    "op.gloss.6.term",
    "op.gloss.6.def"
  ],
  [
    "op.gloss.7.term",
    "op.gloss.7.def"
  ],
  [
    "op.gloss.8.term",
    "op.gloss.8.def"
  ],
  [
    "op.gloss.9.term",
    "op.gloss.9.def"
  ],
  [
    "op.gloss.10.term",
    "op.gloss.10.def"
  ],
  [
    "op.gloss.11.term",
    "op.gloss.11.def"
  ],
  ["op.gloss.12.term", "op.gloss.12.def"],
  ["op.gloss.13.term", "op.gloss.13.def"],
  ["op.gloss.14.term", "op.gloss.14.def"],
  ["op.gloss.15.term", "op.gloss.15.def"]
]);
/* CONTRACT DATA END */

/* OP MATH START */
function opLossStats(p) {
  const probabilities = [0.5, 0.25, p];
  const losses = probabilities.map(x => -Math.log(x));
  const loss = losses.reduce((a, b) => a + b, 0) / losses.length;
  return {probabilities, losses, loss, perplexity: Math.exp(loss)};
}
function opEvalStats(config) {
  const gold = [1,1,1,1,1,1,0,0,0,0,0,0];
  const baseline = [1,1,1,1,1,0,0,0,0,0,1,0];
  const predicted = config === 'candidate' ? [1,1,1,1,0,0,0,0,0,1,0,0] : baseline;
  const r = {tp:0, fn:0, fp:0, tn:0, fixes:0, regressions:0, cases:[]};
  gold.forEach((y, i) => {
    const old = baseline[i] === y, now = predicted[i] === y;
    r[y ? (predicted[i] ? 'tp' : 'fn') : (predicted[i] ? 'fp' : 'tn')]++;
    if (!old && now) r.fixes++;
    if (old && !now) r.regressions++;
    r.cases.push({old, now});
  });
  r.correct = r.tp + r.tn;
  return r;
}
function opPercentile(sorted, q) {
  return sorted[Math.max(0, Math.ceil(q * sorted.length) - 1)];
}
function opCostStats(slow, fixed, completed, output) {
  const latencies = Array.from({length:100}, (_, i) => i < 100-slow ? 100 : 1000);
  return {latencies, mean:latencies.reduce((a,b)=>a+b,0)/100,
    p50:opPercentile(latencies,.50), p95:opPercentile(latencies,.95),
    p99:opPercentile(latencies,.99), cost:fixed*1000000/(completed*output)};
}
/* OP MATH END */

(function operationsVisuals() {
  const el = id => document.getElementById('op-' + id);
  const tr = (key, vars) => L.t('op.' + key, vars);
  const number = n => nf(n, 0);
  function words(svg, x, y, value, anchor) {
    const node = txt(svg, x, y, value, 's', anchor);
    node.setAttribute('style', 'font-size:13px;fill:var(--ink)');
    return node;
  }
  function box(svg, x, y, width, height, color) {
    return S('rect', {x,y,width,height,rx:5,fill:color,stroke:'var(--line)'}, svg);
  }
  function slider(id, text) { el(id).setAttribute('aria-valuetext', text); }

  (function probabilities() {
    const control = el('probability'), svg = el('loss');
    if (!control || !svg) return;
    function draw() {
      const p = Number(control.value)/100, r = opLossStats(p);
      clear(svg);
      r.probabilities.forEach((prob, i) => {
        const y = 35 + i*57;
        box(svg, 20, y, 460, 21, 'var(--surface)');
        box(svg, 20, y, 460*prob, 21, 'var(--tok)');
        words(svg, 20, y-8, tr('loss.row', {i:i+1,p:nf(prob,3),loss:nf(r.losses[i],4)}));
      });
      slider('probability', nf(p*100,1) + '%');
      el('loss-out').textContent = tr('loss.result', {p:nf(p,3),loss:nf(r.loss,4),ppl:nf(r.perplexity,4)});
    }
    control.addEventListener('input', draw); draw();
  })();

  (function evaluation() {
    const control = el('eval-config'), svg = el('eval');
    if (!control || !svg) return;
    function draw() {
      const r = opEvalStats(control.value); clear(svg);
      words(svg, 20, 26, tr('eval.matrix'));
      words(svg, 330, 26, tr('eval.paired'));
      [['tp',20,45],['fn',165,45],['fp',20,125],['tn',165,125]].forEach(([k,x,y])=>{
        box(svg,x,y,130,65,(k==='tp'||k==='tn')?'var(--surface)':'var(--bg)');
        words(svg,x+65,y+38,tr('eval.'+k,{n:r[k]}),'middle');
      });
      r.cases.forEach((v,i)=>{
        const x=330+(i%3)*86, y=45+Math.floor(i/3)*52;
        const color=v.old&&!v.now?'var(--neg)':!v.old&&v.now?'var(--kv)':'var(--line)';
        const b=box(svg,x,y,79,42,'var(--surface)');b.setAttribute('style','fill:var(--surface);stroke:'+color+';stroke-width:2');
        words(svg,x+39,y+26,tr('eval.case',{id:i+1,old:v.old?'✓':'✗',now:v.now?'✓':'✗'}),'middle');
      });
      el('eval-out').textContent=tr('eval.result',Object.fromEntries(
        ['correct','tp','fn','fp','tn','fixes','regressions'].map(k=>[k,number(r[k])])));
    }
    control.addEventListener('change',draw);draw();
  })();

  (function queue() {
    const svg=el('queue');if(!svg)return;
    let active, waiting, budget, tick, next, counts;
    function reset() {
      active=[];waiting=[];budget=6;tick=0;next=1;
      counts={admitted:0,done:0,cancelled:0,rate:0,capacity:0};draw();
    }
    function fill() { while(active.length<2 && waiting.length) active.push(waiting.shift()); }
    function draw() {
      clear(svg); words(svg,20,27,tr('queue.active'));words(svg,218,27,tr('queue.waiting'));
      for(let i=0;i<6;i++) {
        const job=i<2?active[i]:waiting[i-2], x=20+i*94;
        box(svg,x,48,84,68,job?(i<2?'color-mix(in srgb,var(--tok) 12%,var(--surface))':'var(--surface)'):'var(--bg)');
        words(svg,x+42,75,job?tr('queue.job',{id:job.id}):tr('queue.empty'),'middle');
        if(job&&i<2)words(svg,x+42,98,tr('queue.remaining',{n:job.remaining}),'middle');
      }
      slider('arrivals',number(+el('arrivals').value));
      el('queue-out').textContent=tr('queue.result',{
        tick:number(tick),arrivals:number(+el('arrivals').value),active:number(active.length),
        queued:number(waiting.length),budget:number(budget),
        ...Object.fromEntries(Object.entries(counts).map(([k,v])=>[k,number(v)]))});
      el('cancel').disabled=active.length+waiting.length===0;
    }
    el('arrivals').addEventListener('input',draw);
    el('enqueue').addEventListener('click',()=>{
      for(let i=0;i<+el('arrivals').value;i++) {
        const id=next++;
        if(budget===0){counts.rate++;continue;}
        budget--;
        if(active.length===2&&waiting.length===4){counts.capacity++;continue;}
        const job={id,remaining:3};counts.admitted++;
        if(active.length<2)active.push(job);else waiting.push(job);
      }
      draw();
    });
    el('tick').addEventListener('click',()=>{
      tick++;budget=6;
      active.forEach(job=>job.remaining--);
      counts.done+=active.filter(job=>job.remaining===0).length;
      active=active.filter(job=>job.remaining>0);fill();draw();
    });
    el('cancel').addEventListener('click',()=>{
      if(active.length){active.shift();counts.cancelled++;}
      else if(waiting.length){waiting.shift();counts.cancelled++;}
      fill();draw();
    });
    el('queue-reset').addEventListener('click',reset);reset();
  })();

  (function tailCost() {
    const svg=el('cost');if(!svg)return;
    function draw() {
      const slow=+el('tails').value,fixed=+el('fixed').value,
        completed=+el('completed').value,output=+el('output').value;
      const r=opCostStats(slow,fixed,completed,output);clear(svg);
      words(svg,20,22,tr('cost.distribution',{slow:number(slow),fast:number(100-slow)}));
      r.latencies.forEach((ms,i)=>{
        S('rect',{x:30+i*5.35,y:145-ms*.1,width:4,height:ms*.1,
          fill:ms===1000?'var(--neg)':'var(--tok)'},svg);
      });
      line(svg,25,145,570,145,'ln');
      const vars={slow:number(slow),mean:nf(r.mean,0),p50:number(r.p50),p95:number(r.p95),p99:number(r.p99),
        fixed:nf(fixed,2),completed:number(completed),output:number(output),cost:nf(r.cost,2)};
      words(svg,20,175,tr('cost.percentiles',vars));
      el('cost-out').textContent=tr('cost.result',vars);
      slider('tails',number(slow));slider('fixed',tr('cost.dollars',{n:nf(fixed,2)}));
      slider('completed',tr('cost.requests',{n:number(completed)}));slider('output',tr('cost.tokens',{n:number(output)}));
    }
    ['tails','fixed','completed','output'].forEach(id=>el(id).addEventListener('input',draw));draw();
  })();

  (function toolLoop() {
    const svg=el('tool');if(!svg)return;
    let step=0,blocked=false,waiting=false;
    const positions=[[20,45],[210,45],[400,45],[400,170],[210,170],[20,170]];
    function draw() {
      const scenario=el('tool-case').value;clear(svg);
      line(svg,190,70,210,70,'ln',true);line(svg,380,70,400,70,'ln',true);
      line(svg,485,95,485,170,'ln',true);
      line(svg,400,195,380,195,'ln',true);line(svg,210,195,190,195,'ln',true);
      S('line',{x1:20,y1:140,x2:580,y2:140,stroke:'var(--neg)','stroke-dasharray':'6 4'},svg);
      words(svg,20,127,tr('loop.boundary'));
      S('path',{d:'M 20 195 H 6 V 24 H 105 V 45',fill:'none',stroke:'var(--ink2)',
        'stroke-dasharray':'4 4','marker-end':'url(#ah)'},svg);
      words(svg,20,247,tr('loop.return'));
      positions.forEach(([x,y],i)=>{
        const b=box(svg,x,y,170,50,i===step?'var(--tok)':'var(--surface)');
        if(i===step)b.setAttribute('style','fill:var(--surface);stroke:var(--tok);stroke-width:3');
        words(svg,x+85,y+30,tr('loop.stage.'+i),'middle');
      });
      let message=tr('loop.state.'+step,{proposal:tr('loop.proposal.'+(scenario==='bad'?'bad':scenario==='side'?'side':'ok'))});
      if(blocked)message=tr('loop.bad');
      else if(waiting)message=tr('loop.wait');
      else if(step===4&&scenario==='inject')message=tr('loop.inject');
      el('tool-out').textContent=tr('loop.result',{step:number(step+1),message});
      el('tool-next').disabled=blocked||step===5;
      el('tool-approval').disabled=step>=3;
    }
    function reset(){step=0;blocked=false;waiting=false;el('tool-approval').checked=false;draw();}
    el('tool-next').addEventListener('click',()=>{
      if(blocked||step===5)return;
      if(step===2&&el('tool-case').value==='side'&&!el('tool-approval').checked){waiting=true;draw();return;}
      waiting=false;step++;
      if(step===1&&el('tool-case').value==='bad')blocked=true;
      draw();
    });
    el('tool-approval').addEventListener('change',()=>{waiting=false;draw();});
    el('tool-case').addEventListener('change',reset);
    el('tool-reset').addEventListener('click',reset);draw();
  })();
})();
