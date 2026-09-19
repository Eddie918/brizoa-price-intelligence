import test from 'node:test';
import assert from 'node:assert/strict';
import { parseApifyProduct } from '../lib/apify-product.ts';

test('normalizes an Amazon Mexico product returned by Apify', () => {
  const snapshot = parseApifyProduct({
    title: 'LEGO Art Vincent van Gogh',
    price: { value: 2999.5, currency: '$' },
    inStock: true,
    highResolutionImages: [{ url: 'https://m.media-amazon.com/example.jpg' }],
  }, '2026-09-19T00:00:00.000Z');
  assert.equal(snapshot.currentMinor, 299950);
  assert.equal(snapshot.currency, 'MXN');
  assert.equal(snapshot.imageUrl, 'https://m.media-amazon.com/example.jpg');
  assert.equal(snapshot.inStock, true);
});

test('surfaces actor error items instead of treating them as products', () => {
  assert.throws(() => parseApifyProduct({ error: 'product_not_found', errorDescription: 'Producto no encontrado.' }), /Producto no encontrado/);
});
