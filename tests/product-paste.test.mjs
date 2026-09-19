import test from 'node:test';
import assert from 'node:assert/strict';
import {productPaste} from '../lib/product-paste.ts';
test('ASIN-only URL does not invent a title',()=>assert.equal(productPaste('https://www.amazon.com.mx/dp/B0DJ184XGM/ref=abc').title,null));
test('shared product text provides the title',()=>{const r=productPaste('LEGO Icons Lamborghini\nhttps://www.amazon.com.mx/dp/B0DJ184XGM');assert.equal(r.title,'LEGO Icons Lamborghini');assert.equal(r.input,'https://www.amazon.com.mx/dp/B0DJ184XGM');});
test('descriptive URL autocompletes',()=>assert.equal(productPaste('https://www.amazon.com.mx/LEGO-Icons-Lamborghini/dp/B0DJ184XGM').title,'LEGO Icons Lamborghini'));
test('hostile URL cannot supply a title',()=>assert.equal(productPaste('https://www.amazon.com.mx.evil.test/dp/B0DJ184XGM').title,null));
