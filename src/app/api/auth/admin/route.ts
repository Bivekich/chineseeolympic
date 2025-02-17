import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";

export async function GET() {
  try {
    const isAdmin = await verifyAdmin();
    return NextResponse.json({ isAdmin });
  } catch (error) {
    console.error("Error checking admin status:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
