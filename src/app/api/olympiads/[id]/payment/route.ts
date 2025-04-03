import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, verifyAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { olympiads, payments } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const UKASSA_API_KEY = process.env.UKASSA_API_KEY;
const UKASSA_SHOP_ID = process.env.UKASSA_SHOP_ID;
const RETURN_URL = process.env.NEXT_PUBLIC_APP_URL;

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is authenticated
    const userId = await verifyAuth();
    const isAdmin = await verifyAdmin();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Creating payment for olympiad:', params.id); // Debug log

    // Get olympiad details
    const olympiad = await db
      .select()
      .from(olympiads)
      .where(eq(olympiads.id, params.id))
      .then((res: any[]) => res[0]);

    console.log('Olympiad details:', olympiad); // Debug log

    if (!olympiad) {
      return NextResponse.json(
        { error: 'Olympiad not found' },
        { status: 404 }
      );
    }

    if (!olympiad.price || olympiad.price <= 0) {
      return NextResponse.json(
        { error: 'This olympiad is free' },
        { status: 400 }
      );
    }

    // Only check for existing payment if not an admin
    if (!isAdmin) {
      const existingPayment = await db
        .select()
        .from(payments)
        .where(
          eq(payments.userId, userId) &&
            eq(payments.olympiadId, params.id) &&
            eq(payments.status, 'completed')
        )
        .then((res: any[]) => res[0]);

      if (existingPayment) {
        return NextResponse.json(
          { error: 'Already paid for this olympiad' },
          { status: 400 }
        );
      }
    }

    // Create a payment record in our database
    console.log(
      'Creating payment record with userId:',
      userId,
      'olympiadId:',
      params.id
    );
    const [payment] = await db
      .insert(payments)
      .values({
        userId,
        olympiadId: params.id,
        amount: olympiad.price,
        status: 'pending',
      })
      .returning();

    console.log('Created payment record:', payment); // Debug log

    if (!UKASSA_API_KEY || !UKASSA_SHOP_ID) {
      console.error(
        'Missing UKassa credentials - API_KEY:',
        !!UKASSA_API_KEY,
        'SHOP_ID:',
        !!UKASSA_SHOP_ID
      );
      return NextResponse.json(
        { error: 'Payment service configuration error' },
        { status: 500 }
      );
    }

    const paymentData = {
      amount: {
        value: (olympiad.price / 100).toFixed(2),
        currency: 'RUB',
      },
      capture: true,
      confirmation: {
        type: 'redirect',
        return_url: `${RETURN_URL}/olympiads/${params.id}/start`,
      },
      description: `Участие в олимпиаде "${olympiad.title}"`,
      metadata: {
        paymentId: payment.id,
        olympiadId: params.id,
        userId,
      },
    };

    console.log('Sending payment request to UKassa:', paymentData);

    // Create payment with UKassa
    const response = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotence-Key': `${userId}-${params.id}-${Date.now()}`,
        Authorization: `Basic ${Buffer.from(
          `${UKASSA_SHOP_ID}:${UKASSA_API_KEY}`
        ).toString('base64')}`,
      },
      body: JSON.stringify(paymentData),
    });

    console.log('UKassa response status:', response.status); // Debug log

    if (!response.ok) {
      const errorText = await response.text();
      console.error('UKassa error response:', errorText);
      return NextResponse.json(
        { error: 'Failed to create payment: ' + errorText },
        { status: 500 }
      );
    }

    const paymentResponse = await response.json();
    console.log('UKassa payment response:', paymentResponse);

    // Update our payment record with the UKassa payment ID and URL
    await db
      .update(payments)
      .set({
        paymentId: paymentResponse.id,
        paymentUrl: paymentResponse.confirmation.confirmation_url,
      })
      .where(eq(payments.id, payment.id));

    return NextResponse.json({
      paymentUrl: paymentResponse.confirmation.confirmation_url,
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      {
        error:
          'Internal server error: ' +
          (error instanceof Error ? error.message : String(error)),
      },
      { status: 500 }
    );
  }
}

// Webhook endpoint to handle payment status updates
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const signature = request.headers.get('X-Deliakdessa-Signature');
    if (!signature || signature !== process.env.DELIAKDESSA_WEBHOOK_SECRET) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { paymentId, status } = await request.json();

    // Update payment status in our database
    await db
      .update(payments)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(payments.paymentId, paymentId));

    return NextResponse.json({ message: 'Payment status updated' });
  } catch (error) {
    console.error('Error updating payment status:', error);
    return NextResponse.json(
      { message: 'Failed to update payment status' },
      { status: 500 }
    );
  }
}
