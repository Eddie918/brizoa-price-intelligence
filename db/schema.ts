import { sqliteTable, text, integer, uniqueIndex, index, check } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
export const workspaces = sqliteTable('workspaces', { ownerId: text('owner_id').primaryKey(), createdAt: text('created_at').notNull() });
export const watchItems = sqliteTable('watch_items', {
  id: text('id').primaryKey(), ownerId: text('owner_id').notNull().references(() => workspaces.ownerId, { onDelete: 'cascade' }),
  retailer: text('retailer').notNull().default('amazon'), marketplace: text('marketplace').notNull().default('MX'),
  externalId: text('external_id').notNull(), demoKey: text('demo_key'), title: text('title').notNull(), category: text('category'), url: text('url'),
  imageUrl: text('image_url'), currentMinor: integer('current_minor'), currency: text('currency'), inStock: integer('in_stock', { mode: 'boolean' }), metadataStatus: text('metadata_status').default('manual'), metadataRefreshedAt: text('metadata_refreshed_at'),
  status: text('status').notNull().default('active'), targetMinor: integer('target_minor'), createdAt: text('created_at').notNull(),
}, t => [uniqueIndex('uq_watch_owner_product').on(t.ownerId, t.retailer, t.marketplace, t.externalId), check('ck_watch_status', sql`${t.status} in ('active','paused','archived')`), check('ck_target_positive', sql`${t.targetMinor} IS NULL OR (${t.targetMinor}>0 AND ${t.targetMinor}<=1000000000)`) ]);
export const alertEvents = sqliteTable('alert_events', {
  id: text('id').primaryKey(), ownerId: text('owner_id').notNull().references(() => workspaces.ownerId, { onDelete: 'cascade' }),
  watchId: text('watch_id').notNull().references(() => watchItems.id, { onDelete: 'cascade' }), observationKey: text('observation_key').notNull(),
  title: text('title').notNull(), priceMinor: integer('price_minor').notNull(), targetMinor: integer('target_minor').notNull(), createdAt: text('created_at').notNull(),
}, t => [uniqueIndex('uq_event_watch_observation').on(t.watchId, t.observationKey), index('idx_event_owner_date').on(t.ownerId, t.createdAt)]);
export const priceObservations = sqliteTable('price_observations', {
  id: text('id').primaryKey(), ownerId: text('owner_id').notNull().references(() => workspaces.ownerId, { onDelete: 'cascade' }), watchId: text('watch_id').notNull().references(() => watchItems.id, { onDelete: 'cascade' }),
  priceMinor: integer('price_minor').notNull(), currency: text('currency').notNull().default('MXN'), inStock: integer('in_stock', { mode: 'boolean' }), source: text('source').notNull(), observedAt: text('observed_at').notNull(),
}, t => [uniqueIndex('uq_price_watch_day_source').on(t.watchId, t.observedAt, t.source), index('idx_price_owner_watch').on(t.ownerId, t.watchId)]);
