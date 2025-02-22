import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY is not set in environment variables");
}

if (!process.env.SENDER_EMAIL) {
  throw new Error("SENDER_EMAIL is not set in environment variables");
}

const resend = new Resend(process.env.RESEND_API_KEY);
const SENDER_EMAIL = process.env.SENDER_EMAIL;

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  console.log("\n=== Sending Email ===");
  console.log("From:", SENDER_EMAIL);
  console.log("To:", to);
  console.log("Subject:", subject);
  console.log("API Key present:", !!process.env.RESEND_API_KEY);
  
  try {
    if (!to || typeof to !== 'string') {
      throw new Error(`Invalid 'to' email address: ${to}`);
    }

    const { data, error } = await resend.emails.send({
      from: SENDER_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("\n=== Email Send Error ===");
      console.error("Error details:", {
        error: JSON.stringify(error),
        message: error.message,
      });
      throw error;
    }

    console.log("\n=== Email Sent Successfully ===");
    console.log("Response data:", data);
    return data;
  } catch (error) {
    console.error("\n=== Email Send Failed ===");
    console.error("Error details:", {
      error: error instanceof Error ? error.message : JSON.stringify(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}
