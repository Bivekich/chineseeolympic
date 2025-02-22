import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { prizes, olympiads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyAuth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await verifyAuth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const olympiadPrizes = await db.query.prizes.findMany({
      where: eq(prizes.olympiadId, params.id),
      orderBy: (fields) => fields.placement,
    });

    return NextResponse.json(olympiadPrizes);
  } catch (error) {
    console.error("Error fetching prizes:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await verifyAuth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { prizes: newPrizes, publish } = await request.json();

    // Validate prizes
    if (!Array.isArray(newPrizes) || newPrizes.length === 0) {
      return NextResponse.json(
        { message: "Invalid prizes data" },
        { status: 400 }
      );
    }

    // Only validate placement, promoCode is now optional
    for (const prize of newPrizes) {
      if (!prize.placement) {
        return NextResponse.json(
          { message: "All prizes must have a placement" },
          { status: 400 }
        );
      }
    }

    // Verify olympiad ownership
    const olympiad = await db.query.olympiads.findFirst({
      where: eq(olympiads.id, params.id),
    });

    if (!olympiad) {
      return NextResponse.json(
        { message: "Olympiad not found" },
        { status: 404 }
      );
    }

    if (olympiad.creatorId !== userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Start a transaction
    await db.transaction(async (tx) => {
      // Delete existing prizes
      await tx.delete(prizes).where(eq(prizes.olympiadId, params.id));

      // Insert new prizes
      await tx.insert(prizes).values(
        newPrizes.map((prize: any) => ({
          olympiadId: params.id,
          placement: prize.placement,
          promoCode: prize.promoCode || null, // Make promoCode optional
          description: prize.description,
        }))
      );

      // Update olympiad status if publishing
      if (publish) {
        await tx
          .update(olympiads)
          .set({
            isDraft: false,
            hasPrizes: true,
          })
          .where(eq(olympiads.id, params.id));
      } else {
        await tx
          .update(olympiads)
          .set({
            hasPrizes: true,
          })
          .where(eq(olympiads.id, params.id));
      }
    });

    return NextResponse.json({ message: "Prizes updated successfully" });
  } catch (error) {
    console.error("Error updating prizes:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
