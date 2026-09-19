export type Observation = { at: string; totalMinor: number; currency: string; offerKey: string; inStock: boolean; complete: boolean };
export type Verdict = 'buy' | 'wait' | 'neutral' | 'insufficient' | 'stale' | 'unavailable' | 'verify';
export type Recommendation = { action: Verdict; score: number | null; percentile: number | null; current: number | null; median: number | null; min: number | null; max: number | null; days: number; coverage: number; difference: number | null; reason: string; version: string };
export const RULE_VERSION = 'historical-position-v1';
export function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  if (!s.length) return NaN;
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}
export function recommend(observations: Observation[], now = new Date()): Recommendation {
  const base: Recommendation = { action: 'insufficient', score: null, percentile: null, current: null, median: null, min: null, max: null, days: 0, coverage: 0, difference: null, reason: 'Necesitamos al menos 30 días comparables de historial.', version: RULE_VERSION };
  const nowMs = now.getTime();
  const timed = observations.filter(o => Number.isFinite(Date.parse(o.at)) && Date.parse(o.at) <= nowMs).sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  const latest = timed[timed.length - 1];
  if (latest && (!Number.isSafeInteger(latest.totalMinor) || latest.totalMinor <= 0)) return { ...base, action: 'verify', reason: 'La última observación no contiene un precio válido.' };
  const valid = timed.filter(o => Number.isSafeInteger(o.totalMinor) && o.totalMinor > 0);
  if (!valid.length) return base;
  const current = valid[valid.length - 1];
  base.current = current.totalMinor;
  if (!current.inStock) return { ...base, action: 'unavailable', reason: 'La última observación indica que no hay existencias.' };
  if (nowMs - Date.parse(current.at) > 36 * 3600000) return { ...base, action: 'stale', reason: 'El precio tiene más de 36 horas. Hay que actualizarlo antes de decidir.' };
  if (!current.complete) return { ...base, reason: 'Falta confirmar el costo total con envío y descuentos aplicables.' };
  const cutoff = Date.parse(current.at) - 90 * 86400000;
  const currentDay = new Date(current.at).toISOString().slice(0, 10);
  const daily = new Map<string, Observation>();
  for (const o of valid) {
    const day = new Date(o.at).toISOString().slice(0, 10);
    if (o.offerKey === current.offerKey && o.currency === current.currency && o.inStock && o.complete && Date.parse(o.at) >= cutoff && day < currentDay) daily.set(day, o);
  }
  const historical = [...daily.values()];
  if (!historical.length) return base;
  const amounts = historical.map(o => o.totalMinor);
  const med = median(amounts);
  const firstDay = new Date(historical[0].at).toISOString().slice(0, 10);
  const span = Math.round((Date.parse(currentDay + 'T00:00:00Z') - Date.parse(firstDay + 'T00:00:00Z')) / 86400000);
  const coverage = Math.min(1, historical.length / Math.max(1, span));
  Object.assign(base, { median: med, min: Math.min(...amounts), max: Math.max(...amounts), days: amounts.length, coverage, difference: (med - current.totalMinor) / med * 100 });
  if (historical.length < 30 || span < 30 || coverage < 0.6) return base;
  if (Math.abs(current.totalMinor / med - 1) > 0.6) return { ...base, action: 'verify', reason: 'El cambio es inusual. Primero confirmemos precio, variante y vendedor.' };
  const percentile = 100 * (amounts.filter(p => p < current.totalMinor).length + 0.5 * amounts.filter(p => p === current.totalMinor).length) / amounts.length;
  const score = Math.max(0, Math.min(100, Math.round(100 - percentile)));
  const action: Verdict = score >= 75 && base.difference! >= 3 ? 'buy' : score <= 25 && base.difference! <= -3 ? 'wait' : 'neutral';
  const reason = action === 'buy' ? 'Está entre los precios más bajos del historial observado. Si ya lo necesitabas, es un momento favorable.' : action === 'wait' ? 'Está por encima de su precio habitual. Puedes esperar si no tienes prisa; una bajada futura no está garantizada.' : 'Está cerca de su rango habitual. Decide según tu necesidad y presupuesto.';
  return { ...base, action, score, percentile, reason };
}
export function parseAmazonInput(input: string) {
  const value = input.trim();
  if (/^[A-Za-z0-9]{10}$/.test(value)) return { asin: value.toUpperCase(), marketplace: 'MX', url: `https://www.amazon.com.mx/dp/${value.toUpperCase()}` };
  let url: URL;
  try { url = new URL(value); } catch { throw new Error('Pega una URL completa de Amazon México o un ASIN de 10 caracteres.'); }
  if (url.protocol !== 'https:' || !['amazon.com.mx', 'www.amazon.com.mx'].includes(url.hostname.toLowerCase()) || url.username || url.password || (url.port && url.port !== '443')) throw new Error('Usa un enlace HTTPS de amazon.com.mx. Los enlaces cortos aún no están disponibles.');
  const match = url.pathname.match(/\/(?:dp|gp\/product)\/([A-Za-z0-9]{10})(?:\/|$)/);
  if (!match) throw new Error('No encontramos un ASIN en ese enlace. Abre la página del producto y copia su URL.');
  const asin = match[1].toUpperCase();
  return { asin, marketplace: 'MX', url: `https://www.amazon.com.mx/dp/${asin}` };
}
