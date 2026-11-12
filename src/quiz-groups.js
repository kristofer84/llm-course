/* Stable question keys allow this module split without losing old answers. */
const schedulingQuestions=new Set(['jd.m8.1.q','jd.m8.2.q','jd.m8.3.q']);
QUIZ.scheduling=QUIZ.m8.filter(q=>schedulingQuestions.has(q.q));
QUIZ.m8=QUIZ.m8.filter(q=>!schedulingQuestions.has(q.q));
