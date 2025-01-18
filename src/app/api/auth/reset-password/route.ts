import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/utils";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    const user = await db.query.users.findFirst({
      where: eq(users.resetPasswordToken, token),
    });

    if (!user || !user.resetPasswordExpires) {
      return NextResponse.json(
        { error: "Недействительный токен сброса пароля" },
        { status: 400 }
      );
    }

    if (new Date() > user.resetPasswordExpires) {
      return NextResponse.json(
        { error: "Срок действия токена истек" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    await db
      .update(users)
      .set({
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({
      message: "Пароль успешно изменен",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "Ошибка при сбросе пароля" },
      { status: 500 }
    );
  }
}
