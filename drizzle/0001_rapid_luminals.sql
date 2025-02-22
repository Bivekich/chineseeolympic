CREATE TABLE IF NOT EXISTS "participant_details" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"olympiad_id" text NOT NULL,
	"full_name" text NOT NULL,
	"education_type" text NOT NULL,
	"grade" text,
	"institution_name" text,
	"phone_number" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"olympiad_id" text NOT NULL,
	"amount" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"payment_id" text,
	"payment_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "olympiads" ADD COLUMN "duration" integer DEFAULT 7200 NOT NULL;--> statement-breakpoint
ALTER TABLE "olympiads" ADD COLUMN "randomize_questions" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "olympiads" ADD COLUMN "questions_per_participant" integer;--> statement-breakpoint
ALTER TABLE "olympiads" ADD COLUMN "price" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "type" text DEFAULT 'text' NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "choices" text;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "matching_pairs" text;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "media" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_admin" boolean DEFAULT false NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "participant_details" ADD CONSTRAINT "participant_details_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "participant_details" ADD CONSTRAINT "participant_details_olympiad_id_olympiads_id_fk" FOREIGN KEY ("olympiad_id") REFERENCES "olympiads"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_olympiad_id_olympiads_id_fk" FOREIGN KEY ("olympiad_id") REFERENCES "olympiads"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
