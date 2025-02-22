import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  olympiads,
  questions,
  prizes,
  participantResults,
  participantDetails,
  payments,
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

    // Check if olympiad is available
    const now = new Date();
    const startDate = new Date(olympiad[0].startDate);
    const endDate = new Date(olympiad[0].endDate);

    if (now < startDate) {
      return NextResponse.json(
        { message: "Olympiad has not started yet" },
        { status: 400 }
      );
    }

    if (now > endDate) {
      return NextResponse.json(
        { message: "Olympiad has ended" },
        { status: 400 }
      );
    }

    // Return olympiad details including price
    return NextResponse.json({
      id: olympiad[0].id,
      title: olympiad[0].title,
      level: olympiad[0].level,
      startDate: olympiad[0].startDate,
      endDate: olympiad[0].endDate,
      duration: olympiad[0].duration,
      price: olympiad[0].price,
      randomizeQuestions: olympiad[0].randomizeQuestions,
      questionsPerParticipant: olympiad[0].questionsPerParticipant,
      isDraft: olympiad[0].isDraft,
      hasQuestions: olympiad[0].hasQuestions,
      hasPrizes: olympiad[0].hasPrizes,
      isCompleted: olympiad[0].isCompleted
    });
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
    console.log("Starting olympiad deletion process for ID:", params.id);
    
    const userId = await verifyAuth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // First check if the olympiad exists and if the user is the creator
    const existingOlympiad = await db.query.olympiads.findFirst({
      where: eq(olympiads.id, params.id),
    });

    console.log("Found olympiad:", existingOlympiad);

    if (!existingOlympiad) {
      return NextResponse.json(
        { message: "Olympiad not found" },
        { status: 404 }
      );
    }

    if (existingOlympiad.creatorId !== userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Delete all related records in a transaction
    try {
      await db.transaction(async (tx) => {
        console.log("Starting deletion transaction");
        
        // Delete participant details first
        const deletedDetails = await tx
          .delete(participantDetails)
          .where(eq(participantDetails.olympiadId, params.id))
          .returning();
        console.log("Deleted participant details:", deletedDetails.length);

        // Delete participant results
        const deletedResults = await tx
          .delete(participantResults)
          .where(eq(participantResults.olympiadId, params.id))
          .returning();
        console.log("Deleted participant results:", deletedResults.length);

        // Delete questions
        const deletedQuestions = await tx
          .delete(questions)
          .where(eq(questions.olympiadId, params.id))
          .returning();
        console.log("Deleted questions:", deletedQuestions.length);

        // Delete prizes
        const deletedPrizes = await tx
          .delete(prizes)
          .where(eq(prizes.olympiadId, params.id))
          .returning();
        console.log("Deleted prizes:", deletedPrizes.length);

        // Delete payments
        const deletedPayments = await tx
          .delete(payments)
          .where(eq(payments.olympiadId, params.id))
          .returning();
        console.log("Deleted payments:", deletedPayments.length);

        // Finally, delete the olympiad
        const deletedOlympiad = await tx
          .delete(olympiads)
          .where(eq(olympiads.id, params.id))
          .returning();
        console.log("Deleted olympiad:", deletedOlympiad.length);
      });
      console.log("Deletion transaction completed successfully");
    } catch (txError: unknown) {
      console.error("Transaction error:", txError);
      throw new Error(`Database transaction failed: ${txError instanceof Error ? txError.message : String(txError)}`);
    }

    return NextResponse.json({ message: "Olympiad deleted successfully" });
  } catch (error) {
    console.error("Error deleting olympiad:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
