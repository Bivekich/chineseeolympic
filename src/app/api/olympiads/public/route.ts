import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { olympiads, prizes } from '@/lib/db/schema';
import { eq, and, lte, gte } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const currentDate = new Date();

    // Get all non-draft olympiads that are currently ongoing or upcoming (starting within 30 days)
    const futureDate = new Date();
    futureDate.setDate(currentDate.getDate() + 30);

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
          lte(olympiads.startDate, futureDate) // Start date within the next 30 days or already started
        )
      );

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
          const prizesInfo = olympiadPrizes.map((prize) => ({
            placement: prize.placement,
            description: prize.description,
          }));

          return {
            ...olympiad,
            prizes: prizesInfo || [],
          };
        }
        return {
          ...olympiad,
          prizes: [],
        };
      })
    );

    return NextResponse.json(olympiadsWithPrizes);
  } catch (error) {
    console.error('[PUBLIC_OLYMPIADS] Error:', error);
    return NextResponse.json(
      {
        message: 'Internal Server Error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
