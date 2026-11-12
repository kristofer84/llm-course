/* CONTRACT DATA START */
GLOSS.push(
  ['fd.gloss.scalar.term','fd.gloss.scalar.def'],
  ['fd.gloss.vector.term','fd.gloss.vector.def'],
  ['fd.gloss.matrix.term','fd.gloss.matrix.def'],
  ['fd.gloss.tensor.term','fd.gloss.tensor.def'],
  ['fd.gloss.axis.term','fd.gloss.axis.def'],
  ['fd.gloss.sum.term','fd.gloss.sum.def'],
  ['fd.gloss.probability.term','fd.gloss.probability.def'],
  ['fd.gloss.parameter.term','fd.gloss.parameter.def'],
  ['fd.gloss.bandwidth.term','fd.gloss.bandwidth.def'],
  ['fd.gloss.capacity.term','fd.gloss.capacity.def'],
  ['fd.gloss.queue.term','fd.gloss.queue.def']
);
QUIZ.m1.push(
  {q:'fd.quiz.shape.q',o:['fd.quiz.shape.o1','fd.quiz.shape.o2','fd.quiz.shape.o3','fd.quiz.shape.o4'],a:1,e:'fd.quiz.shape.e',level:1,requires:['Former som passar ihop']},
  {q:'fd.quiz.state.q',o:['fd.quiz.state.o1','fd.quiz.state.o2','fd.quiz.state.o3','fd.quiz.state.o4'],a:2,e:'fd.quiz.state.e',level:1,requires:['Vad ändras vid inferens?']}
);
QUIZ.m3.push(
  {q:'fd.quiz.mix.q',o:['fd.quiz.mix.o1','fd.quiz.mix.o2','fd.quiz.mix.o3','fd.quiz.mix.o4'],a:0,e:'fd.quiz.mix.e',level:1,requires:['Paus: förutsäg attention']}
);
QUIZ.m6.push(
  {q:'fd.quiz.bandwidth.q',o:['fd.quiz.bandwidth.o1','fd.quiz.bandwidth.o2','fd.quiz.bandwidth.o3','fd.quiz.bandwidth.o4'],a:3,e:'fd.quiz.bandwidth.e',level:1,requires:['Byte, FLOP och flaskhalsar']},
  {q:'fd.quiz.batch.q',o:['fd.quiz.batch.o1','fd.quiz.batch.o2','fd.quiz.batch.o3','fd.quiz.batch.o4'],a:1,e:'fd.quiz.batch.e',level:1,requires:['Vänta, svara, gruppera']}
);
/* CONTRACT DATA END */

/* STATE MODEL START */
const STATE_DEMO=Object.freeze({rate:0.1,limit:8,examples:Object.freeze([
  Object.freeze({x:1,target:2}),Object.freeze({x:2,target:4}),Object.freeze({x:3,target:6})
])});
function stateDemoPrediction(weight,input){return input*weight;}
function stateDemoBatch(weight){
  const rows=STATE_DEMO.examples.map(({x,target})=>{
    const prediction=stateDemoPrediction(weight,x),error=prediction-target;
    return{x,target,prediction,error,loss:error*error/2};
  });
  return{weight,rows,loss:rows.reduce((sum,row)=>sum+row.loss,0)/rows.length,
    gradient:rows.reduce((sum,row)=>sum+row.x*row.error,0)/rows.length};
}
function stateDemoUpdate(weight){
  const before=stateDemoBatch(weight),delta=-STATE_DEMO.rate*before.gradient;
  return{before,after:stateDemoBatch(weight+delta),delta,rate:STATE_DEMO.rate};
}
/* STATE MODEL END */

/* Native controls stay outside SVG redraws, preserving focus and keyboard behavior. */
(function foundations(){
  function grid(svg,x,y,rows,cols,size,cls,values){
    for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
      rect(svg,x+c*size,y+r*size,size-3,size-3,cls,3);
      if(values)txt(svg,x+c*size+(size-3)/2,y+r*size+(size-3)/2+5,nf(values[r*cols+c],0),'m','middle');
    }
  }
  function label(svg,x,y,key,vars){return txt(svg,x,y,L.t(key,vars),'s','middle');}

  (function shape(){
    const svg=$('fd-shape-svg');if(!svg)return;
    const kind=$('fd-shape-kind'),ti=$('fd-shape-t'),di=$('fd-shape-d'),out=$('fd-shape-out');
    function draw(){
      clear(svg);const rank=+kind.value,t=+ti.value,d=+di.value;
      ti.disabled=rank<2;di.disabled=rank===0;
      const rows=rank<2?1:t,cols=rank===0?1:d,batches=rank===3?2:1;
      for(let b=0;b<batches;b++){
        const x=batches===2?45+b*270:Math.max(55,(560-cols*48)/2),y=55;
        const count=rows*cols;
        grid(svg,x,y,rows,cols,48,rank===0?'box':b?'bt':'ba',Array.from({length:count},(_,i)=>rank===0?7:b*count+i+1));
        if(rank===3)label(svg,x+cols*24,42,'fd.shape.table',{b:b+1});
        if(rank>0)label(svg,x+cols*24,y+rows*48+26,'fd.shape.col',{d});
        if(rank>1)txt(svg,x-8,y+rows*24,L.t('fd.shape.row',{t}),'s','end');
      }
      const dims=rank===0?[]:rank===1?[d]:rank===2?[t,d]:[2,t,d];
      out.textContent=L.t('fd.shape.out',{shape:'['+dims.join(', ')+']',axes:rank,count:rows*cols*batches});
    }
    kind.addEventListener('change',draw);ti.addEventListener('input',draw);di.addEventListener('input',draw);draw();
  })();

  (function matmul(){
    const svg=$('fd-matmul-svg');if(!svg)return;
    const ki=$('fd-matmul-k'),out=$('fd-matmul-out');
    function draw(){
      clear(svg);const k=+ki.value,ok=k===3;
      label(svg,90,40,'fd.matmul.x');label(svg,278,40,'fd.matmul.w',{k});
      grid(svg,30,70,2,3,38,'ba');grid(svg,240,70,k,2,38,'bw');
      txt(svg,185,116,'@','m','middle');
      label(svg,278,242,ok?'fd.matmul.match':'fd.matmul.mismatch',{k});
      if(ok){line(svg,335,108,390,108,'ln',true);grid(svg,415,70,2,2,38,'bt');label(svg,453,40,'fd.matmul.y');}
      else{line(svg,410,80,490,160,'ln');line(svg,490,80,410,160,'ln');}
      out.textContent=L.t(ok?'fd.matmul.valid':'fd.matmul.invalid',{k});
    }
    ki.addEventListener('change',draw);draw();
  })();

  (function sum(){
    const svg=$('fd-sum-svg');if(!svg)return;
    const pi=$('fd-sum-p'),out=$('fd-sum-out');
    function draw(){
      clear(svg);const p=+pi.value/100,q=1-p,y=p*2+q*6;
      const vals=[2,6,y],xs=[100,280,460];
      line(svg,40,200,520,200,'lnf');
      vals.forEach((v,i)=>{rect(svg,xs[i]-30,200-v*22,60,v*22,i===2?'bt':'ba',4);});
      label(svg,100,226,'fd.sum.v1');label(svg,280,226,'fd.sum.v2');label(svg,460,226,'fd.sum.y',{y:nf(y,2)});
      label(svg,100,42,'fd.sum.weight',{p:nf(p,2)});label(svg,280,42,'fd.sum.weight',{p:nf(q,2)});
      line(svg,150,100,405,100,'ln',true);
      out.textContent=L.t('fd.sum.out',{p:nf(p,2),q:nf(q,2),y:nf(y,2)});
    }
    pi.addEventListener('input',draw);draw();
  })();

  (function probability(){
    const svg=$('fd-prob-svg');if(!svg)return;
    const ai=$('fd-prob-a'),out=$('fd-prob-out');
    function draw(){
      clear(svg);const masses=[+ai.value,3,5],total=masses.reduce((a,b)=>a+b,0),ps=masses.map(v=>v/total);
      ps.forEach((p,i)=>{
        const y=32+i*76;
        txt(svg,18,y+20,L.t('fd.prob.bar',{name:['A','B','C'][i],p:nf(p*100,1)}),'s');
        rect(svg,170,y,360,30,'box',3);
        if(p>0)rect(svg,170,y,360*p,30,'ba',3);
        txt(svg,170,y+50,L.t('fd.prob.mass',{m:masses[i]}),'s');
      });
      out.textContent=L.t('fd.prob.out',{total,a:nf(ps[0],3),b:nf(ps[1],3),c:nf(ps[2],3)});
    }
    ai.addEventListener('input',draw);draw();
  })();

  (function state(){
    const svg=$('fd-state-svg');if(!svg)return;
    const xi=$('fd-state-x'),mode=$('fd-state-mode'),update=$('fd-state-update'),out=$('fd-state-out');
    const test=$('fd-state-test'),progress=$('fd-state-progress');
    let weight=1,steps=0,last=null;
    progress.max=STATE_DEMO.limit;
    function draw(){
      const training=mode.value==='training';if(training)xi.value='2';
      const x=+xi.value,prediction=stateDemoPrediction(weight,x),reference=2*x,batch=stateDemoBatch(weight);
      xi.disabled=training;update.disabled=!training||steps>=STATE_DEMO.limit;test.hidden=!training;
      $('fd-state-training').hidden=!training;
      $('fd-state-xv').textContent=nf(x,1);progress.value=steps;
      $('fd-state-input-value').textContent=nf(x,1);
      $('fd-state-weight-value').textContent=nf(weight,4);
      $('fd-state-prediction-value').textContent=nf(prediction,3);
      $('fd-state-target').textContent=L.t('fd.state.target',{target:nf(reference,2)});
      $('fd-state-hint').textContent=L.t(training?(steps>=STATE_DEMO.limit?'fd.state.done':'fd.state.trainingHint'):'fd.state.inferenceHint',{limit:STATE_DEMO.limit});
      Object.assign(svg.dataset,{weight:String(weight),input:String(x),prediction:String(prediction),reference:String(reference),
        steps:String(steps),trainingLoss:String(batch.loss),mode:mode.value});
      const rows=$('fd-state-rows');clear(rows);
      batch.rows.forEach(row=>{const tr=H('tr',null,null,rows);
        [row.x,row.target,row.prediction].forEach((value,i)=>H('td','n',nf(value,i===2?3:0),tr));});
      clear(svg);
      const modelLegend=line(svg,22,20,42,20,'ln');modelLegend.style.stroke='var(--tok)';modelLegend.setAttribute('stroke-width','3');label(svg,143,25,'fd.state.modelLine');
      const refLegend=line(svg,280,20,300,20,'ln');refLegend.style.stroke='var(--w)';refLegend.setAttribute('stroke-dasharray','4 3');
      label(svg,416,25,'fd.state.referenceLine');
      const X=value=>50+value/5*470,Y=value=>195-value/10*130;
      [2,4,6,8,10].forEach(value=>{line(svg,50,Y(value),520,Y(value),'lnf');txt(svg,42,Y(value)+4,nf(value,0),'s','end');});
      line(svg,50,195,520,195,'ln');line(svg,50,65,50,195,'ln');
      for(let value=0;value<=5;value++)txt(svg,X(value),212,nf(value,0),'s','middle');
      label(svg,285,235,'fd.state.input');txt(svg,18,61,'y','m','middle');
      const targetLine=line(svg,X(0),Y(0),X(5),Y(10),'ln');targetLine.style.stroke='var(--w)';targetLine.setAttribute('stroke-dasharray','5 4');
      const modelLine=line(svg,X(0),Y(0),X(5),Y(stateDemoPrediction(weight,5)),'ln');modelLine.style.stroke='var(--tok)';modelLine.setAttribute('stroke-width','3');
      STATE_DEMO.examples.forEach(example=>{
        const y=stateDemoPrediction(weight,example.x);
        if(training){const error=line(svg,X(example.x),Y(example.target),X(example.x),Y(y),'lnf');error.style.stroke='var(--neg)';}
        S('circle',{cx:X(example.x),cy:Y(example.target),r:5,fill:'var(--surface)',stroke:'var(--w)','stroke-width':2,opacity:training?1:.35},svg);
        S('circle',{cx:X(example.x),cy:Y(y),r:5,fill:'var(--tok)',opacity:training?1:.35},svg);
      });
      if(!training){
        line(svg,X(x),195,X(x),Y(reference),'lnf').setAttribute('stroke-dasharray','3 3');
        S('circle',{cx:X(x),cy:Y(reference),r:7,fill:'var(--surface)',stroke:'var(--w)','stroke-width':2},svg);
        S('circle',{cx:X(x),cy:Y(prediction),r:7,fill:'var(--a)'},svg);
      }
      out.textContent=training?L.t('fd.state.trainingOut',{steps,limit:STATE_DEMO.limit,w:nf(weight,4),loss:nf(batch.loss,6)})
        +(steps>=STATE_DEMO.limit?' '+L.t('fd.state.done'):'')
        :L.t('fd.state.out',{x:nf(x,1),y:nf(prediction,3),target:nf(reference,3),error:nf(prediction-reference,4),w:nf(weight,4)});
      $('fd-state-change').textContent=last?L.t('fd.state.lastChange',{beforeW:nf(last.before.weight,4),afterW:nf(last.after.weight,4),
        beforeLoss:nf(last.before.loss,6),afterLoss:nf(last.after.loss,6)}):L.t('fd.state.noTraining');
      $('fd-state-math-last').textContent=last?L.t('fd.state.mathLast',{gradient:nf(last.before.gradient,4),rate:nf(last.rate,1),delta:nf(last.delta,4)}):L.t('fd.state.noTraining');
      const probe=$('fd-state-probe');probe.hidden=training;
      probe.textContent=L.t(STATE_DEMO.examples.some(example=>example.x===x)?'fd.state.probeKnown':'fd.state.probeNew');
    }
    update.addEventListener('click',()=>{
      if(mode.value!=='training'||steps>=STATE_DEMO.limit)return;
      last=stateDemoUpdate(weight);weight=last.after.weight;steps++;draw();
    });
    test.addEventListener('click',()=>{mode.value='inference';draw();});
    $('fd-state-reset').addEventListener('click',()=>{weight=1;steps=0;last=null;mode.value='training';xi.value='2';draw();});
    xi.addEventListener('input',draw);mode.addEventListener('change',draw);draw();
  })();

  (function attentionCheckpoint(){
    const svg=$('fd-attcheck-svg');if(!svg)return;
    const pi=$('fd-attcheck-p'),reveal=$('fd-attcheck-reveal'),out=$('fd-attcheck-out');
    function draw(){
      clear(svg);const p=+pi.value/100,q=1-p,a=2*p,b=4*q,open=reveal.open;
      pi.disabled=!open;
      const vectors=[[2,0],[0,4]];if(open)vectors.push([a,b]);
      vectors.forEach((v,i)=>{
        const x=25+i*185;
        label(svg,x+75,36,'fd.attcheck.vector',{name:['v₁','v₂','y'][i],a:nf(v[0],2),b:nf(v[1],2)});
        v.forEach((value,j)=>{
          rect(svg,x+j*70,200-4*32,55,4*32,'box',3);
          if(value>0)rect(svg,x+j*70,200-value*32,55,value*32,i===2?'bt':'ba',3);
          txt(svg,x+j*70+27,225,nf(value,2),'m','middle');
        });
      });
      if(!open)label(svg,280,254,'fd.attcheck.hidden');
      out.textContent=L.t(open?'fd.attcheck.out':'fd.attcheck.hidden',{p:nf(p,2),q:nf(q,2),a:nf(a,2),b:nf(b,2)});
    }
    pi.addEventListener('input',draw);reveal.addEventListener('toggle',draw);draw();
  })();

  (function mlpCheckpoint(){
    const svg=$('fd-mlpcheck-svg');if(!svg)return;
    const ti=$('fd-mlpcheck-t'),reveal=$('fd-mlpcheck-reveal'),out=$('fd-mlpcheck-out');
    function draw(){
      clear(svg);const t=+ti.value,open=reveal.open;
      grid(svg,20,65,t,3,25,'ba');label(svg,57,38,'fd.mlpcheck.input',{t});
      if(open){
        line(svg,103,110,180,110,'ln',true);
        grid(svg,200,65,t,5,25,'bw');label(svg,262,38,'fd.mlpcheck.mid',{t});
        line(svg,335,110,415,110,'ln',true);
        grid(svg,440,65,t,3,25,'bt');label(svg,477,38,'fd.mlpcheck.output',{t});
      }else label(svg,280,225,'fd.attcheck.hidden');
      out.textContent=L.t(open?'fd.mlpcheck.out':'fd.attcheck.hidden',{t});
    }
    ti.addEventListener('input',draw);reveal.addEventListener('toggle',draw);draw();
  })();

  (function parallel(){
    const svg=$('fd-parallel-svg');if(!svg)return;
    const li=$('fd-parallel-lanes'),out=$('fd-parallel-out');
    function draw(){
      clear(svg);const lanes=+li.value,waves=8/lanes;
      for(let i=0;i<8;i++){
        const lane=i%lanes,time=Math.floor(i/lanes),x=65+time*56,y=30+lane*27;
        rect(svg,x,y,51,23,'ba',3);txt(svg,x+25,y+16,nf(i+1,0),'s','middle');
      }
      for(let lane=0;lane<lanes;lane++)txt(svg,45,47+lane*27,L.t('fd.parallel.worker',{n:lane+1}),'s','end');
      line(svg,65,258,513,258,'ln');
      for(let i=0;i<=8;i++)txt(svg,65+i*56,277,nf(i,0),'s','middle');
      txt(svg,520,250,L.t('fd.parallel.time'),'s','end');
      out.textContent=L.t('fd.parallel.out',{lanes,waves,time:waves});
    }
    li.addEventListener('change',draw);draw();
  })();

  (function units(){
    const svg=$('fd-units-svg');if(!svg)return;
    const bi=$('fd-units-bw'),fi=$('fd-units-fl'),out=$('fd-units-out');
    function draw(){
      clear(svg);const bw=+bi.value,fl=+fi.value,mem=6000/bw,compute=120/fl,bound=Math.max(mem,compute);
      const equal=Math.abs(mem-compute)<1e-8,limit=L.t(equal?'fd.units.both':mem>compute?'fd.units.memlimit':'fd.units.floplimit');
      [mem,compute].forEach((v,i)=>{
        const y=45+i*100;
        txt(svg,15,y-12,L.t(i?'fd.units.arithmetic':'fd.units.memory'),'s');
        rect(svg,15,y,420,36,'box',3);rect(svg,15,y,v/120*420,36,i?'bw':'ba',3);
        txt(svg,450,y+24,L.t('fd.units.ms',{n:nf(v,1)}),'m');
      });
      out.textContent=L.t('fd.units.out',{bw,fl,mem:nf(mem,1),compute:nf(compute,1),bound:nf(bound,1),limit});
    }
    bi.addEventListener('input',draw);fi.addEventListener('input',draw);draw();
  })();

  (function queue(){
    const svg=$('fd-queue-svg');if(!svg)return;
    const bi=$('fd-queue-b'),wi=$('fd-queue-w'),out=$('fd-queue-out');
    function draw(){
      clear(svg);const batch=+bi.value,wait=+wi.value,service=20+5*batch,waves=8/batch,last=wait+waves*service,first=wait+service;
      const X=t=>55+t/260*480;
      for(let i=0;i<8;i++){
        const start=wait+Math.floor(i/batch)*service,end=start+service,y=30+i*28;
        txt(svg,38,y+16,nf(i+1,0),'s','end');
        line(svg,X(0),y+10,X(start),y+10,'lnf');
        rect(svg,X(start),y,X(end)-X(start)-1,21,Math.floor(i/batch)%2?'bt':'ba',3);
      }
      line(svg,X(0),270,X(260),270,'ln');
      [0,50,100,150,200,250].forEach(t=>txt(svg,X(t),290,nf(t,0),'s','middle'));
      txt(svg,535,313,L.t('fd.queue.time'),'s','end');
      out.textContent=L.t('fd.queue.out',{first,last,queue:last-service,service,seconds:nf(last/1000,3),rate:nf(8000/last,1)});
    }
    bi.addEventListener('change',draw);wi.addEventListener('input',draw);draw();
  })();
})();
