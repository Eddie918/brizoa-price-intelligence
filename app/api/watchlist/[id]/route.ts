import { z } from 'zod';
import { getRawDb } from '@/db/raw';
import { hydrateItem, DEMO_AS_OF } from '@/lib/demo';
import { actor, payload, json, failure, ApiError } from '@/lib/api';
import { lookupAmazonProduct, apifyConfigured } from '@/lib/apify-amazon';
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const owner = await actor(); const { id } = await context.params;
    const parsed = z.object({ status: z.enum(['active','paused','archived']).optional(), target_minor: z.number().int().min(1).max(1000000000).nullable().optional(), title: z.string().trim().min(2).max(150).optional(), category: z.enum(['Tecnología','Hogar','Juguetes','Libros','Estilo','Otros']).optional(), refresh_amazon: z.boolean().optional() }).strict().refine(v => Object.keys(v).length > 0).safeParse(await payload(request));
    if (!parsed.success) throw new ApiError('Estado, ficha o precio objetivo inválido.');
    const db = getRawDb();
    const row = await db.prepare('SELECT * FROM watch_items WHERE id=? AND owner_id=?').bind(id,owner).first();
    if(!row) throw new ApiError('Producto no encontrado en tu espacio.',404);
    let refreshed: Awaited<ReturnType<typeof lookupAmazonProduct>> = null;
    if (parsed.data.refresh_amazon) {
      if (row.retailer !== 'amazon') throw new ApiError('Este producto no pertenece a Amazon.', 400);
      if (!apifyConfigured()) throw new ApiError('El conector gratuito todavía no está configurado.', 503);
      if (row.metadata_refreshed_at && Date.now() - Date.parse(String(row.metadata_refreshed_at)) < 86_400_000) throw new ApiError('Esta ficha ya se actualizó durante las últimas 24 horas para cuidar la cuota gratuita.', 429);
      try { refreshed = await lookupAmazonProduct(String(row.url)); }
      catch (error) { throw new ApiError(error instanceof Error ? error.message : 'El proveedor no pudo consultar este producto.', 502); }
      if (!refreshed) throw new ApiError('El proveedor no devolvió una ficha para este producto.', 502);
    }
    const nextStatus = parsed.data.status ?? row.status;
    const nextTarget = parsed.data.target_minor === undefined ? row.target_minor : parsed.data.target_minor;
    const nextTitle = refreshed?.title ?? parsed.data.title ?? row.title; const nextCategory = parsed.data.category ?? row.category;
    const updated = { ...row, status: nextStatus, target_minor: nextTarget, title: nextTitle, category: nextCategory, image_url: refreshed?.imageUrl ?? row.image_url, current_minor: refreshed?.currentMinor ?? row.current_minor, currency: refreshed?.currency ?? row.currency, in_stock: refreshed?.inStock == null ? row.in_stock : Number(refreshed.inStock), metadata_status: refreshed ? 'official' : row.metadata_status, metadata_refreshed_at: refreshed?.refreshedAt ?? row.metadata_refreshed_at };
    const item=hydrateItem(updated);
    const statements = [db.prepare('UPDATE watch_items SET status=?,target_minor=?,title=?,category=?,image_url=?,current_minor=?,currency=?,in_stock=?,metadata_status=?,metadata_refreshed_at=? WHERE id=? AND owner_id=?').bind(nextStatus,nextTarget,nextTitle,nextCategory,updated.image_url,updated.current_minor,updated.currency,updated.in_stock,refreshed ? 'apify' : updated.metadata_status,updated.metadata_refreshed_at,id,owner)];
    if (refreshed?.currentMinor) statements.push(db.prepare('INSERT OR IGNORE INTO price_observations(id,owner_id,watch_id,price_minor,currency,in_stock,source,observed_at) VALUES (?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),owner,id,refreshed.currentMinor,refreshed.currency,refreshed.inStock == null ? null : Number(refreshed.inStock),'apify',refreshed.refreshedAt));
    // Alerts are evaluated on every confirmed write/refresh. Delivery remains in-app only.
    if(item.status==='active' && item.targetMinor != null && item.recommendation.current != null && item.recommendation.current <= item.targetMinor) {
      const observationKey = item.demoKey ? `${item.demoKey}:${DEMO_AS_OF}` : `${id}:${updated.metadata_refreshed_at ?? 'current'}`;
      statements.push(db.prepare('INSERT OR IGNORE INTO alert_events(id,owner_id,watch_id,observation_key,title,price_minor,target_minor,created_at) VALUES (?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),owner,id,observationKey,item.title,item.recommendation.current,item.targetMinor,new Date().toISOString()));
    }
    await db.batch(statements);
    return json({ item });
  } catch(e) { return failure(e); }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const owner = await actor(); const { id } = await context.params; const db = getRawDb();
    const row = await db.prepare('SELECT id,demo_key FROM watch_items WHERE id=? AND owner_id=?').bind(id, owner).first();
    if (!row) throw new ApiError('Producto no encontrado en tu espacio.', 404);
    if (row.demo_key) throw new ApiError('Los ejemplos base no se pueden eliminar; puedes archivarlos.', 409);
    await db.prepare('DELETE FROM watch_items WHERE id=? AND owner_id=?').bind(id, owner).run();
    return json({ deleted: true, id });
  } catch (e) { return failure(e); }
}
