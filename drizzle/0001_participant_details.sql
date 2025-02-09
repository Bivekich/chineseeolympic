CREATE TABLE IF NOT EXISTS "participant_details" (
  "id" text PRIMARY KEY,
  "user_id" text NOT NULL REFERENCES "users"("id"),
  "olympiad_id" text NOT NULL REFERENCES "olympiads"("id"),
  "full_name" text NOT NULL,
  "education_type" text NOT NULL,
  "grade" text,
  "institution_name" text,
  "phone_number" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
); 