import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json({ message: "Выход выполнен успешно" });
    response.cookies.delete("auth-token");
    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Ошибка при выходе" }, { status: 500 });
  }
}
