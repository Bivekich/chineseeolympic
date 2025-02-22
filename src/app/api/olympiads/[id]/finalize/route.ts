import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { olympiads, participantResults, users, prizes, participantDetails } from "@/lib/db/schema";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { eq, and, desc } from "drizzle-orm";
import { generateCertificate } from "@/lib/certificates";
import { sendEmail } from "@/lib/email";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

async function getUserId() {
  const token = cookies().get("auth-token")?.value;
  if (!token) return null;

  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload.userId as string;
  } catch {
    return null;
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get the promo codes from the request body
    const { promoCodes } = await req.json();
    if (!promoCodes || !Array.isArray(promoCodes) || promoCodes.length !== 3) {
      return NextResponse.json(
        { message: "Необходимо указать три промокода для победителей" },
        { status: 400 }
      );
    }

    // Get olympiad and verify ownership
    const olympiad = await db.query.olympiads.findFirst({
      where: eq(olympiads.id, params.id),
    });

    if (!olympiad) {
      return NextResponse.json(
        { message: "Олимпиада не найдена" },
        { status: 404 }
      );
    }

    if (olympiad.creatorId !== userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (olympiad.isCompleted) {
      return NextResponse.json(
        { message: "Олимпиада уже завершена" },
        { status: 400 }
      );
    }

    // Get all participants with their results and details
    const results = await db
      .select({
        result: participantResults,
        details: participantDetails,
      })
      .from(participantResults)
      .innerJoin(
        participantDetails,
        and(
          eq(participantDetails.userId, participantResults.userId),
          eq(participantDetails.olympiadId, participantResults.olympiadId)
        )
      )
      .where(eq(participantResults.olympiadId, params.id))
      .orderBy((fields) => desc(fields.result.score));

    console.log('\n=== Starting Olympiad Finalization ===');
    console.log('Total participants:', results.length);
    console.log('Participant details:', results.map(r => ({
      fullName: r.details.fullName,
      email: r.details.email,
      score: r.result.score
    })));

    // Create prizes for the top 3 participants
    await db.delete(prizes).where(eq(prizes.olympiadId, params.id)); // Remove any existing prizes
    for (let i = 0; i < Math.min(3, promoCodes.length); i++) {
      await db.insert(prizes).values({
        olympiadId: params.id,
        placement: i + 1,
        promoCode: promoCodes[i],
        description: `Приз за ${i + 1} место`,
      });
    }

    // Get the newly created prizes
    const olympiadPrizes = await db
      .select()
      .from(prizes)
      .where(eq(prizes.olympiadId, params.id))
      .orderBy(prizes.placement);

    console.log('\n=== Available Prizes ===');
    console.log(olympiadPrizes);

    // Calculate places and generate certificates
    const updatedResults = await Promise.all(
      results.map(async ({ result, details }, index) => {
        const place = index + 1;
        const isWinner = place <= 3;
        
        console.log(`\n=== Processing Participant ===`);
        console.log(`Full Name: ${details.fullName}`);
        console.log(`Email: ${details.email}`);
        console.log(`Place: ${place}`);
        console.log(`Score: ${result.score}`);
        console.log(`Is Winner: ${isWinner}`);

        // Find matching prize for winners
        const prize = isWinner ? olympiadPrizes.find(p => p.placement === place) : null;
        if (isWinner) {
          console.log('Prize details:', prize);
        }

        // Generate certificate
        const certificateUrl = await generateCertificate({
          userName: details.fullName,
          olympiadTitle: olympiad.title,
          place: place.toString(),
        });

        console.log('Certificate URL:', certificateUrl);

        // Update result with place and certificate
        await db
          .update(participantResults)
          .set({
            place: place.toString(),
            certificateUrl,
          })
          .where(eq(participantResults.id, result.id));

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(details.email)) {
          console.error(`Invalid email address for participant ${details.fullName}: ${details.email}`);
          return {
            ...result,
            place: place.toString(),
            certificateUrl,
            emailError: 'Invalid email address'
          };
        }

        // Prepare email content
        const emailSubject = isWinner
          ? `Поздравляем! Вы заняли ${place} место в олимпиаде "${olympiad.title}"`
          : `Спасибо за участие в олимпиаде "${olympiad.title}"`;

        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #7f1d1d, #991b1b); border-radius: 16px; padding: 40px 20px; text-align: center; color: white; margin-bottom: 20px;">
              <h1 style="margin: 0; font-size: 36px; margin-bottom: 10px;">汉语之星</h1>
              <p style="margin: 0; font-size: 20px;">Олимпиада по китайскому языку</p>
            </div>
            
            <div style="background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #1f2937; margin-top: 0;">${isWinner ? "Поздравляем!" : "Спасибо за участие!"}</h2>
              <p style="color: #4b5563;">Уважаемый(ая) ${details.fullName}!</p>
              <p style="color: #4b5563;">Олимпиада: ${olympiad.title}</p>
              <p style="color: #4b5563;">Ваш результат: ${result.score}%</p>
              <p style="color: #4b5563;">Место: ${place} из ${results.length}</p>
              ${
                isWinner && prize
                  ? `<div style="margin: 20px 0; padding: 20px; background-color: #fef3c7; border-radius: 8px;">
                      <p style="color: #92400e; margin: 0;">🏆 Поздравляем с ${place}-м местом!</p>
                      <p style="color: #92400e; margin: 10px 0;">🎁 Ваш приз: ${prize.description}</p>
                      <p style="color: #92400e; font-weight: bold; margin: 0;">🎫 Ваш промокод: ${prize.promoCode}</p>
                     </div>`
                  : ""
              }
              <p style="color: #4b5563; margin-top: 20px;">
                Ваш сертификат доступен по ссылке: 
                <a href="${certificateUrl}" 
                   style="color: #991b1b; text-decoration: none; padding: 8px 16px; background-color: #fee2e2; border-radius: 4px; display: inline-block; margin-top: 8px;">
                  Скачать сертификат
                </a>
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px;">
              <p>Это автоматическое сообщение, пожалуйста, не отвечайте на него.</p>
            </div>
          </div>
        `;

        // Send email
        try {
          console.log(`Sending email to ${details.email} (${isWinner ? 'Winner' : 'Participant'})`);
          await sendEmail({
            to: details.email,
            subject: emailSubject,
            html: emailHtml,
          });
          console.log(`Successfully sent email to ${details.email}`);
        } catch (error) {
          console.error(`Failed to send email to ${details.email}:`, error);
        }

        return {
          ...result,
          place: place.toString(),
          certificateUrl,
        };
      })
    );

    // Mark olympiad as completed
    await db
      .update(olympiads)
      .set({ isCompleted: true })
      .where(eq(olympiads.id, params.id));

    return NextResponse.json(updatedResults);
  } catch (error) {
    console.error("Error finalizing olympiad:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
