CREATE TABLE IF NOT EXISTS "users" (
  "id" text PRIMARY KEY,
  "email" text NOT NULL UNIQUE,
  "password" text NOT NULL,
  "email_verified" boolean NOT NULL DEFAULT false,
  "verification_token" text,
  "reset_password_token" text,
  "reset_password_expires" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "olympiads" (
  "id" text PRIMARY KEY,
  "title" text NOT NULL,
  "start_date" timestamp NOT NULL,
  "end_date" timestamp NOT NULL,
  "level" text NOT NULL,
  "creator_id" text NOT NULL REFERENCES "users"("id"),
  "is_completed" boolean NOT NULL DEFAULT false,
  "is_draft" boolean NOT NULL DEFAULT true,
  "has_questions" boolean NOT NULL DEFAULT false,
  "has_prizes" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "questions" (
  "id" text PRIMARY KEY,
  "olympiad_id" text NOT NULL REFERENCES "olympiads"("id"),
  "question" text NOT NULL,
  "correct_answer" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "prizes" (
  "id" text PRIMARY KEY,
  "olympiad_id" text NOT NULL REFERENCES "olympiads"("id"),
  "placement" integer NOT NULL,
  "promo_code" text NOT NULL,
  "description" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "participant_results" (
  "id" text PRIMARY KEY,
  "user_id" text NOT NULL REFERENCES "users"("id"),
  "olympiad_id" text NOT NULL REFERENCES "olympiads"("id"),
  "score" text NOT NULL,
  "answers" text NOT NULL,
  "place" text,
  "certificate_url" text,
  "completed_at" timestamp NOT NULL DEFAULT now()
); 