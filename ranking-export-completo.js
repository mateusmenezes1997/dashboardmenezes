(function(){
'use strict';
if(window.__gmRankingCompleto20261113)return;
window.__gmRankingCompleto20261113=true;
var KEY='20261113-2';
function allPeople(){
  var s;
  try{s=typeof state!=='undefined'?state:window.state;}catch(e){s=window.state;}
  if(!s||!Array.isArray(s.consultants))return null;
  var ym=new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',timeZone:'America/Sao_Paulo'}).format(new Date()).slice(0,7);
  var list=s.consultants.map(function(c){
    var m=c.monthOpenings&&c.monthOpenings[ym];
    var amount=m&&m.total!==undefined?Number(m.total):Number(c.opening||0);
    return {name:String(c.name||'Consultor'),value:Number.isFinite(amount)?amount:0};
  }).filter(function(c){return c.value>0;});
  list.sort(function(a,b){return b.value-a.value||a.name.localeCompare(b.name,'pt-BR')});
  return list;
}
function download(){
  var people=allPeople();
  if(!people){alert('O ranking ainda não está disponível. Entre no dashboard e tente novamente.');return;}
  if(!people.length){alert('Não há consultores com vendas neste mês.');return;}
  var w=1240,pad=58,rh=people.length>40?64:76,top=295,bottom=130,h=top+people.length*rh+bottom;
  var canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  var g=canvas.getContext('2d');if(!g){alert('Não foi possível gerar o PNG.');return;}
  var gradient=g.createLinearGradient(0,0,w,h);gradient.addColorStop(0,'#0b0d15');gradient.addColorStop(.6,'#1c111b');gradient.addColorStop(1,'#080b11');
  g.fillStyle=gradient;g.fillRect(0,0,w,h);
  g.fillStyle='#d8ab65';g.fillRect(pad,48,90,5);
  g.font='bold 24px Arial';g.fillText('GESTÃO MENEZES',pad,98);
  g.fillStyle='#ffffff';g.font='bold 54px Arial';g.fillText('RANKING DE VENDAS',pad,177);
  var title=new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric',timeZone:'America/Sao_Paulo'}).format(new Date());
  g.fillStyle='#d2c0aa';g.font='24px Arial';g.fillText(title.toUpperCase()+'  •  '+people.length+' CONSULTORES COM VENDAS',pad,225);
  var brl=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:0,maximumFractionDigits:0});
  people.forEach(function(person,i){
    var y=top+i*rh;
    var width=w-2*pad;
    g.fillStyle=i===0?'#392c20':i===1?'#282a32':i===2?'#30241e':i%2?'#12151d':'#1c1921';
    g.beginPath();g.roundRect(pad,y,width,rh-8,12);g.fill();
    if(i<3){g.strokeStyle=['#e4bb72','#bfc9d7','#bb865f'][i];g.lineWidth=2;g.stroke();}
    g.textAlign='left';g.fillStyle=i<3?['#f9d993','#dce2ee','#dfa981'][i]:'#bfb5a9';g.font='bold 28px Arial';g.fillText(String(i+1).padStart(2,'0'),pad+28,y+rh/2+10);
    var name=person.name;g.font=(i<3?'bold ':'')+'25px Arial';
    while(name.length>2&&g.measureText(name).width>550)name=name.slice(0,-2)+'…';
    g.fillStyle='#ffffff';g.fillText(name,pad+116,y+rh/2+9);
    g.textAlign='right';g.font='bold 25px Arial';g.fillStyle=i===0?'#f3ce87':'#f4e8d6';g.fillText(brl.format(person.value),w-pad-26,y+rh/2+9);
  });
  g.textAlign='left';g.fillStyle='#b99e75';g.font='20px Arial';g.fillText('RANKING COMPLETO • TODOS OS VENDEDORES DO MÊS',pad,h-55);
  try{
    var a=document.createElement('a');
    a.download='ranking-gestao-menezes-completo-'+new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'America/Sao_Paulo'}).format(new Date())+'.png';
    a.href=canvas.toDataURL('image/png');
    document.body.appendChild(a);a.click();a.remove();
  }catch(error){console.error('Erro ao baixar ranking completo',error);alert('Falha ao baixar o ranking completo.');}
}
function exportButton(el){
  if(!el||!el.closest)return false;
  var b=el.closest('button,a,[role="button"],[onclick]');
  if(!b)return false;
  if(b.hasAttribute('download')&&b.getAttribute('download')&&b.download.indexOf('ranking-gestao-menezes-completo-')===0)return false;
  var label=[b.textContent,b.getAttribute('aria-label'),b.getAttribute('title'),b.id,b.className].join(' ').toLowerCase();
  if(!/(baixar|exportar|download|salvar|gerar)/.test(label))return false;
  if(/ranking/.test(label))return true;
  var parent=b.closest('[id*="ranking" i],[class*="ranking" i],[id*="export" i],[class*="export" i]');
  return !!parent&&/ranking/.test((parent.id+' '+parent.className).toLowerCase());
}
document.addEventListener('click',function(e){
  if(!exportButton(e.target))return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();download();
},true);
window.gmExportarRankingCompleto=download;
console.info('Gestão Menezes: exportação completa do ranking carregada '+KEY);
})();