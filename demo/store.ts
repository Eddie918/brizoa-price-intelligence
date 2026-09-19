import { demoItems, hydrateItem, DEMO_AS_OF, type Item } from '../lib/demo';
import { recommend, parseAmazonInput } from '../lib/recommendation';
import { validateHistory } from './history';
import { importKeepaResponse } from '../lib/keepa-import';

const key = 'brizoa-portfolio-v1';
export function importHistory(value: unknown) {
  const data = validateHistory(value && typeof value==='object' && 'products' in value ? importKeepaResponse(value) : value), state = load();
  const existing = state.items.find(p=>p.externalId===data.asin);
  if (existing && !window.confirm('¿Reemplazar el historial local de este producto por el archivo importado?')) return false;
  const item = existing ?? hydrateItem({id:crypto.randomUUID(),title:data.title,external_id:data.asin,url:`https://www.amazon.com.mx/dp/${data.asin}`,status:'active'});
  item.observations = data.observations;
  item.metadataStatus = 'imported';
  item.refreshedAt = data.observations.at(-1)!.at;
  item.category = `Importado por ti · ${data.source}`;
  if (!existing) state.items.push(item);
  localStorage.setItem(key,JSON.stringify(state));
  return true;
}
type State = { items: Item[]; events: { id: string; title: string; price_minor: number; created_at: string }[] };
function load(): State {
  const raw = localStorage.getItem(key);
  if (raw) { try { const s = JSON.parse(raw); if (Array.isArray(s.items) && Array.isArray(s.events)) return s; } catch { /* recover malformed local state */ } }
  return { items: demoItems(), events: [] };
}
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
export const demoRequest: typeof fetch = async (input, init) => {
  try {
    const url = String(input), method = init?.method ?? 'GET';
    if (!url.startsWith('/api/watchlist')) return json({error:'Ruta no disponible en el demo.'},404);
    const state = load();
    for (const item of state.items) item.recommendation = recommend(item.observations, item.demoKey ? new Date(DEMO_AS_OF) : new Date());
    if (method === 'GET') return json({...state,readOnly:false});
    const body = init?.body ? JSON.parse(String(init.body)) : {};
    if (body.refresh_amazon) return json({error:'Demo sin conexión a Amazon: no consulta precios ni consume créditos. El historial real requiere observaciones fechadas de una fuente autorizada.'},400);
    let id = decodeURIComponent(url.split('/').at(-1)!);
    if (method === 'POST') {
      const parsed = parseAmazonInput(body.input);
      const existing = state.items.find(p=>p.externalId===parsed.asin);
      if (existing) return json({id:existing.id,existing:true,status:existing.status});
      id = crypto.randomUUID();
      state.items.push(hydrateItem({id,title:body.title,external_id:parsed.asin,url:parsed.url,category:body.category,status:'active'}));
    } else {
      const item = state.items.find(p=>p.id===id);
      if (!item) return json({error:'Producto no encontrado.'},404);
      if (method === 'DELETE') state.items=state.items.filter(p=>p.id!==id);
      else if (method === 'PATCH') {
        if (body.status !== undefined) item.status=body.status;
        if (body.title !== undefined) item.title=body.title;
        if (body.category !== undefined) item.category=body.category;
        if (body.target_minor !== undefined) item.targetMinor=body.target_minor;
        if (item.status==='active' && item.targetMinor!=null && item.recommendation.current!=null && item.recommendation.current<=item.targetMinor && !state.events.some(e=>e.id===id)) state.events.push({id,title:item.title,price_minor:item.recommendation.current,created_at:new Date().toISOString()});
      } else return json({error:'Método no permitido.'},405);
    }
    localStorage.setItem(key,JSON.stringify(state));
    return json({id,status:'active',dataStatus:'manual',deleted:method==='DELETE'});
  } catch { return json({error:'No se pudo guardar en este navegador. Revisa la URL y que el almacenamiento local esté disponible.'},400); }
};
