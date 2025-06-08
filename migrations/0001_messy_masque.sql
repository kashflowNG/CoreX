CREATE TABLE "support_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"message" text NOT NULL,
	"images" text[],
	"status" text DEFAULT 'open' NOT NULL,
	"admin_reply" text,
	"replied_at" timestamp,
	"replied_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_replied_by_users_id_fk" FOREIGN KEY ("replied_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;