import { recommend, type Observation } from './recommendation';
import { compactProductTitle } from './product-title';
export type Item = { id: string; title: string; externalId: string; demoKey: string | null; category: string; status: string; targetMinor: number | null; url: string | null; imageUrl: string | null; metadataStatus: string; refreshedAt: string | null; observations: Observation[]; recommendation: ReturnType<typeof recommend> };
export const DEMO_AS_OF = '2026-09-19T12:00:00.000Z';
export const demoCatalog = [
  { key: 'audio', title: 'Audífonos inalámbricos Aura', category: 'Audio · Negro', base: 189900, current: 149900 },
  { key: 'coffee', title: 'Cafetera de goteo Alba', category: 'Hogar · 12 tazas', base: 129900, current: 129900 },
  { key: 'reader', title: 'Lector de tinta electrónica', category: 'Tecnología · 16 GB', base: 259900, current: 309900 },
];
export function observationsFor(key: string): Observation[] {
  const p = demoCatalog.find(p => p.key === key);
  if (!p) return [];
  return Array.from({ length: 91 }, (_, i) => ({ at: new Date(Date.parse(DEMO_AS_OF) - (90 - i) * 86400000).toISOString(), totalMinor: i === 90 ? p.current : Math.round((p.base + Math.sin(i * .28) * p.base * .06 + (i % 17 < 4 ? -p.base * .12 : 0)) / 100) * 100, currency: 'MXN', offerKey: `demo:MX:${key}:new:seller-1:standard`, inStock: true, complete: true }));
}
export function hydrateItem(row: Record<string, unknown>): Item {
  const key = row.demo_key as string | null;
  const sample = demoCatalog.find(p => p.key === key);
  const stored = Array.isArray(row.price_observations) ? row.price_observations as Record<string, unknown>[] : [];
  const livePrice = row.current_minor == null ? null : Number(row.current_minor);
  const observations = key ? observationsFor(key) : stored.length ? stored.map(o => ({ at: String(o.observed_at), totalMinor: Number(o.price_minor), currency: String(o.currency ?? 'MXN'), offerKey: `amazon:MX:${row.external_id}:${o.source ?? 'apify'}`, inStock: o.in_stock !== 0, complete: true })) : livePrice && row.metadata_refreshed_at ? [{ at: String(row.metadata_refreshed_at), totalMinor: livePrice, currency: String(row.currency ?? 'MXN'), offerKey: `amazon:MX:${row.external_id}:current`, inStock: row.in_stock !== 0, complete: true }] : [];
  return { id: String(row.id), title: key ? String(row.title) : compactProductTitle(String(row.title)), externalId: String(row.external_id), demoKey: key, category: sample?.category ?? String(row.category ?? 'Otros'), status: String(row.status ?? 'active'), targetMinor: row.target_minor == null ? null : Number(row.target_minor), url: (row.url as string | null) ?? null, imageUrl: (row.image_url as string | null) ?? null, metadataStatus: String(row.metadata_status ?? (key ? 'demo' : 'manual')), refreshedAt: (row.metadata_refreshed_at as string | null) ?? null, observations, recommendation: recommend(observations, new Date()) };
}
export function demoItems(): Item[] {
  return demoCatalog.map(p => hydrateItem({ id: `preview-${p.key}`, title: p.title, external_id: `DEMO-${p.key}`, demo_key: p.key, status: 'active', target_minor: null }));
}
