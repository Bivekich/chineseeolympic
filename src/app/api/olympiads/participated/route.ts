import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { olympiads, participantResults } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const userId = await verifyAuth();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    console.log('Fetching participated olympiads for user:', userId);

    const results = await db
      .select({
        id: participantResults.id,
        score: participantResults.score,
        olympiad: {
          id: olympiads.id,
          title: olympiads.title,
          level: olympiads.level,
          startDate: olympiads.startDate,
          endDate: olympiads.endDate,
          isCompleted: olympiads.isCompleted,
        },
      })
      .from(participantResults)
      .innerJoin(olympiads, eq(participantResults.olympiadId, olympiads.id))
      .where(eq(participantResults.userId, userId))
      .orderBy(participantResults.completedAt);

    console.log('Found results:', results);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching participated olympiads:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
