import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { olympiads, participantResults } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyAuth, verifyAdmin } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await verifyAuth();
    const isAdmin = await verifyAdmin();

    if (!userId || !isAdmin) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the olympiad
    const olympiad = await db
      .select()
      .from(olympiads)
      .where(eq(olympiads.id, params.id))
      .then((res) => res[0]);

    if (!olympiad) {
      return NextResponse.json(
        { message: "Olympiad not found" },
        { status: 404 }
      );
    }

    if (olympiad.creatorId !== userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (olympiad.isCompleted) {
      return NextResponse.json(
        { message: "Olympiad is already completed" },
        { status: 400 }
      );
    }

    // Get all participant results
    const results = await db
      .select()
      .from(participantResults)
      .where(eq(participantResults.olympiadId, params.id));

    // Sort results by score
    const sortedResults = results.sort((a, b) => 
      parseInt(b.score) - parseInt(a.score)
    );

    // Update places for participants
    await Promise.all(
      sortedResults.map((result, index) =>
        db
          .update(participantResults)
          .set({ place: (index + 1).toString() })
          .where(eq(participantResults.id, result.id))
      )
    );

    // Mark olympiad as completed
    await db
      .update(olympiads)
      .set({
        isCompleted: true,
        updatedAt: new Date(),
      })
      .where(eq(olympiads.id, params.id));

    return NextResponse.json({ message: "Olympiad ended successfully" });
  } catch (error) {
    console.error("Error ending olympiad:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
} 