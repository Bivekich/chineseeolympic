import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  olympiads,
  participantResults,
  users,
  prizes,
  participantDetails,
} from '@/lib/db/schema';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { eq, and, desc } from 'drizzle-orm';
import { generateCertificate } from '@/lib/certificates';
import { sendEmail } from '@/lib/email';
import path from 'path';
import fs from 'fs';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

async function getUserId() {
  const token = cookies().get('auth-token')?.value;
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
  console.log(
    `\n>>> ENTERING FINALIZE ROUTE for Olympiad ID: ${
      params.id
    } at ${new Date().toISOString()}`
  );
  try {
    const userId = await getUserId();
    console.log(`Finalize route: User ID fetched: ${userId}`);
    if (!userId) {
      console.error('Finalize route: Unauthorized access attempt.');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get olympiad and verify ownership
    console.log('Finalize route: Fetching olympiad data...');
    const olympiad = await db.query.olympiads.findFirst({
      where: eq(olympiads.id, params.id),
    });
    console.log(
      'Finalize route: Olympiad data fetched:',
      olympiad
        ? `ID: ${olympiad.id}, Completed: ${olympiad.isCompleted}`
        : 'null'
    );

    if (!olympiad) {
      console.error(`Finalize route: Olympiad not found (ID: ${params.id})`);
      return NextResponse.json(
        { message: 'Олимпиада не найдена' },
        { status: 404 }
      );
    }

    if (olympiad.creatorId !== userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (olympiad.isCompleted) {
      return NextResponse.json(
        { message: 'Олимпиада уже завершена' },
        { status: 400 }
      );
    }

    // Get all participants with their results and details
    interface ParticipantData {
      participant_results: {
        userId: string;
        id: string;
        olympiadId: string;
        score: string;
        answers: string;
        place: string | null;
        certificateUrl: string | null;
        completedAt: Date;
      };
      participant_details: {
        fullName: string;
        email: string;
        userId: string;
        olympiadId: string;
      };
    }

    console.log('Finalize route: Fetching participant results and details...');
    const resultsRaw = (await db
      .select({
        participant_results: participantResults,
        participant_details: participantDetails,
      })
      .from(participantResults)
      .innerJoin(
        participantDetails,
        and(
          eq(participantDetails.userId, participantResults.userId),
          eq(participantDetails.olympiadId, participantResults.olympiadId)
        )
      )
      .where(
        eq(participantResults.olympiadId, params.id)
      )) as unknown as ParticipantData[];
    console.log(
      `Finalize route: Fetched ${resultsRaw.length} raw participant records.`
    );

    // Сортируем результаты вручную после запроса
    const results = [...resultsRaw].sort(
      (a, b) =>
        parseFloat(b.participant_results.score) -
        parseFloat(a.participant_results.score)
    );
    console.log(
      `Finalize route: Sorted ${results.length} participant records.`
    );

    console.log('\n=== Starting Olympiad Finalization ===');
    console.log('Total participants:', results.length);
    console.log(
      'Participant details:',
      results.map((r: ParticipantData) => ({
        fullName: r.participant_details.fullName,
        email: r.participant_details.email,
        score: r.participant_results.score,
      }))
    );

    // Get all prizes for this olympiad first
    type Prize = {
      id: string;
      olympiadId: string;
      placement: number;
      description: string;
      promoCode: string | null;
    };

    const olympiadPrizesRaw = (await db
      .select()
      .from(prizes)
      .where(eq(prizes.olympiadId, params.id))) as Prize[];

    // Сортируем призы вручную
    const olympiadPrizes = [...olympiadPrizesRaw].sort(
      (a, b) => a.placement - b.placement
    );

    console.log('\n=== Available Prizes ===');
    console.log(olympiadPrizes);

    // Calculate places and generate certificates
    const updatedResults = await Promise.all(
      results.map(async (data: ParticipantData, index) => {
        const place = index + 1;
        const isWinner = place <= 3;

        console.log(
          `\n=== Processing Participant ${index + 1}/${results.length} ===`
        );
        console.log(`Full Name: ${data.participant_details.fullName}`);
        console.log(`Email: ${data.participant_details.email}`);
        console.log(`Place: ${place}`);
        console.log(`Score: ${data.participant_results.score}`);

        let certificateUrl: string | null = null;
        try {
          console.log('Attempting to generate certificate...');
          // Pass all necessary data to generateCertificate
          certificateUrl = await generateCertificate({
            userName: data.participant_details.fullName,
            olympiadTitle: olympiad.title,
            olympiadDescription: olympiad.description || undefined, // Handle null description
            difficulty: olympiad.level, // Add difficulty
            score: data.participant_results.score, // Add score
            place: place.toString(), // Add place
            date: new Date().toLocaleDateString(), // Add date
          });
          console.log(
            'Successfully generated certificate URL:',
            certificateUrl
          );
        } catch (certError) {
          console.error(
            `Failed to generate certificate for participant ${data.participant_details.fullName} (Result ID: ${data.participant_results.id}):`,
            certError
          );
          // Continue processing other participants even if one certificate fails
          // certificateUrl will remain null
        }

        // Update result with place and certificate URL (even if null)
        await db
          .update(participantResults)
          .set({
            place: place.toString(),
            certificateUrl, // Store the generated URL or null if generation failed
          })
          .where(eq(participantResults.id, data.participant_results.id));

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.participant_details.email)) {
          console.error(
            `Invalid email address for participant ${data.participant_details.fullName}: ${data.participant_details.email}`
          );
          return {
            ...data.participant_results,
            place: place.toString(),
            certificateUrl,
            emailError: 'Invalid email address',
          };
        }

        // --- Prepare Email ---
        if (!certificateUrl) {
          console.log(
            `Skipping email for ${data.participant_details.fullName} due to certificate generation failure.`
          );
          // Return necessary data even if email skipped
          return {
            ...data.participant_results,
            place: place.toString(),
            certificateUrl,
          };
        }

        // Prepare email content (only if certificateUrl is valid)
        const emailSubject = isWinner
          ? `Поздравляем! Вы заняли ${place} место в олимпиаде "${olympiad.title}"`
          : `Спасибо за участие в олимпиаде "${olympiad.title}"`;

        // Find matching prize for winners (needed for email body)
        const prize = isWinner
          ? olympiadPrizes.find((p: Prize) => p.placement === place)
          : null;

        // Prepare attachment path and download URL (only if certificateUrl is valid)
        const certificateFilename = isWinner
          ? `Диплом ${place} место - ${data.participant_details.fullName}.pdf`
          : `Сертификат участника - ${data.participant_details.fullName}.pdf`;

        const attachments = [];
        let certificateDownloadUrl = '#';

        const certificateFilePath = path.join(
          process.cwd(),
          'public',
          certificateUrl.replace(/^\//, '') // Use the valid certificateUrl
        );

        if (fs.existsSync(certificateFilePath)) {
          attachments.push({
            filename: certificateFilename,
            path: certificateFilePath,
          });
          certificateDownloadUrl = `${process.env.NEXT_PUBLIC_APP_URL}${certificateUrl}`;
        } else {
          console.warn(
            `Certificate file ${certificateFilePath} not found for email attachment, though URL was generated.`
          );
          // Don't add attachment, link will be non-functional
        }

        const emailHtml = `
          <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>${
                isWinner ? 'Поздравляем с победой!' : 'Результаты олимпиады'
              }</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="background: linear-gradient(135deg, #7f1d1d, #991b1b); border-radius: 16px; padding: 40px 20px; text-align: center; color: white; margin-bottom: 20px;">
                      <h1 style="margin: 0; font-size: 36px; margin-bottom: 10px;">汉语之星</h1>
                      <p style="margin: 0; font-size: 20px;">Олимпиада по китайскому языку</p>
                  </div>
                  <div style="background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                      <h2 style="color: #1f2937; margin-top: 0;">${
                        isWinner ? 'Поздравляем!' : 'Спасибо за участие!'
                      }</h2>
                      <p style="color: #4b5563;">Уважаемый(ая) ${
                        data.participant_details.fullName
                      }!</p>
                      <p style="color: #4b5563;">Олимпиада: ${
                        olympiad.title
                      }</p>
                      <p style="color: #4b5563;">Место: ${place} из ${
          results.length
        }</p>
                      ${
                        isWinner && prize
                          ? `
                      <div style="margin: 20px 0; padding: 20px; background-color: #fef3c7; border-radius: 8px;">
                          <p style="color: #92400e; margin: 0;">🏆 Поздравляем с ${place} местом!</p>
                          <p style="color: #92400e; margin: 10px 0;">🎁 Ваш приз: ${
                            prize.description || `Приз за ${place} место`
                          }</p>
                          ${
                            prize.promoCode
                              ? `<p style="color: #92400e; font-weight: bold; margin: 0;">🎫 Ваш промокод: ${prize.promoCode}</p>`
                              : ''
                          }
                      </div>
                      `
                          : ''
                      }
                      <div style="margin-top: 20px; text-align: center;">
                          ${
                            attachments.length > 0
                              ? '<p style="color: #4b5563; margin-bottom: 15px;">К письму прикреплен ваш диплом.</p>'
                              : '<p style="color: #4b5563; margin-bottom: 15px;">Ваш диплом был сгенерирован, но временно недоступен.</p>'
                          }
                      </div>
                      <p style="color: #4b5563; margin-top: 25px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                          Благодарим вас за участие в олимпиаде! Желаем дальнейших успехов в изучении китайского языка.
                      </p>
                  </div>
                  <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px;">
                      <p>Это автоматическое сообщение, пожалуйста, не отвечайте на него.</p>
                  </div>
              </div>
            </body>
          </html>
        `;

        // Send email
        try {
          console.log(
            `Sending email to ${data.participant_details.email} (${
              isWinner ? 'Winner' : 'Participant'
            })...`
          );
          await sendEmail({
            to: data.participant_details.email,
            subject: emailSubject,
            html: emailHtml,
            attachments: attachments, // Pass the prepared attachments array
          });
          console.log(
            `Successfully sent email to ${data.participant_details.email}`
          );
        } catch (emailError) {
          console.error(
            `Failed to send email to ${data.participant_details.email}:`,
            emailError
          );
          // Still return result even if email fails, but maybe add an error flag
        }

        // Return the updated result data
        return {
          ...data.participant_results,
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
    console.error(
      `\n>>> ERROR IN FINALIZE ROUTE (Olympiad ID: ${params.id}) <<<`
    );
    console.error('Error finalizing olympiad:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
