import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { questions, olympiads } from "@/lib/db/schema";
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

    const olympiadQuestions = await db.query.questions.findMany({
      where: eq(questions.olympiadId, params.id),
    });

    return NextResponse.json(olympiadQuestions);
  } catch (error) {
    console.error("Error fetching questions:", error);
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

    const { questions: newQuestions, publish } = await request.json();

    // Validate questions
    if (!Array.isArray(newQuestions) || newQuestions.length === 0) {
      return NextResponse.json(
        { message: "Invalid questions data" },
        { status: 400 }
      );
    }

    for (const q of newQuestions) {
      if (!q.question || !q.correctAnswer) {
        return NextResponse.json(
          {
            message: "All questions must have question text and correct answer",
          },
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
      // Delete existing questions
      await tx.delete(questions).where(eq(questions.olympiadId, params.id));

      // Insert new questions
      await tx.insert(questions).values(
        newQuestions.map((q: any) => ({
          olympiadId: params.id,
          question: q.question,
          correctAnswer: q.correctAnswer,
        }))
      );

      // Update olympiad status if publishing
      if (publish) {
        await tx
          .update(olympiads)
          .set({
            isDraft: false,
            hasQuestions: true,
          })
          .where(eq(olympiads.id, params.id));
      } else {
        await tx
          .update(olympiads)
          .set({
            hasQuestions: true,
          })
          .where(eq(olympiads.id, params.id));
      }
    });

    return NextResponse.json({ message: "Questions updated successfully" });
  } catch (error) {
    console.error("Error updating questions:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
