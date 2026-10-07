CREATE TYPE "public"."user_role" AS ENUM('user', 'vendor', 'admin');--> statement-breakpoint
CREATE TYPE "public"."vendor_status" AS ENUM('pending', 'active', 'blocked');--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"telegram_id" bigint NOT NULL,
	"username" text,
	"first_name" text,
	"last_name" text,
	"language_code" text,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_telegram_id_unique" UNIQUE("telegram_id")
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_user_id" integer,
	"name" text NOT NULL,
	"city" text NOT NULL,
	"phones" text[] DEFAULT '{}' NOT NULL,
	"description" text,
	"address" text,
	"latitude" double precision,
	"longitude" double precision,
	"status" "vendor_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "vendors_owner_user_id_idx" ON "vendors" USING btree ("owner_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "vendors_city_name_uniq" ON "vendors" USING btree ("city","name");--> statement-breakpoint
CREATE INDEX "vendors_phones_gin_idx" ON "vendors" USING gin ("phones");