import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { participantResults, questions, olympiads } from "@/lib/db/schema";
import { verifyAuth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

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

    // Get the olympiad first to check questionsPerParticipant
    const olympiad = await db
      .select()
      .from(olympiads)
      .where(eq(olympiads.id, params.id))
      .then(res => res[0]);

    if (!olympiad) {
      return NextResponse.json(
        { message: "Olympiad not found" },
        { status: 404 }
      );
    }

    // Get all questions for this olympiad
    let olympiadQuestions = await db
      .select()
      .from(questions)
      .where(eq(questions.olympiadId, params.id));

    // If olympiad has questionsPerParticipant set, we need to determine which questions
    // this user actually received. We can do this by looking at their answers.
    if (olympiad.questionsPerParticipant && olympiad.questionsPerParticipant < olympiadQuestions.length) {
      // Filter questions to only those that were answered
      olympiadQuestions = olympiadQuestions.filter(q => answers.hasOwnProperty(q.id));
    }

    if (!olympiadQuestions.length) {
      return NextResponse.json(
        { message: "No questions found for this olympiad" },
        { status: 404 }
      );
    }

    // Calculate score
    let correctAnswers = 0;
    console.log("\n=== Starting Score Calculation ===");
    
    for (const question of olympiadQuestions) {
      console.log(`\nQuestion ${question.id} (Type: ${question.type}):`);
      console.log("Question text:", question.question);
      
      const userAnswer = answers[question.id]?.trim() || "";
      const correctAnswer = question.correctAnswer.trim();
      
      let isCorrect = false;

      if (question.type === "multiple_choice") {
        // For multiple choice, do exact match
        console.log("Multiple Choice - Comparing:");
        console.log("User answer:", userAnswer);
        console.log("Correct answer:", correctAnswer);
        isCorrect = userAnswer === correctAnswer;
        
      } else if (question.type === "matching") {
        try {
          // Parse the user's answers (which should be a JSON string of an object)
          const userAnswersObj = JSON.parse(userAnswer);
          const matchingPairs = JSON.parse(question.matchingPairs || "[]");
          
          console.log("Matching - Comparing:");
          console.log("User answers:", JSON.stringify(userAnswersObj, null, 2));
          console.log("Correct pairs:", JSON.stringify(matchingPairs, null, 2));

          // Check if all pairs match correctly
          let allPairsCorrect = true;
          for (const pair of matchingPairs) {
            const userRightItem = userAnswersObj[pair.left];
            console.log(`Checking pair - Left: "${pair.left}"`);
            console.log(`User matched with: "${userRightItem}"`);
            console.log(`Expected match: "${pair.right}"`);
            
            if (userRightItem !== pair.right) {
              console.log("❌ This pair is incorrect");
              allPairsCorrect = false;
              break;
            } else {
              console.log("✓ This pair is correct");
            }
          }

          isCorrect = allPairsCorrect;
          
        } catch (error) {
          console.error("Error evaluating matching answers for question", question.id, ":", error);
          console.error("Raw user answer:", userAnswer);
          console.error("Raw matching pairs:", question.matchingPairs);
          isCorrect = false;
        }
      } else {
        // For text questions, do case-insensitive comparison
        console.log("Text Question - Comparing:");
        console.log("User answer (lowercase):", userAnswer.toLowerCase());
        console.log("Correct answer (lowercase):", correctAnswer.toLowerCase());
        isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase();
      }

      if (isCorrect) {
        correctAnswers++;
        console.log("✓ Question marked as CORRECT");
      } else {
        console.log("❌ Question marked as INCORRECT");
      }
    }

    console.log("\n=== Final Score Calculation ===");
    console.log("Total questions:", olympiadQuestions.length);
    console.log("Correct answers:", correctAnswers);
    const score = Math.round((correctAnswers / olympiadQuestions.length) * 100);
    console.log("Final score:", score);

    // Check if user already has a result for this olympiad
    const existingResult = await db
      .select()
      .from(participantResults)
      .where(
        and(
          eq(participantResults.userId, userId),
          eq(participantResults.olympiadId, params.id)
        )
      )
      .then(res => res[0]);

    let result;
    if (existingResult) {
      // Update existing result but keep original completion time
      [result] = await db
        .update(participantResults)
        .set({
          score: score.toString(),
          answers: JSON.stringify(answers),
        })
        .where(eq(participantResults.id, existingResult.id))
        .returning();
    } else {
      // Create new result with current completion time
      const now = new Date();
      [result] = await db
        .insert(participantResults)
        .values({
          userId,
          olympiadId: params.id,
          score: score.toString(),
          answers: JSON.stringify(answers),
          completedAt: now,
        })
        .returning();
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error submitting answers:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
