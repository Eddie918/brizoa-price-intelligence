import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanAmazonTitle, titleFromAmazonInput, guessCategory } from '../lib/amazon.ts';

test('derives a clean title from an Amazon Mexico product URL', () => {
  assert.equal(titleFromAmazonInput('https://www.amazon.com.mx/LEGO-Art-Vincent-van-Gogh/dp/B09SM828FD/ref=sr_1_1'), 'LEGO Art Vincent Van Gogh');
});
test('decodes accents and removes separators or odd characters', () => {
  assert.equal(cleanAmazonTitle('cafetera-de-goteo_%C3%A9lite+++12-tazas!!!'), 'Cafetera de Goteo Élite 12 Tazas');
});
test('does not infer a title from ASIN-only or hostile URLs', () => {
  assert.equal(titleFromAmazonInput('https://www.amazon.com.mx/dp/B09SM828FD'), null);
  assert.equal(titleFromAmazonInput('https://amazon.com.mx.evil.example/producto/dp/B09SM828FD'), null);
});
test('suggests a useful category', () => assert.equal(guessCategory('LEGO Vincent van Gogh'), 'Juguetes'));
