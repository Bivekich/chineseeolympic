CREATE TABLE IF NOT EXISTS "olympiads" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"level" text NOT NULL,
	"creator_id" text NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"is_draft" boolean DEFAULT true NOT NULL,
	"has_questions" boolean DEFAULT false NOT NULL,
	"has_prizes" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "participant_results" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"olympiad_id" text NOT NULL,
	"score" text NOT NULL,
	"answers" text NOT NULL,
	"place" text,
	"certificate_url" text,
	"completed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "prizes" (
	"id" text PRIMARY KEY NOT NULL,
	"olympiad_id" text NOT NULL,
	"placement" integer NOT NULL,
	"promo_code" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "questions" (
	"id" text PRIMARY KEY NOT NULL,
	"olympiad_id" text NOT NULL,
	"question" text NOT NULL,
	"correct_answer" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"verification_token" text,
	"reset_password_token" text,
	"reset_password_expires" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "olympiads" ADD CONSTRAINT "olympiads_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "participant_results" ADD CONSTRAINT "participant_results_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "participant_results" ADD CONSTRAINT "participant_results_olympiad_id_olympiads_id_fk" FOREIGN KEY ("olympiad_id") REFERENCES "olympiads"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "prizes" ADD CONSTRAINT "prizes_olympiad_id_olympiads_id_fk" FOREIGN KEY ("olympiad_id") REFERENCES "olympiads"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "questions" ADD CONSTRAINT "questions_olympiad_id_olympiads_id_fk" FOREIGN KEY ("olympiad_id") REFERENCES "olympiads"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
