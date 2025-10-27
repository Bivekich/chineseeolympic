import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, verifyAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { olympiads, payments, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const UKASSA_API_KEY = process.env.UKASSA_API_KEY;
const UKASSA_SHOP_ID = process.env.UKASSA_SHOP_ID;
const RETURN_URL = process.env.NEXT_PUBLIC_APP_URL;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Check if user is authenticated
    const userId = await verifyAuth();
    const isAdmin = await verifyAdmin();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Creating payment for olympiad:', id); // Debug log

    // Get olympiad details
    const olympiad = await db
      .select()
      .from(olympiads)
      .where(eq(olympiads.id, id))
      .then((res: any[]) => res[0]);

    // Get user email
    const user = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
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
            eq(payments.olympiadId, id) &&
            eq(payments.status, 'completed')
        )
        .then((res: any[]) => res[0]);

      if (existingPayment) {
        return NextResponse.json(
          { error: 'Already paid for this olympiad' },
          { status: 400 }
        );
      }

      // Check for existing pending payment with paymentUrl
      const pendingPayment = await db
        .select()
        .from(payments)
        .where(
          eq(payments.userId, userId) &&
            eq(payments.olympiadId, id) &&
            eq(payments.status, 'pending')
        )
        .then((res: any[]) => res[0]);

      if (pendingPayment && pendingPayment.paymentUrl) {
        console.log('Found pending payment with URL:', pendingPayment);
        return NextResponse.json({
          paymentUrl: pendingPayment.paymentUrl,
        });
      }
    }

    // Create a payment record in our database
    console.log(
      'Creating payment record with userId:',
      userId,
      'olympiadId:',
      id
    );
    const [payment] = await db
      .insert(payments)
      .values({
        userId,
        olympiadId: id,
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
        return_url: `${RETURN_URL}/olympiads/${id}/start`,
      },
      description: `Участие в олимпиаде "${olympiad.title}"`,
      metadata: {
        paymentId: payment.id,
        olympiadId: id,
        userId,
      },
      receipt: {
        customer: {
          email: user?.email || 'user@example.com',
        },
        items: [
          {
            description: `Участие в олимпиаде "${olympiad.title}"`,
            quantity: '1',
            amount: {
              value: (olympiad.price / 100).toFixed(2),
              currency: 'RUB',
            },
            vat_code: 6, // НДС не облагается
            payment_subject: 'service',
            payment_mode: 'full_payment',
          },
        ],
      },
    };

    console.log('Sending payment request to UKassa:', paymentData);

    // Create payment with UKassa
    const response = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotence-Key': `${userId}-${id}-${Date.now()}`,
        Authorization: `Basic ${Buffer.from(
          `${UKASSA_SHOP_ID}:${UKASSA_API_KEY}`
        ).toString('base64')}`,
        'X-Yookassa-Request-Mode': IS_PRODUCTION ? 'production' : 'test',
      },
      body: JSON.stringify(paymentData),
    });

    console.log('UKassa response status:', response.status); // Debug log

    if (!response.ok) {
      const errorText = await response.text();
      console.error('UKassa error response:', errorText);

      // Try to parse the error details for better reporting
      try {
        const errorData = JSON.parse(errorText);
        console.error('UKassa error details:', errorData);
        return NextResponse.json(
          {
            error: 'Failed to create payment',
            details: errorData,
          },
          { status: 500 }
        );
      } catch (parseError) {
        // If can't parse JSON, return raw text
        return NextResponse.json(
          { error: 'Failed to create payment: ' + errorText },
          { status: 500 }
        );
      }
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
      isTest: !IS_PRODUCTION,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await params; // Await params even though we don't use id in this endpoint
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
