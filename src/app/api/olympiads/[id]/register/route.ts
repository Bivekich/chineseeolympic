import { NextResponse } from 'next/server';
import { verifyAuth, verifyAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { participantDetails } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await verifyAuth();
    const isAdmin = await verifyAdmin();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      fullName,
      email,
      country,
      city,
      age,
      educationType,
      grade,
      institutionName,
      phoneNumber,
    } = body;

    // Validate required fields
    if (
      !fullName ||
      !email ||
      !country ||
      !city ||
      !age ||
      !educationType ||
      !phoneNumber
    ) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Only check for existing registration if not an admin
    if (!isAdmin) {
      const existingRegistration = await db
        .select()
        .from(participantDetails)
        .where(
          and(
            eq(participantDetails.userId, userId),
            eq(participantDetails.olympiadId, id)
          )
        )
        .then((res: any[]) => res[0]);

      if (existingRegistration) {
        return NextResponse.json(
          { message: 'Already registered for this olympiad' },
          { status: 400 }
        );
      }
    }

    // Create participant details
    const [registration] = await db
      .insert(participantDetails)
      .values({
        userId,
        olympiadId: id,
        fullName,
        email,
        country,
        city,
        age,
        educationType,
        grade: grade || null,
        institutionName: institutionName || null,
        phoneNumber,
      })
      .returning();

    return NextResponse.json(registration);
  } catch (error) {
    console.error('Error registering participant:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
