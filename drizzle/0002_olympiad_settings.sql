ALTER TABLE "olympiads"
ADD COLUMN "duration" integer NOT NULL DEFAULT 7200,
ADD COLUMN "randomize_questions" boolean NOT NULL DEFAULT false,
ADD COLUMN "questions_per_participant" integer; 