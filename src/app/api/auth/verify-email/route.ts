import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    const user = await db.query.users.findFirst({
      where: eq(users.verificationToken, token),
    });

    if (!user) {
      return NextResponse.json(
        { error: "Недействительный токен верификации" },
        { status: 400 }
      );
    }

    // Update user
    await db
      .update(users)
      .set({
        emailVerified: true,
        verificationToken: null,
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({
      message: "Email успешно подтвержден",
    });
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { error: "Ошибка при подтверждении email" },
      { status: 500 }
    );
  }
}
