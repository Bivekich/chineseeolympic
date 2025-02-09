ALTER TABLE "questions"
ADD COLUMN "type" text NOT NULL DEFAULT 'text',
ADD COLUMN "choices" text; 