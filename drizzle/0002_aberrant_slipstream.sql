ALTER TABLE `watch_items` ADD `current_minor` integer;--> statement-breakpoint
ALTER TABLE `watch_items` ADD `currency` text;--> statement-breakpoint
ALTER TABLE `watch_items` ADD `in_stock` integer;--> statement-breakpoint
ALTER TABLE `watch_items` ADD `metadata_status` text DEFAULT 'manual';--> statement-breakpoint
ALTER TABLE `watch_items` ADD `metadata_refreshed_at` text;
