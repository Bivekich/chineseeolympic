import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  uuid,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const users = pgTable("users", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  verificationToken: text("verification_token"),
  resetPasswordToken: text("reset_password_token"),
  resetPasswordExpires: timestamp("reset_password_expires"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const olympiads = pgTable("olympiads", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  level: text("level").notNull(), // difficulty level
  creatorId: text("creator_id")
    .notNull()
    .references(() => users.id),
  isCompleted: boolean("is_completed").default(false).notNull(),
  isDraft: boolean("is_draft").default(true).notNull(),
  hasQuestions: boolean("has_questions").default(false).notNull(),
  hasPrizes: boolean("has_prizes").default(false).notNull(), // New field
  duration: integer("duration").notNull().default(7200), // Duration in seconds, default 2 hours
  randomizeQuestions: boolean("randomize_questions").default(false).notNull(),
  questionsPerParticipant: integer("questions_per_participant"), // null means all questions
  price: integer("price").notNull().default(0), // Price in kopeks (1 ruble = 100 kopeks)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const prizes = pgTable("prizes", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  olympiadId: text("olympiad_id")
    .notNull()
    .references(() => olympiads.id),
  placement: integer("placement").notNull(), // 1 for first place, 2 for second, etc.
  promoCode: text("promo_code"), // Making promo code optional
  description: text("description"), // Optional description of the prize
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const questions = pgTable("questions", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  olympiadId: text("olympiad_id")
    .notNull()
    .references(() => olympiads.id),
  question: text("question").notNull(),
  type: text("type").notNull().default("text"), // 'text', 'multiple_choice', or 'matching'
  choices: text("choices"), // JSON array of choices for multiple choice questions
  matchingPairs: text("matching_pairs"), // JSON array of {left: string, right: string} for matching questions
  correctAnswer: text("correct_answer").notNull(), // For matching, this will be a JSON string of correct pairs
  media: text("media"), // JSON object storing media info: {type: 'image'|'video'|'audio', url: string}
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const participantResults = pgTable("participant_results", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  olympiadId: text("olympiad_id")
    .notNull()
    .references(() => olympiads.id),
  score: text("score").notNull(),
  answers: text("answers").notNull(), // JSON string of answers
  place: text("place"), // will be set after olympiad completion
  certificateUrl: text("certificate_url"),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

export const participantDetails = pgTable("participant_details", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  olympiadId: text("olympiad_id")
    .notNull()
    .references(() => olympiads.id),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  country: text("country").notNull(),
  city: text("city").notNull(),
  age: integer("age").notNull(),
  educationType: text("education_type").notNull(),
  grade: text("grade"),
  institutionName: text("institution_name"),
  phoneNumber: text("phone_number").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  olympiadId: text("olympiad_id")
    .notNull()
    .references(() => olympiads.id),
  amount: integer("amount").notNull(),
  status: text("status", { enum: ["pending", "completed", "failed"] })
    .notNull()
    .default("pending"),
  paymentId: text("payment_id"),
  paymentUrl: text("payment_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
