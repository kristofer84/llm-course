"""Static curriculum/runtime contracts; uses Node, never launches a browser."""
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
page = (ROOT / "llm-kurs.html").read_text()
course = json.loads(re.search(r"window.COURSE=(.*?);</script>", page, re.S)[1])
script = "\n".join(re.findall(r"<script>(.*?)</script>", page, re.S))
# Execute quiz data and extension registration without running visualisations.
data = (ROOT / "src/jd.js").read_text() + "\n" + (ROOT / "src/quiz-groups.js").read_text()
for name in ("foundations.js", "training-lab.js", "operations-lab.js"):
    path = ROOT / "src" / name
    if path.exists():
        # Registration sections are deliberately marked for offline validation.
        text = path.read_text()
        registrations = re.findall(r"/\* CONTRACT DATA START \*/(.*?)/\* CONTRACT DATA END \*/", text, re.S)
        data += "\n" + "\n".join(registrations)

node = r"""
const assert=require('node:assert/strict');
const window={COURSE:COURSE_DATA};let store={quiz:{},answers:{},maxlv:1};const save=()=>{};
const L={t:x=>x};
RNG_DATA
QUIZ_DATA
LEARNING_DATA
const all=Object.values(QUIZ).flat();
assert.equal(new Set(all.map(q=>q.q)).size,all.length,'Question ids must be unique');
for(const [bank,questions] of Object.entries(QUIZ)){
  assert.ok(questions.length,`Empty bank ${bank}`);
  assert.ok(questions.some(q=>q.level===1),`No core checkpoint in ${bank}`);
  const slots=[0,0,0,0];
  questions.forEach((q,i)=>{
    assert.ok([1,2,3].includes(q.level),`No level: ${q.q}`);
    assert.ok(q.requires?.length,`No prerequisites: ${q.q}`);
    assert.equal(q.o.length,4);assert.equal(new Set(q.o).size,4);
    assert.ok(q.a>=0&&q.a<4);
    q.requires.forEach(t=>{
      assert.ok(Object.hasOwn(window.COURSE.slideLevels,t),`Missing lesson ${t} (${q.q})`);
      assert.ok(window.COURSE.slideLevels[t]<=q.level,`Question precedes enabled lesson: ${q.q}`);
      assert.ok(window.COURSE.lessonPositions[t]<window.COURSE.quizPositions[bank],`Lesson after checkpoint: ${q.q} -> ${t}`);
    });
    const order=questionOrder(bank,q,i,questions.length);assert.equal(new Set(order).size,4);
    slots[order.indexOf(q.a)]++;
  });
  assert.ok(Math.max(...slots)-Math.min(...slots)<=1,`Biased answer slots: ${bank} ${slots}`);
  for(const depth of [1,2,3]){
    store.maxlv=depth;
    const visible=questionSet(bank),counts=[0,0,0,0];
    visible.forEach((q,i)=>{assert.ok(q.level<=depth&&q.requires.every(t=>window.COURSE.slideLevels[t]<=depth));counts[questionOrder(bank,q,i,visible.length).indexOf(q.a)]++;});
    assert.ok(Math.max(...counts)-Math.min(...counts)<=1,`Depth-biased slots ${bank}/${depth}`);
  }
}
for(const [module,bank] of Object.entries(window.COURSE.quizForModule))assert.ok(QUIZ[bank],`Bad module mapping ${module}`);
assert.equal(Object.keys(window.COURSE.quizForModule).length,window.COURSE.mods.length-1,'Every numbered module needs a checkpoint');
// Legacy index answers migrate to durable keys, even after bank reorganisation.
const [bank,legacy]=Object.entries(window.COURSE.legacyQuiz)[0];
store={quiz:{[bank]:[1]},answers:{},maxlv:1};migrateQuizAnswers();
assert.equal(store.answers[legacy[0].q],legacy[0].o[1]);
migrateQuizAnswers();assert.equal(store.quizSchema,3);
console.log(`OK: ${all.length} questions, ${Object.keys(QUIZ).length} banks; levels, balance, mapping, migration`);
"""
node = node.replace("COURSE_DATA", json.dumps(course)).replace("QUIZ_DATA", data).replace(
    "LEARNING_DATA", (ROOT / "src/learning.js").read_text())
node = node.replace("RNG_DATA", re.search(r"function rng[^\n]+", (ROOT / "src/j0.js").read_text())[0])
result = subprocess.run(["node", "-e", node], capture_output=True, text=True)
print(result.stdout, end="")
assert result.returncode == 0, result.stderr[:5000]

# Formula/code translations must preserve visual line structure permanently.
sv, en = {}, {}
for locale, target in (("sv", sv), ("en", en)):
    for path in (ROOT / "src/i18n" / locale).glob("*.json"):
        target.update(json.loads(path.read_text()))
for key, value in sv.items():
    assert value.count("\n") == en[key].count("\n"), f"Line structure differs: {key}"
assert "Astra" not in page
assert "p5.kontext             .20" not in page
assert re.search(r'<meta name="course-revision" content="[0-9a-f]{12}">', page)
print("OK: bilingual line structure, provenance, retired references")
