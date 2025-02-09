import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { olympiads } from "@/lib/db/schema";
import { eq, and, lte, gte } from "drizzle-orm";
import { verifyAuth } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await verifyAuth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    console.log("Fetching available olympiads for user:", userId); // Debug log

    const currentDate = new Date();
    console.log("Current date:", currentDate); // Debug log

    // Get all non-draft olympiads that are currently ongoing
    const availableOlympiads = await db
      .select({
        id: olympiads.id,
        title: olympiads.title,
        level: olympiads.level,
        startDate: olympiads.startDate,
        endDate: olympiads.endDate,
        isCompleted: olympiads.isCompleted,
      })
      .from(olympiads)
      .where(
        and(
          eq(olympiads.isDraft, false),
          eq(olympiads.isCompleted, false),
          lte(olympiads.startDate, currentDate), // Current date should be after start date
          gte(olympiads.endDate, currentDate) // Current date should be before end date
        )
      );

    console.log("Found olympiads:", availableOlympiads); // Debug log

    return NextResponse.json(availableOlympiads);
  } catch (error) {
    // Log the full error for debugging
    console.error("[OLYMPIADS_AVAILABLE] Detailed error:", error);
    return NextResponse.json(
      {
        message: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
