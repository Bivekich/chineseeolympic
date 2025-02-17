import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { participantResults, olympiads } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { verifyAuth } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await verifyAuth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get the result with olympiad details
    const results = await db
      .select({
        result: participantResults,
        olympiad: olympiads,
      })
      .from(participantResults)
      .innerJoin(olympiads, eq(participantResults.olympiadId, olympiads.id))
      .where(
        and(
          eq(participantResults.userId, userId),
          eq(participantResults.olympiadId, params.id)
        )
      )
      .limit(1);

    if (!results.length) {
      return NextResponse.json(
        { message: "Result not found" },
        { status: 404 }
      );
    }

    const { result, olympiad } = results[0];

    return NextResponse.json({
      id: result.id,
      score: result.score,
      completedAt: result.completedAt,
      olympiad: {
        title: olympiad.title,
        level: olympiad.level,
      },
    });
  } catch (error) {
    console.error("Error fetching result:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
