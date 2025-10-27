import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  olympiads,
  participantDetails,
  participantResults,
} from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAuth, verifyAdmin } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await verifyAuth();
    const isAdmin = await verifyAdmin();

    if (!userId || !isAdmin) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get the olympiad
    const olympiad = await db
      .select()
      .from(olympiads)
      .where(eq(olympiads.id, id))
      .then((res: any[]) => res[0]);

    if (!olympiad) {
      return NextResponse.json(
        { message: 'Olympiad not found' },
        { status: 404 }
      );
    }

    if (olympiad.creatorId !== userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // First get all participant details
    const participants = await db
      .select({
        id: participantDetails.id,
        userId: participantDetails.userId,
        fullName: participantDetails.fullName,
        email: participantDetails.email,
        country: participantDetails.country,
        city: participantDetails.city,
        age: participantDetails.age,
        educationType: participantDetails.educationType,
        grade: participantDetails.grade,
        institutionName: participantDetails.institutionName,
        phoneNumber: participantDetails.phoneNumber,
      })
      .from(participantDetails)
      .where(eq(participantDetails.olympiadId, id));

    // Then get all results for this olympiad
    const results = await db
      .select()
      .from(participantResults)
      .where(eq(participantResults.olympiadId, id));

    // Create a map of userId to their latest result
    const latestResultsByUser = new Map();
    results.forEach((result: any) => {
      const existingResult = latestResultsByUser.get(result.userId);
      if (
        !existingResult ||
        new Date(result.completedAt) > new Date(existingResult.completedAt)
      ) {
        latestResultsByUser.set(result.userId, result);
      }
    });

    // Combine participant details with their latest result
    const participantsWithResults = participants.map((participant: any) => {
      const latestResult = latestResultsByUser.get(participant.userId);
      return {
        ...participant,
        score: latestResult?.score || null,
        completedAt: latestResult?.completedAt || null,
        place: latestResult?.place || null,
      };
    });

    // Sort participants by completion time
    const sortedParticipants = participantsWithResults.sort(
      (a: any, b: any) => {
        // Put participants who haven't completed the test at the end
        if (!a.completedAt && !b.completedAt) return 0;
        if (!a.completedAt) return 1;
        if (!b.completedAt) return -1;
        // Sort by completion time, earliest first
        return (
          new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
        );
      }
    );

    // Return both olympiad and participants data
    return NextResponse.json({
      olympiad: {
        id: olympiad.id,
        title: olympiad.title,
        level: olympiad.level,
        startDate: olympiad.startDate,
        endDate: olympiad.endDate,
        isCompleted: olympiad.isCompleted,
        hasPrizes: olympiad.hasPrizes,
      },
      participants: sortedParticipants,
    });
  } catch (error) {
    console.error('Error fetching participants:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
