import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  olympiads,
  participantResults,
  prizes,
  participantDetails,
} from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import path from 'path'; // Import path module
import fs from 'fs'; // Import fs module

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await verifyAuth();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { participantId, promoCode } = await request.json();

    // Get the olympiad
    const olympiad = await db.query.olympiads.findFirst({
      where: eq(olympiads.id, params.id),
    });

    if (!olympiad) {
      return NextResponse.json(
        { message: 'Olympiad not found' },
        { status: 404 }
      );
    }

    if (olympiad.creatorId !== userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // First get participant details
    const participant = await db.query.participantDetails.findFirst({
      where: eq(participantDetails.id, participantId),
    });

    if (!participant) {
      return NextResponse.json(
        { message: 'Participant details not found' },
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
        { message: 'Participant result not found' },
        { status: 404 }
      );
    }

    // Get the prize based on participant's place
    const prize = await db.query.prizes.findFirst({
      where: and(
        eq(prizes.olympiadId, params.id),
        eq(prizes.placement, parseInt(result.place || '0'))
      ),
    });

    if (!prize) {
      return NextResponse.json({ message: 'Prize not found' }, { status: 404 });
    }

    // Update the prize with the promo code
    await db.update(prizes).set({ promoCode }).where(eq(prizes.id, prize.id));

    // Send email to the winner
    try {
      const certificateFilename = `Диплом ${result.place} место - ${participant.fullName}.pdf`;
      const attachments = [];
      let certificateDownloadUrl = '#'; // Default placeholder

      // Check if certificate URL exists
      if (result.certificateUrl) {
        // Construct the absolute file system path for the attachment
        const certificateFilePath = path.join(
          process.cwd(),
          'public',
          result.certificateUrl.replace(/^\//, '') // Remove leading slash if exists
        );

        // Verify file exists before attempting to attach
        if (fs.existsSync(certificateFilePath)) {
          attachments.push({
            filename: certificateFilename,
            path: certificateFilePath, // Use the absolute file path
          });
          // Construct the full public URL for the download link
          certificateDownloadUrl = `${process.env.NEXT_PUBLIC_APP_URL}${result.certificateUrl}`;
        } else {
          console.warn(
            `Certificate file not found at path: ${certificateFilePath}.
             Email will be sent without the certificate attachment and with a non-functional download link.`
          );
          // Optionally, you could decide not to send the email or handle differently
        }
      } else {
        console.warn(
          `Certificate URL missing for participant result ID: ${result.id}.
           Email will be sent without the certificate attachment.`
        );
      }

      await sendEmail({
        to: participant.email,
        subject: `Поздравляем с ${result.place} местом в олимпиаде "${olympiad.title}"!`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Поздравляем с победой!</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #7f1d1d, #991b1b); border-radius: 16px; padding: 40px 20px; text-align: center; color: white; margin-bottom: 20px;">
                  <h1 style="margin: 0; font-size: 36px; margin-bottom: 10px;">汉语之星</h1>
                  <p style="margin: 0; font-size: 20px;">Олимпиада по китайскому языку</p>
                </div>

                <div style="background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <h2 style="color: #1f2937; margin-top: 0;">Поздравляем!</h2>
                  <p style="color: #4b5563;">Уважаемый(ая) ${
                    participant.fullName
                  }!</p>
                  <p style="color: #4b5563;">Вы заняли ${
                    result.place
                  } место в олимпиаде "${olympiad.title}".</p>

                  <div style="margin: 20px 0; padding: 20px; background-color: #fef3c7; border-radius: 8px;">
                    <p style="color: #92400e; margin: 0;">🏆 Ваш приз: ${
                      prize.description || `Приз за ${result.place} место`
                    }</p>
                    <p style="color: #92400e; font-weight: bold; margin: 10px 0 0 0;">🎫 Ваш промокод: ${promoCode}</p>
                  </div>

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
        `,
        attachments: attachments,
      });
    } catch (error) {
      console.error('Error sending email:', error);
      return NextResponse.json(
        { message: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Prize sent successfully' });
  } catch (error) {
    console.error('Error sending prize:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
