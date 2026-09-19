import type { Observation } from '../lib/recommendation';
export function validateHistory(value: unknown): { asin: string; title: string; source: string; observations: Observation[] } {
  const data = value as Record<string, unknown>;
  if (!data || !/^[A-Z0-9]{10}$/.test(String(data.asin)) || typeof data.title !== 'string' || !data.title.trim() || typeof data.source !== 'string' || !data.source.trim()) throw new Error('Incluye asin, title y source.');
  if (!Array.isArray(data.observations) || !data.observations.length || data.observations.length > 5000) throw new Error('Importa entre 1 y 5000 observaciones.');
  const seen = new Set<string>();
  for (const o of data.observations) {
    if (!o || typeof o.at !== 'string' || !Number.isFinite(Date.parse(o.at)) || Date.parse(o.at)>Date.now() || !Number.isSafeInteger(o.totalMinor) || o.totalMinor<=0 || o.currency!=='MXN' || typeof o.offerKey!=='string' || !o.offerKey.trim() || typeof o.inStock!=='boolean' || typeof o.complete!=='boolean') throw new Error('Observación inválida: revisa fecha, importe en centavos, MXN, oferta, disponibilidad y costo completo.');
    const id=`${new Date(o.at).toISOString()}:${o.offerKey}`;
    if (seen.has(id)) throw new Error('Hay observaciones duplicadas para la misma fecha y oferta.');
    seen.add(id);
  }
  return {asin:String(data.asin),title:data.title.trim().slice(0,150),source:data.source.trim().slice(0,200),observations:[...data.observations].sort((a,b)=>Date.parse(a.at)-Date.parse(b.at))};
}
