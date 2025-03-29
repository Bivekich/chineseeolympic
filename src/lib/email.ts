import nodemailer from 'nodemailer';

// Перемещаем проверки переменных в функцию инициализации
let transporter: nodemailer.Transporter | null = null;
let SENDER_EMAIL: string | null = null;

function initializeEmailTransporter() {
  if (transporter) return;

  // Check for required environment variables
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

  // Create a transporter using SMTP
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  SENDER_EMAIL = process.env.SENDER_EMAIL;
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  // Инициализируем транспортер перед отправкой
  initializeEmailTransporter();

  console.log('\n=== Sending Email ===');
  console.log('From:', SENDER_EMAIL);
  console.log('To:', to);
  console.log('Subject:', subject);
  console.log('SMTP Config:', {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    passwordPresent: !!process.env.SMTP_PASSWORD,
  });

  try {
    if (!to || typeof to !== 'string') {
      throw new Error(`Invalid 'to' email address: ${to}`);
    }

    if (!transporter) {
      throw new Error('Email transporter was not initialized');
    }

    const info = await transporter.sendMail({
      from: `"汉语之星" <${SENDER_EMAIL}>`,
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
