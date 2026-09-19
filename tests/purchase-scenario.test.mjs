import test from 'node:test';
import assert from 'node:assert/strict';
import {purchaseScenario as calc} from '../lib/purchase-scenario.ts';
test('waiting cost changes the decision',()=>{assert.equal(calc(200000,250000,180000,30,1000).netSaving,-10000);assert.equal(calc(200000,250000,180000,5,1000).netSaving,15000);});
test('urgency does not override budget',()=>assert.equal(calc(200000,150000,140000,0,0).affordable,false));
test('no fabricated result with missing prices or invalid values',()=>{assert.equal(calc(null,200,100,2,0),null);assert.equal(calc(200,NaN,100,2,0),null);assert.equal(calc(200,300,100,-1,0),null);});
test('target already reached and free waiting',()=>{assert.equal(calc(100,200,150,30,0).title,'Tu objetivo ya está alcanzado');assert.equal(calc(200,300,100,30,0).breakEvenDays,null);});
