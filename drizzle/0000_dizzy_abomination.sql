CREATE TABLE `alert_events` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`watch_id` text NOT NULL,
	`observation_key` text NOT NULL,
	`title` text NOT NULL,
	`price_minor` integer NOT NULL,
	`target_minor` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `workspaces`(`owner_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`watch_id`) REFERENCES `watch_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_event_watch_observation` ON `alert_events` (`watch_id`,`observation_key`);--> statement-breakpoint
CREATE INDEX `idx_event_owner_date` ON `alert_events` (`owner_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `watch_items` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`retailer` text DEFAULT 'amazon' NOT NULL,
	`marketplace` text DEFAULT 'MX' NOT NULL,
	`external_id` text NOT NULL,
	`demo_key` text,
	`title` text NOT NULL,
	`url` text,
	`status` text DEFAULT 'active' NOT NULL,
	`target_minor` integer,
	`created_at` text NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `workspaces`(`owner_id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "ck_watch_status" CHECK("watch_items"."status" in ('active','paused','archived')),
	CONSTRAINT "ck_target_positive" CHECK("watch_items"."target_minor" IS NULL OR ("watch_items"."target_minor">0 AND "watch_items"."target_minor"<=1000000000))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_watch_owner_product` ON `watch_items` (`owner_id`,`retailer`,`marketplace`,`external_id`);--> statement-breakpoint
CREATE TABLE `workspaces` (
	`owner_id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL
);
