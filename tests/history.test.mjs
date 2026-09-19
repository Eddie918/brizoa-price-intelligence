import test from 'node:test';
import assert from 'node:assert/strict';
import { validateHistory } from '../demo/history.ts';
const entry={at:'2026-01-01T12:00:00Z',totalMinor:10000,currency:'MXN',offerKey:'seller:model:new',inStock:true,complete:false};
const data={asin:'B09SM828FD',title:'Producto',source:'Registro propio',observations:[entry]};
test('import preserves incomplete totals rather than inventing shipping',()=>assert.equal(validateHistory(data).observations[0].complete,false));
test('rejects duplicate observations',()=>assert.throws(()=>validateHistory({...data,observations:[entry,entry]})));
test('rejects future observations and invalid prices',()=>{for(const change of [{at:'2999-01-01'}, {totalMinor:-1},{currency:'USD'}]) assert.throws(()=>validateHistory({...data,observations:[{...entry,...change}]}));});
