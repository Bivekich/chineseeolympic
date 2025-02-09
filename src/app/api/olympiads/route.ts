import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { olympiads } from "@/lib/db/schema";
import { verifyAuth } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const userId = await verifyAuth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, level, startDate, endDate } = body;

    // Validate required fields
    if (!title || !level || !startDate || !endDate) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) {
      return NextResponse.json(
        { message: "End date must be after start date" },
        { status: 400 }
      );
    }

    // Create olympiad
    const [olympiad] = await db
      .insert(olympiads)
      .values({
        title,
        level,
        startDate: start,
        endDate: end,
        creatorId: userId,
        isDraft: true,
        hasQuestions: false,
        hasPrizes: false,
        isCompleted: false,
      })
      .returning();

    return NextResponse.json(olympiad);
  } catch (error) {
    console.error("Error creating olympiad:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const userId = await verifyAuth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const type = url.searchParams.get("type");

    // If type is "created", return only olympiads created by the user
    if (type === "created") {
      const createdOlympiads = await db
        .select()
        .from(olympiads)
        .where(eq(olympiads.creatorId, userId));
      return NextResponse.json(createdOlympiads);
    }

    // Otherwise, return all olympiads that are not drafts
    const allOlympiads = await db
      .select()
      .from(olympiads)
      .where(eq(olympiads.isDraft, false));
    return NextResponse.json(allOlympiads);
  } catch (error) {
    console.error("Error fetching olympiads:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
