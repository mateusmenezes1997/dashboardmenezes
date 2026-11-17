(function(){
  const ID='gm-month-close-alert';
  const CLOSE_DAY=30;
  const CLOSE_MONTH=10;
  const CLOSE_YEAR=2026;

  function daysLeft(){
    const now=new Date();
    const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
    const close=new Date(CLOSE_YEAR,CLOSE_MONTH,CLOSE_DAY);
    return Math.ceil((close-today)/86400000);
  }
  function isDashboard(){
    const t=(document.body?.innerText||'').toLowerCase();
    return t.includes('dashboard') || t.includes('ranking');
  }
  function findAnchor(){
    const all=[...document.querySelectorAll('body *')];
    const commission=all.find(el=>{
      const tx=(el.textContent||'').trim().toLowerCase();
      return tx.length<220 && (tx.includes('fechar sua comissão') || tx.includes('fechamento de comissão'));
    });
    if(commission){
      let n=commission;
      for(let i=0;i<4 && n.parentElement;i++,n=n.parentElement){
        const r=n.getBoundingClientRect();
        if(r.width>300 && r.height>30 && r.height<220) return n;
      }
      return commission;
    }
    const headings=all.filter(el=>/^(H1|H2|H3|DIV|SPAN)$/.test(el.tagName));
    const dash=headings.find(el=>(el.textContent||'').trim().toLowerCase()==='dashboard');
    return dash?.parentElement || document.querySelector('main') || document.querySelector('[role="main"]');
  }
  function render(){
    let box=document.getElementById(ID);
    if(!isDashboard()){
      if(box) box.style.display='none';
      return;
    }
    const d=daysLeft();
    if(d<0){ if(box) box.remove(); return; }
    const alertMode=d<=3;
    const text=d===0?'FECHAMENTO DO MÊS É HOJE':d===1?'1 DIA PARA O FECHAMENTO DO MÊS':d+' DIAS PARA O FECHAMENTO DO MÊS';
    if(!box){
      box=document.createElement('div');
      box.id=ID;
      box.style.cssText='margin:10px 0 14px;padding:12px 16px;border-radius:14px;display:flex;align-items:center;justify-content:space-between;gap:14px;font-family:inherit;font-weight:800;letter-spacing:.02em;box-sizing:border-box;';
      box.innerHTML='<div style="display:flex;align-items:center;gap:10px;min-width:0"><span data-dot style="width:9px;height:9px;border-radius:50%;flex:0 0 auto"></span><span data-text></span></div><span style="font-size:12px;opacity:.82;white-space:nowrap">30/11</span>';
      const anchor=findAnchor();
      if(anchor?.parentNode){
        if((anchor.textContent||'').toLowerCase().includes('comiss')) anchor.insertAdjacentElement('afterend',box);
        else anchor.insertAdjacentElement('afterend',box);
      } else {
        (document.querySelector('main')||document.body).prepend(box);
      }
    }
    box.style.display='flex';
    box.querySelector('[data-text]').textContent=text;
    const dot=box.querySelector('[data-dot]');
    if(alertMode){
      box.style.background='rgba(245,158,11,.13)';
      box.style.border='1px solid rgba(245,158,11,.55)';
      box.style.color='#FBBF24';
      box.style.boxShadow='0 0 0 1px rgba(245,158,11,.05),0 8px 28px rgba(0,0,0,.12)';
      dot.style.background='#F59E0B';
      dot.style.boxShadow='0 0 12px rgba(245,158,11,.75)';
    } else {
      box.style.background='rgba(255,255,255,.035)';
      box.style.border='1px solid rgba(255,255,255,.11)';
      box.style.color='inherit';
      box.style.boxShadow='none';
      dot.style.background='#D4AF37';
      dot.style.boxShadow='0 0 10px rgba(212,175,55,.42)';
    }
  }
  let timer;
  function schedule(){ clearTimeout(timer); timer=setTimeout(render,120); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',render,{once:true}); else render();
  new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style']});
  window.addEventListener('popstate',schedule);
})();