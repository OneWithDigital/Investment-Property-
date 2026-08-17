import { createPasswordResetToken, createVerificationToken } from "./tokens";
import { sendEmail } from "./email";

function baseUrl(): string {
  return process.env.NEXTAUTH_URL || "http://localhost:3000";
}

export async function sendVerificationEmail(userId: string, email: string): Promise<void> {
  const token = await createVerificationToken(userId);
  const link = `${baseUrl()}/verify-email?token=${token}`;
  await sendEmail({
    to: email,
    subject: "Verify your email — Investment Property Analyzer",
    text: `Verify your email by visiting: ${link}\n\nThis link expires in 24 hours.`,
    html: `<p>Welcome to Investment Property Analyzer.</p><p><a href="${link}">Click here to verify your email</a>. This link expires in 24 hours.</p>`,
  });
}

export async function sendPasswordResetEmail(userId: string, email: string): Promise<void> {
  const token = await createPasswordResetToken(userId);
  const link = `${baseUrl()}/reset-password?token=${token}`;
  await sendEmail({
    to: email,
    subject: "Reset your password — Investment Property Analyzer",
    text: `Reset your password by visiting: ${link}\n\nThis link expires in 1 hour. If you didn't request this, you can ignore this email.`,
    html: `<p><a href="${link}">Click here to reset your password</a>. This link expires in 1 hour.</p><p>If you didn't request this, you can ignore this email.</p>`,
  });
}
