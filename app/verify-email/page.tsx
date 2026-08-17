import Link from "next/link";
import { AuthCard } from "@/components/AuthCard";
import { consumeVerificationToken } from "@/lib/tokens";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token;
  const userId = token ? await consumeVerificationToken(token) : null;

  return (
    <AuthCard
      title={userId ? "Email verified" : "Verification failed"}
      subtitle={
        userId
          ? "Your email address has been confirmed."
          : "This link is invalid or has expired."
      }
    >
      <p className="text-sm text-slate-600 text-center">
        {userId ? (
          <>You're all set. Head back to the app to continue.</>
        ) : (
          <>
            Verification links expire after 24 hours. Log in and use the
            "Resend verification email" option to get a new one.
          </>
        )}
      </p>
      <Link
        href="/"
        className="mt-4 block w-full rounded-lg bg-slate-900 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-slate-700"
      >
        Go to the app
      </Link>
    </AuthCard>
  );
}
