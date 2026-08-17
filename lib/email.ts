import nodemailer from "nodemailer";

interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
}

let cachedTransport: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransport() {
  if (!process.env.SMTP_HOST) return null;
  if (cachedTransport) return cachedTransport;

  cachedTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
  });
  return cachedTransport;
}

/**
 * Sends real email when SMTP_HOST is configured. Without it, logs the
 * message to the server console instead of failing outright — the same
 * graceful-degradation pattern used for Zillow/RentCast elsewhere in
 * this app. This means account verification and password reset still
 * work end-to-end in dev/test without any email provider set up; you
 * just read the link from the server log instead of an inbox.
 */
export async function sendEmail({ to, subject, html, text }: SendEmailArgs): Promise<void> {
  const transport = getTransport();

  if (!transport) {
    // eslint-disable-next-line no-console
    console.log(
      `[email:dev-mode] No SMTP_HOST configured — would have sent to ${to}\nSubject: ${subject}\n${text}`
    );
    return;
  }

  await transport.sendMail({
    from: process.env.EMAIL_FROM || "Investment Property Analyzer <no-reply@example.com>",
    to,
    subject,
    html,
    text,
  });
}
