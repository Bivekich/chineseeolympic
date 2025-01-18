import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { generateToken, sendPasswordResetEmail } from "@/lib/auth/utils";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      // Return success even if user doesn't exist for security
      return NextResponse.json({
        message:
          "Если указанный email зарегистрирован, вы получите инструкции по восстановлению пароля",
      });
    }

    const resetToken = generateToken();
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await db
      .update(users)
      .set({
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires,
      })
      .where(eq(users.id, user.id));

    await sendPasswordResetEmail(email, resetToken);

    return NextResponse.json({
      message:
        "Если указанный email зарегистрирован, вы получите инструкции по восстановлению пароля",
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    return NextResponse.json(
      { error: "Ошибка при запросе сброса пароля" },
      { status: 500 }
    );
  }
}
