/* Gestão Menezes — Exportação executiva do ranking (v3, 13/11/2026).
   Sem bibliotecas externas. Mantém o formato de retorno do exportador original
   para download manual, geração automática e compartilhamento de imagem. */
(function(){
  'use strict';
  if (window.__gmExecutiveRankV3) return;
  window.__gmExecutiveRankV3 = true;
  const VERSION = 'exec-rank-v3-20261113';
  const W = 1240, PAD = 64, INNER = W - PAD * 2;
  const GOLD = '#efd08e', GOLD2 = '#c9933d', WHITE = '#fbf8f5';
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
    c.fillStyle=grad(c,0,0,W,H,[[0,'#0b0b11'],[0.47,'#170e18'],[1,'#080a0f']]);
    c.fillRect(0,0,W,H);
    let g=c.createRadialGradient(W-180,0,5,W-180,0,580);
    g.addColorStop(0,'rgba(135,36,70,.29)');g.addColorStop(1,'rgba(135,36,70,0)');
    c.fillStyle=g;c.fillRect(0,0,W,680);
    g=c.createRadialGradient(45,750,0,45,750,640);
    g.addColorStop(0,'rgba(167,118,43,.10)');g.addColorStop(1,'rgba(167,118,43,0)');
    c.fillStyle=g;c.fillRect(0,320,750,1000);
    c.fillStyle='rgba(231,181,98,.13)';
    for(let y=0;y<H;y+=82)c.fillRect(PAD,y,INNER,1);
    // A lateral é um acento editorial, não uma borda pesada.
    c.fillStyle=grad(c,PAD,0,PAD,H,[[0,'#f0cd81'],[0.4,'rgba(240,205,129,.05)'],[1,'rgba(240,205,129,0)']]);
    c.fillRect(PAD-15,90,2,H-175);
  }
  function drawHero(c,d){
    const m=String(d.m||'').match(/^(\d{4})-(\d{2})$/);
    const label=m?(MON[Number(m[2])-1]||'')+' '+m[1]:'RESULTADOS DO MÊS';
    c.fillStyle=grad(c,PAD,48,PAD+104,48,[[0,GOLD],[1,'#a76a2c']]);
    rr(c,PAD,48,104,6,3,c.fillStyle);
    smallLabel(c,'GESTÃO MENEZES   /   PERFORMANCE COMERCIAL',PAD,104,GOLD,815);
    rr(c,970,70,204,38,19,'rgba(236,198,123,.09)','rgba(236,198,123,.32)',1);
    write(c,'EDIÇÃO EXECUTIVA',1072,94,14,GOLD,800,185,'center');
    write(c,'RANKING',PAD,185,79,WHITE,900,870);
    write(c,'DOS CAMPEÕES',PAD,244,51,'#e3bf80',900,950);
    write(c,label+'   •   '+integer(d.rows.length)+' CONSULTORES COM VENDAS',PAD,284,19,'#bcb4b9',700,1090);
    c.fillStyle=grad(c,PAD,305,W-PAD,305,[[0,'rgba(239,208,142,.9)'],[0.5,'rgba(239,208,142,.23)'],[1,'rgba(239,208,142,0)']]);
    c.fillRect(PAD,306,INNER,2);
  }
  function drawSummary(c,d){
    const y=334,h=128;
    rr(c,PAD,y,INNER,h,19,grad(c,PAD,y,W-PAD,y+h,[[0,'#1f171f'],[1,'#14131a']]),'rgba(222,183,116,.25)');
    const cols=[PAD+28,PAD+430,PAD+812];
    smallLabel(c,'VOLUME DA GESTÃO',cols[0],y+31,GOLD);
    write(c,money(d.total),cols[0],y+76,39,WHITE,900,360);
    smallLabel(c,'META DA GESTÃO',cols[1],y+31,'#b9b8c1');
    write(c,money(15000000),cols[1],y+76,32,'#e6e0db',800,330);
    smallLabel(c,'META ATINGIDA',cols[2],y+31,'#b9b8c1');
    const pct=Math.min(100,Math.max(0,d.total/15000000*100));
    write(c,pct.toLocaleString('pt-BR',{maximumFractionDigits:1})+'%',cols[2],y+76,37,GOLD,900,290);
    bar(c,PAD+29,y+103,INNER-58,6,pct/100,'#b98738');
    c.strokeStyle='rgba(255,255,255,.12)';
    [PAD+402,PAD+783].forEach(x=>{c.beginPath();c.moveTo(x,y+22);c.lineTo(x,y+87);c.stroke();});
  }
  function drawFirst(c,r){
    const y=489,h=224,x=PAD,w=INNER;
    c.save();c.shadowColor='rgba(211,159,71,.22)';c.shadowBlur=27;
    rr(c,x,y,w,h,23,grad(c,x,y,x+w,y+h,[[0,'#3b2524'],[0.46,'#271a1e'],[1,'#17131a']]),'rgba(246,205,119,.82)',3);
    c.restore();
    const ag=grad(c,x,y,x+w,y,[[0,'#ffe4a0'],[0.55,'#c9963c'],[1,'#7c4426']]);
    rr(c,x+2,y+2,w-4,8,4,ag);
    c.fillStyle='rgba(238,188,86,.075)';c.beginPath();c.arc(x+w-145,y+69,130,0,Math.PI*2);c.fill();
    crown(c,x+97,y+81,66);
    smallLabel(c,'01   •   LÍDER DO MÊS',x+164,y+60,GOLD,700);
    write(c,r.name.toUpperCase(),x+164,y+117,38,WHITE,900,525);
    smallLabel(c,'CRÉDITO COMERCIALIZADO',x+w-34,y+60,'#d1b991',400,'right');
    write(c,money(r.total),x+w-34,y+116,44,GOLD,900,415,'right');
    c.strokeStyle='rgba(241,209,142,.18)';
    c.beginPath();c.moveTo(x+29,y+151);c.lineTo(x+w-29,y+151);c.stroke();
    const p=Math.min(1,Math.max(0,r.total/5000000));
    smallLabel(c,integer(r.qty)+' '+(r.qty===1?'COTA':'COTAS')+'   •   '+integer(r.launches)+' '+(r.launches===1?'LANÇAMENTO':'LANÇAMENTOS'),x+31,y+185,'#dbc8b0',610);
    write(c,(p*100).toLocaleString('pt-BR',{maximumFractionDigits:1})+'% DA META DE 5MM',x+w-32,y+185,15,GOLD,800,355,'right');
    bar(c,x+31,y+199,w-62,6,p,'#d4a64c');
  }
  function drawPodium(c,index,r){
    const y=736,h=181,gap=20,w=(INNER-gap)/2,x=PAD+(index-1)*(w+gap);
    const accent=index===1?SILVER:BRONZE;
    const bg=index===1?[['0','#303340'],['1','#1b1c27']]:[['0','#35251f'],['1','#23191b']];
    rr(c,x,y,w,h,21,grad(c,x,y,x+w,y+h,[[0,bg[0][1]],[1,bg[1][1]]]),rgba(accent,.57),2);
    rr(c,x+24,y+24,64,55,13,rgba(accent,.13),rgba(accent,.42));
    write(c,'0'+(index+1),x+56,y+63,31,accent,900,60,'center');
    smallLabel(c,index===1?'VICE-LIDERANÇA':'TERCEIRO LUGAR',x+107,y+45,accent,350);
    write(c,r.name.toUpperCase(),x+107,y+80,24,WHITE,900,w-138);
    write(c,money(r.total),x+26,y+134,35,accent,900,w-55);
    smallLabel(c,integer(r.qty)+' '+(r.qty===1?'COTA':'COTAS')+'  •  '+integer(r.launches)+' '+(r.launches===1?'LANÇAMENTO':'LANÇAMENTOS'),x+27,y+159,'#bdb5ba',w-50);
    bar(c,x+282,y+157,w-307,5,Math.min(1,r.total/5000000),accent);
  }
  function drawList(c,rows){
    const start=1012,rowH=84;
    smallLabel(c,'CLASSIFICAÇÃO COMPLETA',PAD,975,GOLD);
    smallLabel(c,'VENDAS DO MÊS  •  META INDIVIDUAL 5MM',W-PAD,975,'#aba4ac',560,'right');
    for(let i=3;i<rows.length;i++){
      const r=rows[i],y=start+(i-3)*rowH,x=PAD,w=INNER,h=74;
      rr(c,x,y,w,h,16,i%2?'#17141c':'#1d1720','rgba(255,255,255,.07)',1);
      rr(c,x+15,y+15,50,43,12,'rgba(212,171,95,.08)','rgba(212,171,95,.17)');
      write(c,String(i+1).padStart(2,'0'),x+40,y+44,23,'#cfb99e',900,48,'center');
      write(c,r.name.toUpperCase(),x+89,y+32,23,WHITE,800,480);
      const count=integer(r.qty)+' '+(r.qty===1?'cota':'cotas')+'   •   '+integer(r.launches)+' '+(r.launches===1?'lançamento':'lançamentos');
      write(c,count,x+89,y+56,15,'#afa4ad',600,470);
      write(c,money(r.total),x+w-25,y+34,28,'#f2dec4',900,370,'right');
      bar(c,x+w-385,y+54,359,5,Math.min(1,r.total/5000000),'#b48654');
    }
  }
  function render(){
    const d=getData();
    if(!d.rows.length)throw new Error('Nenhum consultor com vendas no período selecionado.');
    const extra=Math.max(0,d.rows.length-3);
    const H=1012+extra*84+128;
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
    const fy=H-102;
    c.fillStyle=grad(c,PAD,fy,W-PAD,fy,[[0,'rgba(234,192,111,.65)'],[1,'rgba(234,192,111,0)']]);
    c.fillRect(PAD,fy,INNER,2);
    smallLabel(c,'GESTÃO MENEZES   •   RESULTADOS REGISTRADOS NO DASHBOARD',PAD,fy+34,GOLD);
    write(c,integer(d.rows.length)+' VENDEDORES  |  TOTAL '+money(d.total),W-PAD,fy+34,17,'#c6bec2',800,550,'right');
    smallLabel(c,'RANKING COMPLETO   /   EDIÇÃO EXECUTIVA',PAD,fy+73,'#7f7782');
    const filename='ranking-gestao-menezes-'+d.m+'-executivo-completo.png';
    return {canvas,filename,month:d.m};
  }
  function premiumExport(auto=false,returnCanvas=false){
    let result;
    try{result=render();}
    catch(e){console.error('Gestão Menezes: erro no ranking executivo',e);if(!auto)alert(e.message||'Não foi possível gerar o ranking.');return null;}
    if(returnCanvas)return result;
    const btn=document.getElementById('exportRankCard');
    const previous=btn?.textContent;
    if(btn&&!auto){btn.disabled=true;btn.textContent='Preparando PNG executivo...';}
    const restore=()=>{if(btn&&!auto){btn.disabled=false;btn.textContent=previous||'Baixar ranking';}};
    try {
      result.canvas.toBlob(function(blob){
        try {
          if(!blob)throw new Error('Não foi possível gerar o PNG.');
          const url=URL.createObjectURL(blob),a=document.createElement('a');
          a.href=url;a.download=result.filename;
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
  window.gmExportarRankingExecutivo=premiumExport;
  console.info('Gestão Menezes: exportador premium ativo '+VERSION);
})();