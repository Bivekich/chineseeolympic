import nodemailer from 'nodemailer';

if (!process.env.SMTP_HOST) {
  throw new Error('SMTP_HOST is not set in environment variables');
}

if (!process.env.SMTP_PORT) {
  throw new Error('SMTP_PORT is not set in environment variables');
}

if (!process.env.SMTP_USER) {
  throw new Error('SMTP_USER is not set in environment variables');
}

if (!process.env.SMTP_PASSWORD) {
  throw new Error('SMTP_PASSWORD is not set in environment variables');
}

if (!process.env.SENDER_EMAIL) {
  throw new Error('SENDER_EMAIL is not set in environment variables');
}

const SENDER_EMAIL = process.env.SENDER_EMAIL;

// Создаем транспорт для отправки email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false, // false для порта 25
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: {
    // Отключаем проверку сертификата для Timeweb Cloud
    rejectUnauthorized: false,
  },
});

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  console.log('\n=== Sending Email ===');
  console.log('From:', SENDER_EMAIL);
  console.log('To:', to);
  console.log('Subject:', subject);

  try {
    if (!to || typeof to !== 'string') {
      throw new Error(`Invalid 'to' email address: ${to}`);
    }

    const info = await transporter.sendMail({
      from: SENDER_EMAIL,
      to,
      subject,
      html,
    });

    console.log('\n=== Email Sent Successfully ===');
    console.log('Message ID:', info.messageId);
    return info;
  } catch (error) {
    console.error('\n=== Email Send Failed ===');
    console.error('Error details:', {
      error: error instanceof Error ? error.message : JSON.stringify(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}
