import crypto from "crypto";
import { prisma } from "./db";

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createVerificationToken(userId: string): Promise<string> {
  await prisma.verificationToken.deleteMany({ where: { userId } });
  const token = generateToken();
  await prisma.verificationToken.create({
    data: { userId, token, expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS) },
  });
  return token;
}

/** Returns the verified user's id, or null if the token is missing/expired. */
export async function consumeVerificationToken(token: string): Promise<string | null> {
  const record = await prisma.verificationToken.findUnique({ where: { token } });
  if (!record) return null;

  await prisma.verificationToken.delete({ where: { token } });
  if (record.expiresAt < new Date()) return null;

  await prisma.user.update({
    where: { id: record.userId },
    data: { emailVerified: new Date() },
  });
  return record.userId;
}

export async function createPasswordResetToken(userId: string): Promise<string> {
  await prisma.passwordResetToken.deleteMany({ where: { userId } });
  const token = generateToken();
  await prisma.passwordResetToken.create({
    data: { userId, token, expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS) },
  });
  return token;
}

/** Returns the target user's id if the token is valid, or null otherwise. Does not consume it. */
export async function peekPasswordResetToken(token: string): Promise<string | null> {
  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!record || record.expiresAt < new Date()) return null;
  return record.userId;
}

export async function consumePasswordResetToken(token: string): Promise<string | null> {
  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!record) return null;
  await prisma.passwordResetToken.delete({ where: { token } });
  if (record.expiresAt < new Date()) return null;
  return record.userId;
}
