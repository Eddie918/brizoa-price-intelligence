import test from 'node:test';
import assert from 'node:assert/strict';
import { compactProductTitle } from '../lib/product-title.ts';

test('keeps the recognizable product name and model', () => {
  assert.equal(compactProductTitle('Lego® Ideas Vincent Van Gogh: La Noche Estrellada; diseño de Interiores con una Figura de colección para Recordar y admirar Las memorables Creaciones del reconocido Pintor Vincent Van Gogh 21333'), 'Lego Ideas Vincent Van Gogh: La Noche Estrellada · 21333');
});

test('removes marketplace keyword stuffing after separators', () => {
  assert.equal(compactProductTitle('LEGO Art Mona Lisa - Model Kit de Construcción para Adultos, Años 18+ - Decoración para Muro, Hogar - Regalos para Mujer y Hombre - 31213'), 'LEGO Art Mona Lisa · 31213');
});

test('limits titles without useful separators at word boundaries', () => {
  const title = compactProductTitle('Audífonos inalámbricos profesionales con cancelación activa de ruido autonomía extendida estuche de carga y micrófono para llamadas');
  assert.ok(title.length <= 78);
  assert.equal(title.endsWith(' '), false);
});
