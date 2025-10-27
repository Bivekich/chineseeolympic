import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { prizes, olympiads } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await verifyAuth();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { promoCodes } = await request.json();
    const { id } = await params;

    // Validate promo codes
    if (!Array.isArray(promoCodes)) {
      return NextResponse.json(
        { message: 'Invalid promo codes data' },
        { status: 400 }
      );
    }

    // Verify olympiad ownership and completion
    const olympiad = await db.query.olympiads.findFirst({
      where: eq(olympiads.id, id),
    });

    if (!olympiad) {
      return NextResponse.json(
        { message: 'Olympiad not found' },
        { status: 404 }
      );
    }

    if (olympiad.creatorId !== userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!olympiad.isCompleted) {
      return NextResponse.json(
        { message: 'Cannot add promo codes before olympiad completion' },
        { status: 400 }
      );
    }

    // Get existing prizes
    interface Prize {
      id: string;
      olympiadId: string;
      placement: number;
      description: string;
      promoCode: string | null;
      createdAt: Date;
    }

    const existingPrizes = (await db
      .select()
      .from(prizes)
      .where(eq(prizes.olympiadId, id))) as Prize[];

    // Sort prizes by placement after query
    const sortedPrizes = [...existingPrizes].sort(
      (a, b) => a.placement - b.placement
    );

    if (existingPrizes.length !== promoCodes.length) {
      return NextResponse.json(
        { message: 'Number of promo codes must match number of prizes' },
        { status: 400 }
      );
    }

    // Update prizes with promo codes
    await Promise.all(
      existingPrizes.map((prize: Prize, index: number) =>
        db
          .update(prizes)
          .set({ promoCode: promoCodes[index] })
          .where(eq(prizes.id, prize.id))
      )
    );

    return NextResponse.json({ message: 'Promo codes added successfully' });
  } catch (error) {
    console.error('Error adding promo codes:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
