import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { olympiads, prizes } from "@/lib/db/schema";
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
        description: olympiads.description,
        level: olympiads.level,
        startDate: olympiads.startDate,
        endDate: olympiads.endDate,
        isCompleted: olympiads.isCompleted,
        price: olympiads.price,
        questionsPerParticipant: olympiads.questionsPerParticipant,
        hasPrizes: olympiads.hasPrizes,
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

    // Get prizes for each olympiad
    const olympiadsWithPrizes = await Promise.all(
      availableOlympiads.map(async (olympiad) => {
        if (olympiad.hasPrizes) {
          const olympiadPrizes = await db
            .select({
              placement: prizes.placement,
              description: prizes.description,
            })
            .from(prizes)
            .where(eq(prizes.olympiadId, olympiad.id))
            .orderBy(prizes.placement);

          // Format prizes information
          const prizesText = olympiadPrizes
            .map((prize) => {
              const place = prize.placement === 1 ? "1-е место" :
                          prize.placement === 2 ? "2-е место" :
                          prize.placement === 3 ? "3-е место" :
                          `${prize.placement}-е место`;
              return `${place}${prize.description ? `: ${prize.description}` : ''}`;
            })
            .join('\n');

          return {
            ...olympiad,
            prizes: prizesText || null
          };
        }
        return olympiad;
      })
    );

    return NextResponse.json(olympiadsWithPrizes);
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
