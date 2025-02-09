import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { participantResults, questions } from "@/lib/db/schema";
import { verifyAuth } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await verifyAuth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { answers } = await request.json();

    // Get all questions for this olympiad
    const olympiadQuestions = await db
      .select()
      .from(questions)
      .where(eq(questions.olympiadId, params.id));

    if (!olympiadQuestions.length) {
      return NextResponse.json(
        { message: "No questions found for this olympiad" },
        { status: 404 }
      );
    }

    // Calculate score
    let correctAnswers = 0;
    for (const question of olympiadQuestions) {
      const userAnswer = answers[question.id]?.trim() || "";
      const correctAnswer = question.correctAnswer.trim();

      if (question.type === "multiple_choice") {
        // For multiple choice, do exact match
        if (userAnswer === correctAnswer) {
          correctAnswers++;
        }
      } else if (question.type === "matching") {
        try {
          // Parse the user's answers and the matching pairs
          const userAnswers = JSON.parse(userAnswer);
          const matchingPairs = JSON.parse(question.matchingPairs || "[]");

          // Check if all pairs match correctly
          const isCorrect = userAnswers.every((answer: any, index: number) => {
            const userLeftItem = matchingPairs[index].left;
            const userRightItem = userAnswers[userLeftItem];
            return userRightItem === matchingPairs[index].right;
          });

          if (isCorrect) {
            correctAnswers++;
          }
        } catch (error) {
          console.error("Error evaluating matching answers:", error);
        }
      } else {
        // For text questions, do case-insensitive comparison
        if (userAnswer.toLowerCase() === correctAnswer.toLowerCase()) {
          correctAnswers++;
        }
      }
    }

    const score = Math.round((correctAnswers / olympiadQuestions.length) * 100);

    // Save results
    const [result] = await db
      .insert(participantResults)
      .values({
        userId,
        olympiadId: params.id,
        score: score.toString(),
        answers: JSON.stringify(answers),
      })
      .returning();

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error submitting answers:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
