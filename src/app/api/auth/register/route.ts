import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import {
  hashPassword,
  generateToken,
  sendVerificationEmail,
} from "@/lib/auth/utils";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    console.log("Starting registration process...");
    const { email, password } = await req.json();
    console.log("Received registration request for email:", email);

    // Check if user already exists
    console.log("Checking if user exists...");
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      console.log("User already exists with email:", email);
      return NextResponse.json(
        { error: "Email уже зарегистрирован" },
        { status: 400 }
      );
    }

    console.log("Hashing password...");
    const hashedPassword = await hashPassword(password);
    const verificationToken = generateToken();
    console.log("Generated verification token:", verificationToken);

    // Create new user
    console.log("Creating new user...");
    try {
      await db.insert(users).values({
        email,
        password: hashedPassword,
        verificationToken,
      });
      console.log("User created successfully");
    } catch (dbError) {
      console.error("Database error while creating user:", dbError);
      throw dbError;
    }

    // Send verification email
    console.log("Attempting to send verification email...");
    try {
      const emailResult = await sendVerificationEmail(email, verificationToken);
      console.log("Email sending result:", emailResult);
    } catch (emailError: any) {
      console.error(
        "Failed to send verification email. Full error:",
        emailError
      );
      console.error("Error message:", emailError.message);
      console.error("Error stack:", emailError.stack);
      if (emailError.response) {
        console.error("Resend API response:", emailError.response);
      }

      // Delete the user if email sending fails
      console.log("Rolling back user creation...");
      await db.delete(users).where(eq(users.email, email));

      return NextResponse.json(
        {
          error:
            "Ошибка при отправке email подтверждения. Пожалуйста, попробуйте позже.",
          details:
            process.env.NODE_ENV === "development"
              ? emailError.message
              : undefined,
        },
        { status: 500 }
      );
    }

    console.log("Registration completed successfully");
    return NextResponse.json(
      {
        message: "Регистрация успешна. Проверьте вашу почту для подтверждения.",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Unhandled registration error:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      {
        error: "Ошибка при регистрации",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
