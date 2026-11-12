/* Stable assessment identities and depth-aware consolidation. */
function migrateQuizAnswers(){
  if(store.quizSchema===3)return;
  store.answers=store.answers&&typeof store.answers==='object'?store.answers:{};
  const legacy=window.COURSE.legacyQuiz||{};
  Object.entries(legacy).forEach(([bank,questions])=>questions.forEach((q,i)=>{
    const old=(store.quiz[bank]||[])[i];
    if(Number.isInteger(old)&&q.o[old]&&store.answers[q.q]==null)store.answers[q.q]=q.o[old];
  }));
  store.quizSchema=3;save();
}
function questionSet(id){
  return (QUIZ[id]||[]).filter(q=>(q.level||1)<=store.maxlv&&(q.requires||[]).every(t=>
    (window.COURSE.slideLevels[t]||1)<=store.maxlv));
}
function questionAnswered(q){return store.answers&&q.o.includes(store.answers[q.q]);}
function questionCorrect(q){return questionAnswered(q)&&store.answers[q.q]===q.o[q.a];}
function questionOrder(id,q,i,total=questionSet(id).length){
  // Balance visible answer slots at the selected depth, then shuffle the slot
  // sequence as well as distractors. Never expose a predictable A/B/C/D cycle.
  // Stable identities, not screen positions, are persisted across languages.
  const hash=[...id].reduce((h,c)=>h*31+c.charCodeAt(0),7)>>>0;
  const random=rng(977+i*131+hash),slotRandom=rng(hash+total*17);
  const slots=Array.from({length:total},(_,n)=>(n+hash)%4);
  for(let z=slots.length-1;z>0;z--){const j=Math.floor(slotRandom()*(z+1));[slots[z],slots[j]]=[slots[j],slots[z]];}
  const correctSlot=slots[i];
  const other=[0,1,2,3].filter(k=>k!==q.a);
  for(let z=other.length-1;z>0;z--){const j=Math.floor(random()*(z+1));[other[z],other[j]]=[other[j],other[z]];}
  other.splice(correctSlot,0,q.a);return other;
}
function applyDetailDepth(){
  document.querySelectorAll('[data-detail-level]').forEach(el=>{
    el.hidden=+el.dataset.detailLevel>store.maxlv;
  });
}
function setDepth(value){
  store.maxlv=value;save();applyDetailDepth();
  document.querySelectorAll('.quiz').forEach(initQuiz);
  let next=cur;
  if(LV[next]>value){while(next>0&&LV[next]>value)next--;}
  show(next);renderMap();
}
function initQuiz(el){
  migrateQuizAnswers();const id=el.dataset.quiz,qs=questionSet(id);clear(el);
  const scoreBox=H('div','qscore',null,el),scoreLabel=H('span',null,null,scoreBox);
  const reset=H('button','btn',L.t('j0.9'),scoreBox);
  reset.addEventListener('click',()=>{qs.forEach(q=>delete store.answers[q.q]);save();initQuiz(el);});
  function score(){const ok=qs.filter(questionCorrect).length,done=qs.filter(questionAnswered).length;
    scoreLabel.textContent=L.t('j0.16',{ok,n:qs.length})+(done<qs.length?' '+L.t('j0.17',{left:qs.length-done}):' '+L.t(ok===qs.length?'j0.10':'j0.11'));
  }
  if(!qs.length)H('p','note',L.t('learning.quiz.empty'),el);
  qs.forEach((q,i)=>{
    const card=H('div','qq',null,el);card.dataset.question=q.q;card.dataset.questionLevel=q.level||1;
    H('p','qt',L.t('quiz.numbered',{n:i+1,q:L.t(q.q)}),card);
    const opts=H('div','opts',null,card),buttons=[];
    questionOrder(id,q,i,qs.length).forEach(k=>{
      const b=H('button','opt',L.t(q.o[k]),opts);b.dataset.option=q.o[k];buttons[k]=b;
      b.addEventListener('click',()=>{
        if(questionAnswered(q))return;store.answers[q.q]=q.o[k];save();mark();score();
      });
    });
    const explanation=H('p','ex',null,card);
    function mark(){
      if(!questionAnswered(q))return;card.classList.add('done');
      buttons.forEach((b,k)=>{b.disabled=true;if(k===q.a)b.classList.add('right');else if(b.dataset.option===store.answers[q.q])b.classList.add('wrong');});
      explanation.textContent=L.t(questionCorrect(q)?'j0.12':'j0.18')+L.t(q.e);
    }
    mark();
  });score();
}
