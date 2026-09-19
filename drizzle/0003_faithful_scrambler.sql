CREATE TABLE `price_observations` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`watch_id` text NOT NULL,
	`price_minor` integer NOT NULL,
	`currency` text DEFAULT 'MXN' NOT NULL,
	`in_stock` integer,
	`source` text NOT NULL,
	`observed_at` text NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `workspaces`(`owner_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`watch_id`) REFERENCES `watch_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_price_watch_day_source` ON `price_observations` (`watch_id`,`observed_at`,`source`);--> statement-breakpoint
CREATE INDEX `idx_price_owner_watch` ON `price_observations` (`owner_id`,`watch_id`);