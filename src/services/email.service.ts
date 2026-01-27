import nodemailer from "nodemailer";
import createHttpError from "http-errors";

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
  console.warn(
    "Warning: GMAIL_USER or GMAIL_APP_PASSWORD not set. Email service will not work."
  );
}

const transporter =
  GMAIL_USER && GMAIL_APP_PASSWORD
    ? nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: GMAIL_USER,
          pass: GMAIL_APP_PASSWORD,
        },
      })
    : null;

export const sendPasswordResetCode = async (
  email: string,
  code: string
): Promise<void> => {
  if (!transporter) {
    throw createHttpError(500, "Email service is not configured");
  }

  try {
    await transporter.sendMail({
      from: "reset-password@worklog.app",
      to: email,
      subject: "Password Reset Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>You have requested to reset your password. Use the following code to verify your identity:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
            <h1 style="color: #007bff; font-size: 32px; letter-spacing: 5px; margin: 0;">${code}</h1>
          </div>
          <p style="color: #666; font-size: 14px;">This code will expire in 15 minutes.</p>
          <p style="color: #666; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    });
  } catch (error: any) {
    throw createHttpError(
      500,
      `Failed to send password reset code email: ${
        error?.message || String(error)
      }`
    );
  }
};
