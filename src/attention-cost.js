/* Cost of full attention: every pair is scored, even the ones softmax mutes. */
(function attentionCost(){
  const svg=$('ac-svg');if(!svg)return;
  const lengths=[1024,2048,4096,8192,16384,32768,65536,131072];
  const heads=32,layers=32,cell=14;
  const slider=$('ac-n'),causal=$('ac-causal'),out=$('ac-out');
  function human(bytes){
    const units=['B','KiB','MiB','GiB','TiB'];let n=bytes,i=0;
    while(n>=1024&&i<units.length-1){n/=1024;i++;}
    return L.num(n,i?1:0)+' '+units[i];
  }
  function draw(){
    const n=lengths[+slider.value],masked=causal.checked;
    const pairs=masked?n*(n+1)/2:n*n,total=pairs*heads*layers,matrix=n*n*2;
    $('ac-nv').textContent=L.num(n,0);
    Object.assign(svg.dataset,{n:String(n),causal:String(masked),pairs:String(pairs),total:String(total),matrix:String(matrix)});
    clear(svg);
    // Schematic 8x8 matrix: every cell is computed, the mask only hides the upper triangle.
    const size=8,x0=16,y0=44;
    txt(svg,x0,y0-16,L.t('ac.chart.grid'),'s');
    for(let r=0;r<size;r++)for(let c=0;c<size;c++){
      const allowed=!masked||c<=r;
      S('rect',{x:x0+c*cell,y:y0+r*cell,width:cell-1.5,height:cell-1.5,rx:1.5,
        fill:allowed?(c===r?'var(--a)':'var(--w)'):'url(#hatch)',
        style:'opacity:'+(allowed?(0.25+0.55*(1-Math.abs(r-c)/size)):1)},svg);
    }
    txt(svg,x0+size*cell+12,y0+size*cell/2-2,L.t('ac.chart.rows'),'s');
    txt(svg,x0+size*cell+12,y0+size*cell/2+12,L.t(masked?'ac.chart.masked':'ac.chart.unmasked'),'s')
      .setAttribute('style','font-size:10.5px;fill:var(--ink2)');
    // Numbers for the selected length, below the grid so they read in order.
    txt(svg,x0,y0+size*cell+30,L.t('ac.chart.pairs',{n:L.num(n,0)}),'s').setAttribute('style','font-size:11px');
    txt(svg,x0,y0+size*cell+48,L.t('ac.chart.pairsValue',{pairs:L.num(pairs,0)}),'m').setAttribute('style','font-size:12px');
    // Memory of one materialised score matrix, against an 80 GB card.
    const barY=y0+size*cell+78,cap=80*1024**3,share=Math.min(1,matrix/cap);
    txt(svg,x0,barY-10,L.t('ac.chart.memory',{head:human(matrix)}),'s').setAttribute('style','font-size:11px');
    rect(svg,x0,barY,300,16,'bg',3);
    rect(svg,x0,barY,Math.max(2,300*share),16,'bw',3);
    txt(svg,x0+306,barY+13,L.t('ac.chart.gpu',{p:L.num(share*100,share<0.01?2:1)}),'s').setAttribute('style','font-size:10.5px');
    out.innerHTML=L.t('ac.out',{n:L.num(n,0),pairs:L.num(pairs,0),total:L.num(total,0),memory:human(matrix),
      heads:heads,layers:layers,mask:L.t(masked?'ac.out.causal':'ac.out.full')});
  }
  slider.addEventListener('input',draw);causal.addEventListener('change',draw);draw();
})();
