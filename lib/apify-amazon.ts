import { env } from 'cloudflare:workers';
import { parseApifyProduct, type ProductSnapshot } from '@/lib/apify-product';

export type { ProductSnapshot } from '@/lib/apify-product';

function token() { return (env as Cloudflare.Env & { APIFY_TOKEN?: string }).APIFY_TOKEN?.trim() || null; }
export function apifyConfigured() { return Boolean(token()); }

const record = (value: unknown): Record<string, unknown> => value && typeof value === 'object' ? value as Record<string, unknown> : {};

export async function lookupAmazonProduct(url: string): Promise<ProductSnapshot | null> {
  const apiToken = token();
  if (!apiToken) return null;
  const endpoint = new URL('https://api.apify.com/v2/acts/junglee~amazon-crawler/run-sync-get-dataset-items');
  endpoint.searchParams.set('token', apiToken);
  endpoint.searchParams.set('timeout', '45');
  const response = await fetch(endpoint, {
    method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(50_000),
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ categoryOrProductUrls: [{ url }], maxItemsPerStartUrl: 1, maxProductVariantsAsSeparateResults: 0, maxOffers: 0, scrapeSellers: false, useCaptchaSolver: false, scrapeProductVariantPrices: false, scrapeProductDetails: true, proxyCountry: 'MX', countryCode: 'MX', language: 'es' }),
  });
  if (!response.ok) throw new Error(response.status === 402 || response.status === 429 ? 'La cuota gratuita de consulta está agotada temporalmente.' : 'El proveedor no pudo consultar este producto.');
  const items = await response.json() as unknown;
  const item = Array.isArray(items) ? items[0] : null;
  if (!item || !Object.keys(record(item)).length) throw new Error('No se encontró una ficha disponible para este producto.');
  return parseApifyProduct(item);
}
