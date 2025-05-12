import { createId } from '@paralleldrive/cuid2';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

// Перемещаем проверки переменных в функции, где они используются
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
    port: Number(process.env.SMTP_PORT),
    // use SSL for port 465, STARTTLS for others
    secure: Number(process.env.SMTP_PORT) === 465,
    requireTLS: Number(process.env.SMTP_PORT) === 587,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  SENDER_EMAIL = process.env.SENDER_EMAIL;

  console.log('Email configuration:', {
    senderEmail: SENDER_EMAIL,
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
  });
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function comparePasswords(
  password: string,
  hashedPassword: string
) {
  return bcrypt.compare(password, hashedPassword);
}

export async function sendVerificationEmail(email: string, token: string) {
  try {
    // Инициализируем транспортер перед отправкой
    initializeEmailTransporter();

    console.log('Sending verification email:', {
      from: SENDER_EMAIL,
      to: email,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
    });

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      throw new Error(
        'NEXT_PUBLIC_APP_URL is not set in environment variables'
      );
    }

    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;
    console.log('Generated verification link:', verificationLink);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Подтвердите ваш email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #7f1d1d, #991b1b); border-radius: 16px; padding: 40px 20px; text-align: center; color: white; margin-bottom: 20px;">
              <h1 style="margin: 0; font-size: 36px; margin-bottom: 10px;">汉语之星</h1>
              <p style="margin: 0; font-size: 20px;">Олимпиада по китайскому языку</p>
            </div>

            <div style="background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #1f2937; margin-top: 0;">Подтверждение email адреса</h2>
              <p style="color: #4b5563; margin-bottom: 25px;">
                Спасибо за регистрацию! Пожалуйста, подтвердите ваш email адрес, нажав на кнопку ниже:
              </p>

              <a href="${verificationLink}"
                 style="display: inline-block; background-color: #991b1b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin-bottom: 25px;">
                Подтвердить email
              </a>

              <p style="color: #6b7280; font-size: 14px; margin-top: 25px;">
                Если кнопка не работает, скопируйте и вставьте эту ссылку в браузер:<br>
                <span style="color: #991b1b; word-break: break-all;">${verificationLink}</span>
              </p>
            </div>

            <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px;">
              <p>Это автоматическое сообщение, пожалуйста, не отвечайте на него.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    if (!transporter) {
      throw new Error('Email transporter was not initialized');
    }

    const info = await transporter.sendMail({
      from: `"汉语之星" <${SENDER_EMAIL}>`,
      to: email,
      subject: 'Подтвердите ваш email адрес | 汉语之星',
      html: htmlContent,
    });

    console.log(
      'Verification email sent successfully. Message ID:',
      info.messageId
    );
    return info;
  } catch (error: any) {
    console.error('Error in sendVerificationEmail:', {
      error,
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  try {
    // Инициализируем транспортер перед отправкой
    initializeEmailTransporter();

    console.log('Sending password reset email:', {
      from: SENDER_EMAIL,
      to: email,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
    });

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      throw new Error(
        'NEXT_PUBLIC_APP_URL is not set in environment variables'
      );
    }

    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
    console.log('Generated reset link:', resetLink);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Восстановление пароля</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #7f1d1d, #991b1b); border-radius: 16px; padding: 40px 20px; text-align: center; color: white; margin-bottom: 20px;">
              <h1 style="margin: 0; font-size: 36px; margin-bottom: 10px;">汉语之星</h1>
              <p style="margin: 0; font-size: 20px;">Олимпиада по китайскому языку</p>
            </div>

            <div style="background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #1f2937; margin-top: 0;">Восстановление пароля</h2>
              <p style="color: #4b5563; margin-bottom: 25px;">
                Мы получили запрос на восстановление пароля для вашего аккаунта. Для создания нового пароля нажмите на кнопку ниже:
              </p>

              <a href="${resetLink}"
                 style="display: inline-block; background-color: #991b1b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin-bottom: 25px;">
                Сбросить пароль
              </a>

              <p style="color: #6b7280; font-size: 14px; margin-top: 25px;">
                Если кнопка не работает, скопируйте и вставьте эту ссылку в браузер:<br>
                <span style="color: #991b1b; word-break: break-all;">${resetLink}</span>
              </p>

              <p style="color: #6b7280; font-size: 14px; margin-top: 25px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                Если вы не запрашивали восстановление пароля, проигнорируйте это сообщение.<br>
                Ссылка действительна в течение 1 часа.
              </p>
            </div>

            <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px;">
              <p>Это автоматическое сообщение, пожалуйста, не отвечайте на него.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    if (!transporter) {
      throw new Error('Email transporter was not initialized');
    }

    const info = await transporter.sendMail({
      from: `"汉语之星" <${SENDER_EMAIL}>`,
      to: email,
      subject: 'Восстановление пароля | 汉语之星',
      html: htmlContent,
    });

    console.log(
      'Password reset email sent successfully. Message ID:',
      info.messageId
    );
    return info;
  } catch (error: any) {
    console.error('Error in sendPasswordResetEmail:', {
      error,
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

export function generateToken() {
  return createId();
}
