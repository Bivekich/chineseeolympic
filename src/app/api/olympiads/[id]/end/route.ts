import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  olympiads,
  participantResults,
  participantDetails,
  prizes,
} from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAuth, verifyAdmin } from '@/lib/auth';
import { generateCertificate } from '@/lib/certificates';
import { sendEmail } from '@/lib/email';
import path from 'path';
import fs from 'fs';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log(`\n>>> ENTERING END/FINALIZE ROUTE for Olympiad ID: ${params.id} at ${new Date().toISOString()}`);
  try {
    const userId = await verifyAuth();
    const isAdmin = await verifyAdmin();
    console.log(`End route: User ID: ${userId}, Is Admin: ${isAdmin}`);

    if (!userId) {
      console.error('End route: Unauthorized access attempt (no user ID).');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get the olympiad
    console.log('End route: Fetching olympiad data...');
    const olympiad = await db.query.olympiads.findFirst({
      where: eq(olympiads.id, params.id),
    });
    console.log('End route: Olympiad data fetched:', olympiad ? `ID: ${olympiad.id}, Creator: ${olympiad.creatorId}, Completed: ${olympiad.isCompleted}` : 'null');

    if (!olympiad) {
      console.error(`End route: Olympiad not found (ID: ${params.id})`);
      return NextResponse.json(
        { message: 'Olympiad not found' },
        { status: 404 }
      );
    }

    if (!isAdmin && olympiad.creatorId !== userId) {
      console.error(`End route: Unauthorized attempt by User ${userId} (not admin or creator ${olympiad.creatorId})`);
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (olympiad.isCompleted) {
      console.log(`End route: Olympiad ${params.id} is already completed.`);
      return NextResponse.json(
        { message: 'Olympiad is already completed' },
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
        id: string;
        fullName: string;
        email: string;
        userId: string;
        olympiadId: string;
      };
    }
    console.log('End route: Fetching participant results and details...');
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
    console.log(`End route: Fetched ${resultsRaw.length} raw participant records.`);

    // Sort results by score (descending)
    const results = [...resultsRaw].sort(
      (a, b) =>
        parseFloat(b.participant_results.score) -
        parseFloat(a.participant_results.score)
    );
    console.log(`End route: Sorted ${results.length} participant records.`);

    // Get all prizes for this olympiad
    type Prize = {
      id: string;
      olympiadId: string;
      placement: number;
      description: string;
      promoCode: string | null;
    };
    console.log('End route: Fetching prizes...');
    const olympiadPrizesRaw = (await db
      .select()
      .from(prizes)
      .where(eq(prizes.olympiadId, params.id))) as Prize[];
    const olympiadPrizes = [...olympiadPrizesRaw].sort(
      (a, b) => a.placement - b.placement
    );
    console.log(`End route: Fetched and sorted ${olympiadPrizes.length} prizes.`);

    // Loop through participants: Assign place, generate cert, send email
    console.log('\n=== Starting Olympiad End/Finalization (Processing Loop) ===');
    const processingResults = await Promise.all(
      results.map(async (data: ParticipantData, index) => {
        const place = index + 1;
        const isWinner = place <= 3;

        console.log(`\n=== Processing Participant ${index + 1}/${results.length} ===`);
        console.log(`Full Name: ${data.participant_details.fullName}`);
        console.log(`Email: ${data.participant_details.email}`);
        console.log(`Place: ${place}`);
        console.log(`Score: ${data.participant_results.score}`);

        let certificateUrl: string | null = null;
        try {
          console.log('Attempting to generate certificate...');
          certificateUrl = await generateCertificate({
            userName: data.participant_details.fullName,
            olympiadTitle: olympiad.title,
            olympiadDescription: olympiad.description || undefined,
            difficulty: olympiad.level,
            score: data.participant_results.score,
            place: place.toString(),
            date: new Date().toLocaleDateString(),
          });
          console.log('Successfully generated certificate URL:', certificateUrl);
        } catch (certError) {
          console.error(
            `Failed to generate certificate for participant ${data.participant_details.fullName} (Result ID: ${data.participant_results.id}):`,
            certError
          );
        }

        // Update result with place and certificate URL (even if null)
        console.log(`Updating participant result ${data.participant_results.id} with place ${place} and certificateUrl ${certificateUrl}`);
        try {
          await db
            .update(participantResults)
            .set({
              place: place.toString(),
              certificateUrl,
            })
            .where(eq(participantResults.id, data.participant_results.id));
          console.log(`Successfully updated participant result ${data.participant_results.id}`);
        } catch (dbError) {
          console.error(`Failed to update DB for participant result ${data.participant_results.id}:`, dbError);
          // Decide if you want to stop or continue if DB update fails
        }

        // Return only the necessary result data after DB update
        return {
          ...data.participant_results,
          place: place.toString(),
          certificateUrl, // Keep this to see results if needed
          // emailStatus, // Removed
        };
      })
    );
    console.log('\n=== Finished Processing Participants (Certificates Generated) ===', processingResults);

    // Mark olympiad as completed
    console.log(`Marking olympiad ${params.id} as completed...`);
    await db
      .update(olympiads)
      .set({
        isCompleted: true,
        updatedAt: new Date(),
      })
      .where(eq(olympiads.id, params.id));
    console.log(`Olympiad ${params.id} marked as completed.`);

    return NextResponse.json({ 
      message: 'Olympiad ended successfully. Certificates generated (check logs for details). Emails NOT sent.' // Updated message
    });

  } catch (error) {
    console.error(`\n>>> ERROR IN END/FINALIZE ROUTE (Olympiad ID: ${params.id}) <<<`);
    console.error('Error ending olympiad:', error);
    return NextResponse.json(
      { message: 'Internal server error during finalization' },
      { status: 500 }
    );
  }
}
