/* ================= init ================= */
(function glossary(){const h=H('div',null,null,gloss);h.style.cssText='display:flex;justify-content:space-between;align-items:center';H('strong',null,L.t('jz.4'),h);const c=H('button','ib',L.t('jz.1'),h);c.addEventListener('click',closeAll);
  const f=H('input',null,null,gloss);f.id='gloss-search';f.type='search';f.placeholder=L.t('jz.2');f.setAttribute('aria-label',L.t('jz.3'));const dl=H('dl',null,null,gloss);
  // sort by the translated term, with the active language's collation, so the
  // English glossary is alphabetical too (Swedish puts Å Ä Ö after Z)
  const translated=GLOSS.map(([t,dn])=>[L.t(t),L.t(dn)]);
  const items=[...new Map(translated.map(pair=>[pair[0].toLocaleLowerCase(L.lang),pair])).values()]
    .sort((a,b)=>a[0].localeCompare(b[0],L.lang,{sensitivity:'base'}))
    .map(([kt,kd])=>{const a=H('dt',null,kt,dl),b=H('dd',null,kd,dl);return[a,b,(kt+' '+kd).toLowerCase()];});
  f.addEventListener('input',()=>{const q=f.value.trim().toLowerCase();items.forEach(([a,b,s])=>{const ok=!q||s.indexOf(q)>=0;a.style.display=b.style.display=ok?'':'none';});});})();
if(window.L)L.apply();
applyDetailDepth();
document.querySelectorAll('.quiz').forEach(initQuiz);
initStudyTools();
const h0=fromHash();slides[0].classList.add('active');show(h0!=null?h0:0);
})();
</script>
</body>
</html>
