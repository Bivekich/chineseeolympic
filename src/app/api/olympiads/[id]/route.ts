import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  olympiads,
  questions,
  prizes,
  participantResults,
} from "@/lib/db/schema";
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

    // First try to find the olympiad
    const olympiad = await db
      .select()
      .from(olympiads)
      .where(eq(olympiads.id, params.id))
      .limit(1);

    if (!olympiad || olympiad.length === 0) {
      return NextResponse.json(
        { message: "Olympiad not found" },
        { status: 404 }
      );
    }

    // If the olympiad is a draft, only the creator can view it
    if (olympiad[0].isDraft && olympiad[0].creatorId !== userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(olympiad[0]);
  } catch (error) {
    console.error("Error fetching olympiad:", error);
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

    // First check if the olympiad exists and if the user is the creator
    const existingOlympiad = await db
      .select()
      .from(olympiads)
      .where(eq(olympiads.id, params.id))
      .limit(1);

    if (!existingOlympiad || existingOlympiad.length === 0) {
      return NextResponse.json(
        { message: "Olympiad not found" },
        { status: 404 }
      );
    }

    if (existingOlympiad[0].creatorId !== userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, level, startDate, endDate, isDraft } = body;

    // Update the olympiad
    const [updatedOlympiad] = await db
      .update(olympiads)
      .set({
        title,
        level,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        isDraft,
        updatedAt: new Date(),
      })
      .where(eq(olympiads.id, params.id))
      .returning();

    return NextResponse.json(updatedOlympiad);
  } catch (error) {
    console.error("Error updating olympiad:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await verifyAuth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // First check if the olympiad exists and if the user is the creator
    const existingOlympiad = await db.query.olympiads.findFirst({
      where: eq(olympiads.id, params.id),
    });

    if (!existingOlympiad) {
      return NextResponse.json(
        { message: "Olympiad not found" },
        { status: 404 }
      );
    }

    if (existingOlympiad.creatorId !== userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Check if the olympiad is completed
    if (existingOlympiad.isCompleted) {
      return NextResponse.json(
        { message: "Cannot delete completed olympiad" },
        { status: 400 }
      );
    }

    // Delete all related records in a transaction
    await db.transaction(async (tx) => {
      // Delete participant results first (if any)
      await tx
        .delete(participantResults)
        .where(eq(participantResults.olympiadId, params.id));

      // Delete questions
      await tx.delete(questions).where(eq(questions.olympiadId, params.id));

      // Delete prizes
      await tx.delete(prizes).where(eq(prizes.olympiadId, params.id));

      // Finally, delete the olympiad
      await tx.delete(olympiads).where(eq(olympiads.id, params.id));
    });

    return NextResponse.json({ message: "Olympiad deleted successfully" });
  } catch (error) {
    console.error("Error deleting olympiad:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
