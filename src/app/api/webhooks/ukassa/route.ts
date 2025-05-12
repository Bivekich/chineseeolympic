import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payments } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

const UKASSA_SECRET_KEY = process.env.UKASSA_SECRET_KEY;

function verifySignature(body: string, signature: string): boolean {
  const hmac = crypto
    .createHmac('sha1', UKASSA_SECRET_KEY!)
    .update(body)
    .digest('hex');
  return hmac === signature;
}

export async function POST(request: Request) {
  try {
    console.log('Received webhook from UKassa');

    // Get the signature from headers
    const signature = request.headers.get('X-YooKassa-Signature');
    if (!signature) {
      console.error('Missing signature in webhook request');
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    // Get the raw body
    const body = await request.text();
    console.log('Webhook payload:', body);

    // Verify the signature
    if (!verifySignature(body, signature)) {
      console.error('Invalid signature in webhook request');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse the body
    const data = JSON.parse(body);
    console.log('Webhook event:', data.event);

    // Handle only payment.succeeded events
    if (data.event !== 'payment.succeeded') {
      console.log('Ignoring webhook event type:', data.event);
      return NextResponse.json({ status: 'ignored' });
    }

    // Find the payment by UKassa payment ID
    console.log('Looking for payment with ID:', data.object.id);
    const payment = await db
      .select()
      .from(payments)
      .where(eq(payments.paymentId, data.object.id))
      .then((res: any[]) => res[0]);

    if (!payment) {
      console.error('Payment not found:', data.object.id);
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    console.log('Found payment:', payment.id);

    // Update payment status
    await db
      .update(payments)
      .set({
        status: 'completed',
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id));

    console.log('Updated payment status to completed');

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
