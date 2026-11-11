export function saleOK(s,cids){
 if(!s||typeof s.id!=='string'||!s.id||s.id.length>200||typeof s.consultantId!=='string'||!cids.has(s.consultantId))return false;
 if(!['Lar','Motors','lar','motors','nao_definido'].includes(s.product))return false;
 const amount=Number(s.amount),qty=Number(s.qty);
 if(!Number.isFinite(amount)||amount<=0||!Number.isInteger(qty)||qty<1||qty>1000)return false;
 if(typeof s.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s.date))return false;
 const d=new Date(s.date+'T12:00:00Z');if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==s.date)return false;
 if(s.unitAmount!==undefined){const unit=Number(s.unitAmount);if(!Number.isFinite(unit)||unit<=0||Math.abs(unit*qty-amount)>.011)return false}
 if(s.note!==undefined&&(typeof s.note!=='string'||s.note.length>500))return false;
 return true;
}
export function distinctSaleIds(sales){
 if(!Array.isArray(sales))return false;
 const seen=new Set();
 for(const s of sales){if(!s||typeof s.id!=='string'||!s.id||seen.has(s.id))return false;seen.add(s.id)}
 return true;
}
export function sameSale(a,b){return ['consultantId','product','date'].every(k=>a[k]===b[k])&&Number(a.amount)===Number(b.amount)&&Number(a.qty)===Number(b.qty)&&String(a.note||'')===String(b.note||'')}
