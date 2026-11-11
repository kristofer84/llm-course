/* ================= init ================= */
(function glossary(){const h=H('div',null,null,gloss);h.style.cssText='display:flex;justify-content:space-between;align-items:center';H('strong',null,L.t('jz.4'),h);const c=H('button','ib',L.t('jz.1'),h);c.addEventListener('click',closeAll);
  const f=H('input',null,null,gloss);f.type='search';f.placeholder=L.t('jz.2');f.setAttribute('aria-label',L.t('jz.3'));const dl=H('dl',null,null,gloss);
  const items=GLOSS.map(([t,dn])=>{const kt=L.t(t),kd=L.t(dn);const a=H('dt',null,kt,dl),b=H('dd',null,kd,dl);return[a,b,(kt+' '+kd).toLowerCase()];});
  f.addEventListener('input',()=>{const q=f.value.trim().toLowerCase();items.forEach(([a,b,s])=>{const ok=!q||s.indexOf(q)>=0;a.style.display=b.style.display=ok?'':'none';});});})();
document.querySelectorAll('.quiz').forEach(initQuiz);
const h0=fromHash();slides[0].classList.add('active');show(h0!=null?h0:0);
})();
if(window.L)L.apply();
</script>
</body>
</html>
