import { z } from 'zod';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getRawDb } from '@/db/raw';
import { demoItems, demoCatalog, hydrateItem } from '@/lib/demo';
import { parseAmazonInput } from '@/lib/recommendation';
import { lookupAmazonProduct, apifyConfigured } from '@/lib/apify-amazon';
import { actor, payload, json, failure, ApiError } from '@/lib/api';
export const dynamic = 'force-dynamic';
async function initialize(owner: string) {
  const db = getRawDb();
  const existing = await db.prepare('SELECT owner_id FROM workspaces WHERE owner_id=?').bind(owner).first();
  if (existing) return;
  const now = new Date().toISOString();
  // A workspace and its examples are written atomically. A concurrent first request can safely retry this idempotent batch.
  await db.batch([
    db.prepare('INSERT OR IGNORE INTO workspaces(owner_id,created_at) VALUES (?,?)').bind(owner, now),
    ...demoCatalog.map(p => db.prepare('INSERT OR IGNORE INTO watch_items(id,owner_id,retailer,marketplace,external_id,demo_key,title,status,created_at) VALUES (?,?,?,?,?,?,?,?,?)').bind(`${owner}:${p.key}`, owner, 'demo', 'MX', `DEMO-${p.key}`, p.key, p.title, 'active', now)),
  ]);
}
export async function GET() {
  try {
    const user = await getChatGPTUser();
    if (!user) return json({ items: demoItems(), readOnly: true, events: [] });
    await initialize(user.userId); const db = getRawDb();
    const [rows, events, observations] = await Promise.all([
      db.prepare('SELECT * FROM watch_items WHERE owner_id=? ORDER BY created_at,id LIMIT 101').bind(user.userId).all(),
      db.prepare('SELECT id,title,price_minor,created_at FROM alert_events WHERE owner_id=? ORDER BY created_at DESC LIMIT 50').bind(user.userId).all(),
      db.prepare('SELECT watch_id,price_minor,currency,in_stock,source,observed_at FROM price_observations WHERE owner_id=? ORDER BY observed_at LIMIT 1000').bind(user.userId).all(),
    ]);
    return json({ items: rows.results.map(row => hydrateItem({ ...row, price_observations: observations.results.filter(o => o.watch_id === row.id) })), readOnly: false, events: events.results });
  } catch (e) { return failure(e); }
}
export async function POST(request: Request) {
  try {
    const owner = await actor();
    const parsed = z.object({ input: z.string().min(1).max(2048), title: z.string().trim().min(2).max(150), category: z.enum(['Tecnología','Hogar','Juguetes','Libros','Estilo','Otros']) }).strict().safeParse(await payload(request));
    if (!parsed.success) throw new ApiError('Revisa el enlace, el nombre y la categoría del producto.');
    let product: ReturnType<typeof parseAmazonInput>;
    try { product = parseAmazonInput(parsed.data.input); } catch(e) { throw new ApiError((e as Error).message); }
    await initialize(owner); const db = getRawDb();
    const found = await db.prepare("SELECT id,status FROM watch_items WHERE owner_id=? AND retailer='amazon' AND marketplace='MX' AND external_id=?").bind(owner, product.asin).first();
    if(found) return json({ id: found.id, existing: true, status: found.status });
    const id = crypto.randomUUID();
    let official: Awaited<ReturnType<typeof lookupAmazonProduct>> = null; let providerError: string | null = null;
    try { official = await lookupAmazonProduct(product.url); } catch (error) { providerError = error instanceof Error ? error.message : 'El proveedor no pudo consultar este producto.'; }
    const result = await db.prepare("INSERT OR IGNORE INTO watch_items(id,owner_id,retailer,marketplace,external_id,title,category,url,image_url,current_minor,currency,in_stock,metadata_status,metadata_refreshed_at,status,created_at) SELECT ?,?,'amazon','MX',?,?,?,?,?,?,?,?,?,?,'active',? WHERE (SELECT COUNT(*) FROM watch_items WHERE owner_id=? AND retailer='amazon')<10").bind(id, owner, product.asin, official?.title ?? parsed.data.title, parsed.data.category, product.url, official?.imageUrl ?? null, official?.currentMinor ?? null, official?.currency ?? 'MXN', official?.inStock == null ? null : Number(official.inStock), official ? 'apify' : 'manual', official?.refreshedAt ?? null, new Date().toISOString(), owner).run();
    if (!result.meta.changes) {
      const duplicate = await db.prepare("SELECT id,status FROM watch_items WHERE owner_id=? AND retailer='amazon' AND marketplace='MX' AND external_id=?").bind(owner, product.asin).first();
      if(duplicate) return json({ id:duplicate.id, existing:true, status:duplicate.status });
      throw new ApiError('El plan gratuito permite hasta 10 productos reales por espacio.', 409);
    }
    if (official?.currentMinor) await db.prepare('INSERT OR IGNORE INTO price_observations(id,owner_id,watch_id,price_minor,currency,in_stock,source,observed_at) VALUES (?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),owner,id,official.currentMinor,official.currency,official.inStock == null ? null : Number(official.inStock),'apify',official.refreshedAt).run();
    return json({ id, existing: false, dataStatus: official ? 'provider' : apifyConfigured() ? 'provider_unavailable' : 'pending_credentials', providerError }, 201);
  } catch(e) { return failure(e); }
}
