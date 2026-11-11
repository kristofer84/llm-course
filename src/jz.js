/* ================= init ================= */
(function glossary(){const h=H('div',null,null,gloss);h.style.cssText='display:flex;justify-content:space-between;align-items:center';H('strong',null,'Ordlista',h);const c=H('button','ib','Stäng',h);c.addEventListener('click',closeAll);
  const f=H('input',null,null,gloss);f.type='search';f.placeholder='Sök term…';f.setAttribute('aria-label','Sök term');const dl=H('dl',null,null,gloss);
  const items=GLOSS.map(([t,dn])=>{const a=H('dt',null,t,dl),b=H('dd',null,dn,dl);return[a,b,(t+' '+dn).toLowerCase()];});
  f.addEventListener('input',()=>{const q=f.value.trim().toLowerCase();items.forEach(([a,b,s])=>{const ok=!q||s.indexOf(q)>=0;a.style.display=b.style.display=ok?'':'none';});});})();
document.querySelectorAll('.quiz').forEach(initQuiz);
const h0=fromHash();slides[0].classList.add('active');show(h0!=null?h0:0);
})();
</script>
</body>
</html>
