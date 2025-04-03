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
    // Get the signature from headers
    const signature = request.headers.get('X-YooKassa-Signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    // Get the raw body
    const body = await request.text();

    // Verify the signature
    if (!verifySignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse the body
    const data = JSON.parse(body);

    // Handle only payment.succeeded events
    if (data.event !== 'payment.succeeded') {
      return NextResponse.json({ status: 'ignored' });
    }

    // Update payment status in our database
    const payment = await db
      .select()
      .from(payments)
      .where(eq(payments.paymentId, data.object.id))
      .then((res: any[]) => res[0]);

    if (!payment) {
      console.error('Payment not found:', data.object.id);
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Update payment status
    await db
      .update(payments)
      .set({
        status: 'completed',
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id));

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
