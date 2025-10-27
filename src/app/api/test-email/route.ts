import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    console.log('Attempting to send test email to:', email);

    // Create test transporter to verify connection
    const port = parseInt(process.env.SMTP_PORT || '587');
    const testTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: port,
      secure: port === 465, // true for 465 (SSL), false for 587 (STARTTLS)
      requireTLS: port === 587, // true for 587 (STARTTLS)
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      debug: true,
      logger: true,
    });

    // Verify connection
    console.log('Verifying SMTP connection...');
    await testTransporter.verify();
    console.log('SMTP connection verified successfully');

    // Send test email
    await sendEmail({
      to: email,
      subject: 'Test Email from 汉语之星',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Test Email</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h1 style="color: #991b1b; margin-bottom: 20px;">Test Email</h1>
              <p style="color: #4b5563; margin-bottom: 10px;">This is a test email from 汉语之星 to verify email functionality.</p>
              <p style="color: #4b5563;">If you received this email, it means the email system is working correctly.</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
              <p style="color: #6b7280; font-size: 14px; text-align: center;">
                This is an automated message, please do not reply.
              </p>
            </div>
          </body>
        </html>
      `,
    });

    return NextResponse.json({ message: 'Test email sent successfully' });
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { 
        message: 'Failed to send test email', 
        error: error instanceof Error ? error.message : String(error),
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 