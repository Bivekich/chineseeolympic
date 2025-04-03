import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';

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

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  attachments?: Attachment[];
};

type Attachment = {
  filename: string;
  path: string;
};

export async function sendEmail({
  to,
  subject,
  html,
  attachments = [],
}: SendEmailParams) {
  // Инициализируем транспортер перед отправкой
  initializeEmailTransporter();

  console.log('\n=== Sending Email ===');
  console.log('From:', SENDER_EMAIL);
  console.log('To:', to);
  console.log('Subject:', subject);
  console.log('Attachments:', attachments.length > 0 ? attachments : 'None');
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

    // Подготавливаем вложения
    const emailAttachments = attachments
      .map((attachment) => {
        // Проверяем, существует ли файл
        const absolutePath = path.isAbsolute(attachment.path)
          ? attachment.path
          : path.join(
              process.cwd(),
              'public',
              attachment.path.replace(/^\//, '')
            );

        if (!fs.existsSync(absolutePath)) {
          console.warn(`Warning: Attachment file not found: ${absolutePath}`);
          return null;
        }

        return {
          filename: attachment.filename,
          path: absolutePath,
        };
      })
      .filter(
        (attachment): attachment is { filename: string; path: string } =>
          attachment !== null
      );

    const info = await transporter.sendMail({
      from: `"汉语之星" <${SENDER_EMAIL}>`,
      to,
      subject,
      html,
      attachments: emailAttachments,
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
