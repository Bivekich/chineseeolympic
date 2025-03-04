import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { olympiads } from '@/lib/db/schema';
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

    console.log('Fetching created olympiads for user:', userId); // Debug log

    const createdOlympiads = await db
      .select()
      .from(olympiads)
      .where(eq(olympiads.creatorId, userId));

    console.log('Found olympiads:', createdOlympiads); // Debug log

    return NextResponse.json(createdOlympiads);
  } catch (error) {
    console.error('Error fetching created olympiads:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
