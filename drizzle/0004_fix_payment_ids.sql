-- First drop the existing foreign key constraints
ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_user_id_users_id_fk";
ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_olympiad_id_olympiads_id_fk";

-- Change the column types
ALTER TABLE "payments" 
  ALTER COLUMN "id" TYPE text,
  ALTER COLUMN "user_id" TYPE text,
  ALTER COLUMN "olympiad_id" TYPE text;

-- Add back the foreign key constraints
ALTER TABLE "payments"
  ADD CONSTRAINT "payments_user_id_users_id_fk" 
  FOREIGN KEY ("user_id") REFERENCES "users"("id");

ALTER TABLE "payments"
  ADD CONSTRAINT "payments_olympiad_id_olympiads_id_fk" 
  FOREIGN KEY ("olympiad_id") REFERENCES "olympiads"("id"); 