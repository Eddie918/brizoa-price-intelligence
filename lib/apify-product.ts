import { compactProductTitle } from './product-title';

export type ProductSnapshot = { title: string; imageUrl: string | null; currentMinor: number | null; currency: string; inStock: boolean | null; refreshedAt: string };

const record = (value: unknown): Record<string, unknown> => value && typeof value === 'object' ? value as Record<string, unknown> : {};

export function parseApifyProduct(value: unknown, refreshedAt = new Date().toISOString()): ProductSnapshot {
  const item = record(value);
  if (item.error) throw new Error(String(item.errorDescription ?? `Amazon no devolvió el producto (${item.error}).`));
  const price = record(item.price);
  const amount = Number(price.value ?? item.priceValue ?? item.currentPrice);
  const images = Array.isArray(item.highResolutionImages) ? item.highResolutionImages : [];
  const firstImage = record(images[0]);
  const image = String(firstImage.url ?? images[0] ?? item.thumbnailImage ?? item.image ?? '').trim();
  const rawCurrency = String(price.currency ?? item.currency ?? 'MXN').toUpperCase();
  const currency = rawCurrency === '$' || rawCurrency === 'MX$' ? 'MXN' : rawCurrency;
  const title = compactProductTitle(String(item.title ?? item.name ?? ''));
  if (!title) throw new Error('El proveedor respondió, pero la ficha no contiene un título válido.');
  return { title, imageUrl: /^https:\/\//.test(image) ? image : null, currentMinor: Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) : null, currency, inStock: typeof item.inStock === 'boolean' ? item.inStock : null, refreshedAt };
}
