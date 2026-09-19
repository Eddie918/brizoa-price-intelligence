import test from 'node:test';
import assert from 'node:assert/strict';
import {importKeepaResponse as parse} from '../lib/keepa-import.ts';
const sample={products:[{asin:'B09SM828FD',title:'LEGO',domainId:11,csv:[[1,20000,2,-1,3,19000]]}]};
test('Keepa timestamps, centavos, and unavailable markers',()=>{const r=parse(sample);assert.equal(r.observations[0].at,'2011-01-01T00:01:00.000Z');assert.equal(r.observations[1].inStock,false);assert.equal(r.observations[2].totalMinor,19000);assert.ok(r.observations.every(o=>!o.complete));});
test('reject foreign domain and malformed Keepa series',()=>{assert.throws(()=>parse({products:[{...sample.products[0],domainId:1}]}));assert.throws(()=>parse({products:[{...sample.products[0],csv:[[1]]}]}));});
