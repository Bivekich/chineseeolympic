import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { olympiads, participantResults, prizes, participantDetails } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { verifyAuth } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await verifyAuth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { participantId, promoCode } = await request.json();

    // Get the olympiad
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

    // First get participant details
    const participant = await db.query.participantDetails.findFirst({
      where: eq(participantDetails.id, participantId)
    });

    if (!participant) {
      return NextResponse.json(
        { message: "Participant details not found" },
        { status: 404 }
      );
    }

    // Then get the participant result using the participant's userId
    const result = await db.query.participantResults.findFirst({
      where: and(
        eq(participantResults.olympiadId, params.id),
        eq(participantResults.userId, participant.userId)
      ),
    });

    if (!result) {
      return NextResponse.json(
        { message: "Participant result not found" },
        { status: 404 }
      );
    }

    // Get the prize based on participant's place
    const prize = await db.query.prizes.findFirst({
      where: and(
        eq(prizes.olympiadId, params.id),
        eq(prizes.placement, parseInt(result.place || "0"))
      ),
    });

    if (!prize) {
      return NextResponse.json(
        { message: "Prize not found" },
        { status: 404 }
      );
    }

    // Update the prize with the promo code
    await db
      .update(prizes)
      .set({ promoCode })
      .where(eq(prizes.id, prize.id));

    // Send email to the winner
    try {
      await sendEmail({
        to: participant.email,
        subject: `Поздравляем с ${result.place} местом в олимпиаде "${olympiad.title}"!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #7f1d1d, #991b1b); border-radius: 16px; padding: 40px 20px; text-align: center; color: white; margin-bottom: 20px;">
              <h1 style="margin: 0; font-size: 36px; margin-bottom: 10px;">汉语之星</h1>
              <p style="margin: 0; font-size: 20px;">Олимпиада по китайскому языку</p>
            </div>
            
            <div style="background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #1f2937; margin-top: 0;">Поздравляем!</h2>
              <p style="color: #4b5563;">Уважаемый(ая) ${participant.fullName}!</p>
              <p style="color: #4b5563;">Вы заняли ${result.place} место в олимпиаде "${olympiad.title}" с результатом ${result.score}%.</p>
              
              <div style="margin: 20px 0; padding: 20px; background-color: #fef3c7; border-radius: 8px;">
                <p style="color: #92400e; margin: 0;">🏆 Ваш приз: ${prize.description || `Приз за ${result.place} место`}</p>
                <p style="color: #92400e; font-weight: bold; margin: 10px 0 0 0;">🎫 Ваш промокод: ${promoCode}</p>
              </div>
              
             
            </div>
            
            <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px;">
              <p>Это автоматическое сообщение, пожалуйста, не отвечайте на него.</p>
            </div>
          </div>
        `,
      });
    } catch (error) {
      console.error("Error sending email:", error);
      return NextResponse.json(
        { message: "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Prize sent successfully" });
  } catch (error) {
    console.error("Error sending prize:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
} 