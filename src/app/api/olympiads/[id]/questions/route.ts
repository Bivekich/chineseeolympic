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

    // Parse JSON strings back into arrays/objects
    const parsedQuestions = olympiadQuestions.map((q) => ({
      ...q,
      choices: q.choices ? JSON.parse(q.choices) : null,
      matchingPairs: q.matchingPairs ? JSON.parse(q.matchingPairs) : null,
      media: q.media ? JSON.parse(q.media) : null,
    }));

    return NextResponse.json(parsedQuestions);
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
      if (!q.question) {
        return NextResponse.json(
          {
            message: "All questions must have question text",
          },
          { status: 400 }
        );
      }

      // Validate based on question type
      switch (q.type) {
        case "text":
          if (!q.correctAnswer) {
            return NextResponse.json(
              {
                message: "Text questions must have a correct answer",
              },
              { status: 400 }
            );
          }
          break;

        case "multiple_choice":
          if (
            !q.choices ||
            !Array.isArray(q.choices) ||
            q.choices.length < 2 ||
            !q.correctAnswer
          ) {
            return NextResponse.json(
              {
                message:
                  "Multiple choice questions must have at least 2 choices and a correct answer",
              },
              { status: 400 }
            );
          }
          break;

        case "matching":
          if (
            !q.matchingPairs ||
            !Array.isArray(q.matchingPairs) ||
            q.matchingPairs.length < 2
          ) {
            return NextResponse.json(
              {
                message: "Matching questions must have at least 2 pairs",
              },
              { status: 400 }
            );
          }
          // For matching questions, set correctAnswer as stringified pairs
          q.correctAnswer = JSON.stringify(q.matchingPairs);
          break;

        default:
          return NextResponse.json(
            {
              message: "Invalid question type",
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
          type: q.type,
          correctAnswer: q.correctAnswer,
          choices: q.choices ? JSON.stringify(q.choices) : null,
          matchingPairs: q.matchingPairs
            ? JSON.stringify(q.matchingPairs)
            : null,
          media: q.media ? JSON.stringify(q.media) : null,
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
