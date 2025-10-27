import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { olympiads } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await verifyAuth();
    // Only the creator should be able to reopen their olympiad
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get the olympiad
    const olympiad = await db
      .select()
      .from(olympiads)
      .where(eq(olympiads.id, id))
      .then((res: any[]) => res[0]);

    if (!olympiad) {
      return NextResponse.json(
        { message: 'Olympiad not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (olympiad.creatorId !== userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if it's actually completed
    if (!olympiad.isCompleted) {
      return NextResponse.json(
        { message: 'Olympiad is not completed' },
        { status: 400 } // Bad Request
      );
    }

    // Mark olympiad as not completed (reopen)
    await db
      .update(olympiads)
      .set({
        isCompleted: false,
        updatedAt: new Date(),
      })
      .where(eq(olympiads.id, id));

    return NextResponse.json({ message: 'Olympiad reopened successfully' });

  } catch (error) {
    console.error('Error reopening olympiad:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 