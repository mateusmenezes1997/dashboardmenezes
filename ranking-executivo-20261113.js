/* Gestão Menezes — Exportação executiva do ranking (v3, 13/11/2026).
   Sem bibliotecas externas. Mantém o formato de retorno do exportador original
   para download manual, geração automática e compartilhamento de imagem. */
(function(){
  'use strict';
  if (window.__gmExecutiveRankV4) return;
  window.__gmExecutiveRankV3 = true;
  const VERSION = 'exec-rank-v4-20261113';
  const W = 1240, PAD = 46, INNER = W - PAD * 2;
  const GOLD = '#e9c477', GOLD2 = '#b98843', WHITE = '#f9f7f4';
  const SILVER = '#d8e0ed', BRONZE = '#dfa77d';
  const MON = ['JANEIRO','FEVEREIRO','MARÇO','ABRIL','MAIO','JUNHO','JULHO','AGOSTO','SETEMBRO','OUTUBRO','NOVEMBRO','DEZEMBRO'];
  const money = n => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(n)||0);
  const integer = n => new Intl.NumberFormat('pt-BR').format(Math.max(0,Number(n)||0));
  function getData(){
    let d = null;
    try { if(typeof rankCardData === 'function') d = rankCardData(); } catch(e){ console.warn('Ranking principal indisponível',e); }
    const selected = document.getElementById('monthFilter')?.value || new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'}).slice(0,7);
    let m = d?.m || selected, rows = [];
    if(d && Array.isArray(d.rows)){
      rows = d.rows.map(r=>({name:String(r.name||'Consultor'),total:Number(r.total)||0,qty:Number(r.qty)||0,launches:Number(r.launches)||0})).filter(r=>r.total>0);
    }else{
      // Fallback para contextos em que o exportador original não é exposto globalmente.
      let s = null;
      try { s = typeof state !== 'undefined' ? state : window.state; } catch(_){ s=window.state; }
      if(s && Array.isArray(s.consultants)){
        rows = s.consultants.map(c=>{
          const opening = c.monthOpenings?.[m] || {};
          const sales = (s.sales||[]).filter(x=>x.consultantId===c.id && String(x.date||'').slice(0,7)===m);
          return {name:String(c.name||'Consultor'),total:(Number(opening.total)||0)+sales.reduce((a,x)=>a+(Number(x.amount)||0),0),qty:(Number(opening.qty)||0)+sales.reduce((a,x)=>a+(Number(x.qty)||1),0),launches:sales.length};
        }).filter(r=>r.total>0);
      }
    }
    rows.sort((a,b)=>b.total-a.total || a.name.localeCompare(b.name,'pt-BR'));
    const sum = rows.reduce((a,x)=>a+x.total,0);
    return {m,rows,total:Math.max(sum,Number(d?.total)||0)};
  }
  function rgba(hex,a){
    const h=hex.replace('#','');
    return 'rgba('+parseInt(h.slice(0,2),16)+','+parseInt(h.slice(2,4),16)+','+parseInt(h.slice(4,6),16)+','+a+')';
  }
  function rr(c,x,y,w,h,r,fill,stroke,sw=1){
    r=Math.max(0,Math.min(r,w/2,h/2));
    c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);
    c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();
    if(fill){c.fillStyle=fill;c.fill();}
    if(stroke){c.lineWidth=sw;c.strokeStyle=stroke;c.stroke();}
  }
  function grad(c,x1,y1,x2,y2,stops){
    const g=c.createLinearGradient(x1,y1,x2,y2);
    stops.forEach(([at,col])=>g.addColorStop(at,col));
    return g;
  }
  function write(c,str,x,y,size,color=WHITE,weight=700,max=9999,align='left'){
    c.fillStyle=color;c.textAlign=align;c.textBaseline='alphabetic';
    c.font=weight+' '+size+'px "Arial",system-ui,sans-serif';
    let s=String(str==null?'':str);
    while(c.measureText(s).width>max && s.length>2)s=s.slice(0,-2)+'…';
    c.fillText(s,x,y);
    return s;
  }
  function crown(c,cx,cy,sz){
    c.save();c.translate(cx,cy);c.scale(sz/74,sz/74);
    c.shadowColor='rgba(244,198,96,.28)';c.shadowBlur=22;
    c.fillStyle=grad(c,0,-35,0,28,[[0,'#fff0b8'],[0.55,'#edc36d'],[1,'#a56d1e']]);
    c.beginPath();c.moveTo(-34,-17);c.lineTo(-21,1);c.lineTo(0,-24);c.lineTo(21,1);
    c.lineTo(34,-17);c.lineTo(28,22);c.lineTo(-28,22);c.closePath();c.fill();
    rr(c,-30,23,60,7,2,'#eac57a');
    c.shadowBlur=0;c.fillStyle='#fff3d8';
    [[-34,-19],[0,-26],[34,-19]].forEach(([x,y])=>{c.beginPath();c.arc(x,y,4,0,Math.PI*2);c.fill();});
    c.restore();
  }
  function bar(c,x,y,w,h,p,color){
    rr(c,x,y,w,h,h/2,'rgba(255,255,255,.10)');
    if(p>0){const ww=Math.max(h,Math.min(w,w*p));rr(c,x,y,ww,h,h/2,grad(c,x,y,x+w,y,[[0,color],[1,'#f4daaa']]));}
  }
  function smallLabel(c,str,x,y,color='#aeb0b7',max=9999,align='left'){
    return write(c,str,x,y,15,color,800,max,align);
  }
  function drawBg(c,H){
    c.fillStyle=grad(c,0,0,W,H,[[0,'#0b090c'],[0.5,'#100c10'],[1,'#09080b']]);
    c.fillRect(0,0,W,H);
    const aura=c.createRadialGradient(W-20,65,0,W-20,65,780);
    aura.addColorStop(0,'rgba(113,16,47,.25)');aura.addColorStop(1,'rgba(113,16,47,0)');
    c.fillStyle=aura;c.fillRect(0,0,W,740);
    const base=c.createRadialGradient(35,H-30,0,35,H-30,610);
    base.addColorStop(0,'rgba(90,14,41,.21)');base.addColorStop(1,'rgba(90,14,41,0)');
    c.fillStyle=base;c.fillRect(0,H-680,800,680);
    c.strokeStyle='rgba(185,113,59,.19)';c.lineWidth=1.5;
    c.beginPath();c.moveTo(535,0);c.bezierCurveTo(760,55,860,180,W,120);c.stroke();
    c.beginPath();c.moveTo(690,0);c.bezierCurveTo(880,135,1080,190,W,158);c.stroke();
    c.beginPath();c.moveTo(0,H-75);c.bezierCurveTo(310,H-205,745,H-80,W,H-168);c.stroke();
  }
  function drawHero(c,d){
    const match=String(d.m||'').match(/^(\d{4})-(\d{2})$/);
    const date=match?(MON[Number(match[2])-1]||'')+' '+match[1]:'MÊS SELECIONADO';
    const slash=grad(c,58,27,138,89,[[0,'#fff1b0'],[1,'#a67024']]);
    c.fillStyle=slash;
    c.beginPath();c.moveTo(68,44);c.lineTo(99,18);c.lineTo(116,18);c.lineTo(85,44);c.closePath();c.fill();
    c.beginPath();c.moveTo(92,64);c.lineTo(123,38);c.lineTo(139,38);c.lineTo(108,64);c.closePath();c.fill();
    c.fillStyle='rgba(229,190,119,.52)';c.fillRect(153,20,2,66);
    write(c,'GESTÃO MENEZES',174,49,32,GOLD,900,625);
    smallLabel(c,'P E R F O R M A N C E   C O M E R C I A L',174,78,'#c8bfc5');
    c.fillStyle=grad(c,PAD,120,PAD+9,120,[[0,'#edcc86'],[1,'#b38b47']]);
    rr(c,PAD,111,8,118,4,c.fillStyle);
    write(c,'RANKING',PAD+28,171,72,WHITE,900,975);
    write(c,'DOS CAMPEÕES',PAD+28,237,56,GOLD,900,1070);
    smallLabel(c,date+'   •   '+integer(d.rows.length)+' CONSULTORES COM VENDAS',PAD+31,279,'#dfd7d7',1040);
  }
  function drawSummary(c,d){
    const y=303,h=110;
    rr(c,PAD,y,INNER,h,19,grad(c,PAD,y,W-PAD,y+h,[[0,'#1c1416'],[0.7,'#171318'],[1,'#171115']]),'rgba(212,165,88,.52)',1.6);
    const starts=[PAD+32,PAD+419,PAD+795];
    smallLabel(c,'VOLUME DA GESTÃO',starts[0],y+29,GOLD);
    write(c,money(d.total),starts[0],y+72,34,WHITE,900,360);
    smallLabel(c,'META DA GESTÃO',starts[1],y+29,'#c3b9b4');
    write(c,money(15000000),starts[1],y+72,33,WHITE,900,365);
    smallLabel(c,'META ATINGIDA',starts[2],y+29,'#c3b9b4');
    const ratio=Math.max(0,d.total/15000000),pct=Math.min(100,ratio*100);
    write(c,pct.toLocaleString('pt-BR',{maximumFractionDigits:1})+'%',starts[2],y+75,45,GOLD,900,300);
    c.fillStyle='rgba(240,210,170,.17)';
    c.fillRect(PAD+394,y+22,1,65);c.fillRect(PAD+773,y+22,1,65);
    bar(c,PAD+31,y+95,INNER-62,6,Math.min(1,ratio),GOLD2);
  }
  function drawFirst(c,r){
    const x=PAD,y=434,w=INNER,h=180;
    c.save();c.shadowColor='rgba(188,126,54,.12)';c.shadowBlur=15;
    rr(c,x,y,w,h,23,grad(c,x,y,x+w,y+h,[[0,'#420b1a'],[0.55,'#2b0e16'],[1,'#251116']]),'rgba(234,191,113,.86)',2.3);
    c.restore();
    rr(c,x+2,y+2,w-4,4,2,'rgba(231,191,110,.7)');
    crown(c,x+94,y+70,78);
    c.fillStyle='rgba(233,196,119,.27)';
    c.fillRect(x+179,y+22,1,100);c.fillRect(x+770,y+30,1,86);
    smallLabel(c,'LÍDER DO MÊS',x+210,y+42,GOLD);
    write(c,r.name.toUpperCase(),x+210,y+95,38,WHITE,900,550);
    smallLabel(c,'CRÉDITO COMERCIALIZADO',x+w-32,y+40,'#ead9c5',420,'right');
    write(c,money(r.total),x+w-30,y+94,42,GOLD,900,335,'right');
    c.fillStyle='rgba(229,189,110,.23)';c.fillRect(x+29,y+124,w-58,1);
    smallLabel(c,integer(r.qty)+' '+(r.qty===1?'COTA':'COTAS')+'   •   '+integer(r.launches)+' '+(r.launches===1?'LANÇAMENTO':'LANÇAMENTOS'),x+32,y+149,'#ecdbd4');
    write(c,(Math.min(1,r.total/5000000)*100).toLocaleString('pt-BR',{maximumFractionDigits:1})+'% DA META DE 5MM',x+w-32,y+149,16,'#ead0a0',800,330,'right');
    bar(c,x+30,y+163,w-60,6,Math.min(1,r.total/5000000),GOLD2);
  }
  function drawPodium(c,index,r){
    const y=635,h=164,gap=18,w=(INNER-gap)/2,x=PAD+(index-1)*(w+gap);
    const accent=index===1?SILVER:BRONZE;
    const fill=index===1?
      grad(c,x,y,x+w,y+h,[[0,'#26272c'],[1,'#151619']]):
      grad(c,x,y,x+w,y+h,[[0,'#38251f'],[1,'#211818']]);
    rr(c,x,y,w,h,20,fill,rgba(accent,.60),1.8);
    c.strokeStyle=rgba(accent,.43);c.lineWidth=2.5;
    c.beginPath();c.arc(x+91,y+72,42,Math.PI*.25,Math.PI*1.75);c.stroke();
    write(c,String(index+1)+'º',x+91,y+88,48,accent,900,95,'center');
    c.fillStyle=rgba(accent,.33);c.fillRect(x+163,y+20,1,117);
    smallLabel(c,index===1?'VICE-LIDERANÇA':'TERCEIRO LUGAR',x+182,y+33,accent);
    write(c,r.name.toUpperCase(),x+182,y+64,25,WHITE,900,w-207);
    write(c,money(r.total),x+182,y+112,32,accent,900,w-210);
    c.fillStyle=rgba(accent,.19);c.fillRect(x+19,y+129,w-38,1);
    smallLabel(c,integer(r.qty)+' '+(r.qty===1?'COTA':'COTAS')+'   •   '+integer(r.launches)+' '+(r.launches===1?'LANÇAMENTO':'LANÇAMENTOS'),x+22,y+150,'#d4c9c6',w-180);
    bar(c,x+w-157,y+143,131,5,Math.min(1,r.total/5000000),accent);
  }
  function drawList(c,rows){
    const start=867,step=66,x=PAD,w=INNER;
    smallLabel(c,'POS.',x+18,841,'#bcb5b7');
    smallLabel(c,'CONSULTOR(A)',x+125,841,'#bcb5b7');
    smallLabel(c,'COTAS',x+632,841,'#bcb5b7');
    smallLabel(c,'LANÇAMENTOS',x+785,841,'#bcb5b7');
    smallLabel(c,'CRÉDITO COMERCIALIZADO',x+w-20,841,'#bcb5b7',340,'right');
    rows.slice(3).forEach((r,k)=>{
      const i=k+3,y=start+k*step;
      rr(c,x,y,w,60,13,k%2===0?'#181318':'#1b1419','rgba(214,172,102,.28)',1);
      rr(c,x+16,y+10,66,40,10,'rgba(184,130,55,.11)','rgba(221,180,98,.55)');
      write(c,String(i+1).padStart(2,'0')+'º',x+49,y+39,23,GOLD,900,61,'center');
      write(c,r.name.toUpperCase(),x+103,y+26,24,WHITE,800,390);
      bar(c,x+105,y+43,345,4,Math.min(1,r.total/5000000),GOLD2);
      c.fillStyle='rgba(214,178,104,.17)';
      c.fillRect(x+577,y+13,1,33);c.fillRect(x+722,y+13,1,33);c.fillRect(x+870,y+13,1,33);
      write(c,integer(r.qty),x+657,y+39,24,'#e7ddd6',800,100,'center');
      write(c,integer(r.launches),x+793,y+39,24,'#e7ddd6',800,110,'center');
      write(c,money(r.total),x+w-20,y+39,27,GOLD,900,267,'right');
    });
  }
  function render(){
    const d=getData();
    if(!d.rows.length)throw new Error('Nenhum consultor com vendas no período selecionado.');
    const extra=Math.max(0,d.rows.length-3);
    const H=867+extra*66+168;
    const scale=Math.max(.3,Math.min(2,Math.sqrt(14500000/(W*H)),16000/H));
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.floor(W*scale));
    canvas.height=Math.max(1,Math.floor(H*scale));
    const c=canvas.getContext('2d');
    if(!c)throw new Error('Seu navegador não conseguiu gerar a imagem.');
    c.scale(canvas.width/W,canvas.height/H);
    drawBg(c,H);drawHero(c,d);drawSummary(c,d);
    drawFirst(c,d.rows[0]);
    if(d.rows[1])drawPodium(c,1,d.rows[1]);
    if(d.rows[2])drawPodium(c,2,d.rows[2]);
    drawList(c,d.rows);
    const fy=H-143;
    rr(c,PAD,fy,INNER,108,18,grad(c,PAD,fy,W-PAD,fy+108,[[0,'#21161a'],[1,'#171116']]),'rgba(222,173,92,.50)',1.7);
    smallLabel(c,'GESTÃO MENEZES  •  RESULTADOS REGISTRADOS NO DASHBOARD',PAD+30,fy+39,GOLD,645);
    write(c,integer(d.rows.length)+' VENDEDORES COM VENDAS',PAD+30,fy+73,20,WHITE,800,510);
    c.fillStyle='rgba(225,184,108,.23)';c.fillRect(PAD+670,fy+20,1,66);
    smallLabel(c,'TOTAL DA GESTÃO',W-PAD-29,fy+34,'#cdbb9a',360,'right');
    write(c,money(d.total),W-PAD-29,fy+78,36,GOLD,900,426,'right');
    const filename='ranking-gestao-menezes-'+d.m+'-premium-completo.png';
    return {canvas,filename,month:d.m};
  }
  function premiumExport(auto=false,returnCanvas=false){
    let result;
    try{result=render();}
    catch(e){console.error('Gestão Menezes: erro no ranking executivo',e);if(!auto)alert(e.message||'Não foi possível gerar o ranking.');return null;}
    if(returnCanvas)return {...result,filename:result.filename.replace('.png',auto?'-automatico.png':'.png')};
    const btn=document.getElementById('exportRankCard');
    const previous=btn?.textContent;
    if(btn&&!auto){btn.disabled=true;btn.textContent='Preparando PNG executivo...';}
    const restore=()=>{if(btn&&!auto){btn.disabled=false;btn.textContent=previous||'Baixar ranking';}};
    try {
      result.canvas.toBlob(function(blob){
        try {
          if(!blob)throw new Error('Não foi possível gerar o PNG.');
          const url=URL.createObjectURL(blob),a=document.createElement('a');
          a.href=url;a.download=auto?result.filename.replace('.png','-automatico.png'):result.filename;
          document.body.appendChild(a);a.click();
          setTimeout(()=>{a.remove();URL.revokeObjectURL(url);},3000);
        }catch(e){console.error(e);if(!auto)alert('Não foi possível baixar o PNG.');}
        finally{restore();}
      },'image/png');
    }catch(e){restore();console.error(e);if(!auto)alert('Não foi possível baixar o ranking.');}
    return result;
  }
  function captureClick(e){
    if(e.defaultPrevented)return;
    const b=e.target?.closest?.('button,a,[role="button"]');
    if(!b)return;
    const label=((b.textContent||'')+' '+(b.getAttribute('aria-label')||'')+' '+(b.getAttribute('title')||'')).trim().toLocaleLowerCase('pt-BR');
    const explicit=b.id==='exportRankCard'||b.id==='downloadRanking'||b.id==='downloadRankingBtn';
    const button=(/ranking/.test(label)&&/(baixar|exportar|download|salvar|gerar)/.test(label));
    if(!explicit&&!button)return;
    if(/whatsapp|compartilhar/.test(label))return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    premiumExport(false,false);
  }
  function install(){
    if(window.exportRankingCard!==premiumExport)window.exportRankingCard=premiumExport;
  }
  document.addEventListener('click',captureClick,true);
  install();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  window.addEventListener('load',install,{once:true});
  setTimeout(install,1100);
  // A função original continua sendo chamada pelo fluxo automático depois de salvar vendas.
  // Não adicionamos um segundo listener de vendas para evitar baixar PNG em duplicidade.
  window.gmExportarRankingExecutivo=premiumExport;
  window.gmRankingVersion='premium-v4-20261113';
  console.info('Gestão Menezes: exportador premium ativo '+VERSION);
})();