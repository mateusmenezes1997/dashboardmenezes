import test from 'node:test';
import assert from 'node:assert/strict';
import {saleOK,distinctSaleIds,sameSale} from '../lib/sales.js';
const ids=new Set(['consultor-1']);
const base={id:'req-123',consultantId:'consultor-1',product:'lar',unitAmount:100000,qty:2,amount:200000,date:'2026-11-11',note:'teste'};
test('quantidade multiplica o valor por cota uma única vez',()=>{
 assert.equal(saleOK(base,ids),true);
 assert.equal(saleOK({...base,amount:400000},ids),false);
 assert.equal(saleOK({...base,amount:100000},ids),false);
 assert.equal(saleOK({...base,qty:1,amount:100000},ids),true);
});
test('datas e cotas invalidas nao podem ser lancadas',()=>{
 assert.equal(saleOK({...base,date:'2026-02-31'},ids),false);
 assert.equal(saleOK({...base,qty:0},ids),false);
 assert.equal(saleOK({...base,consultantId:'inexistente'},ids),false);
});
test('backup nao permite IDs repetidos',()=>{
 assert.equal(distinctSaleIds([{id:'x'},{id:'y'}]),true);
 assert.equal(distinctSaleIds([{id:'x'},{id:'x'}]),false);
 assert.equal(distinctSaleIds([{id:'x'},{amount:100}]),false);
});
test('repeticao da mesma requisicao e idempotente',()=>{
 assert.equal(sameSale(base,{...base}),true);
 assert.equal(sameSale(base,{...base,amount:210000}),false);
});
