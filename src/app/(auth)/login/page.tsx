import { AuthForm } from "@/components/auth/auth-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const initialError =
    params.error === "auth_failed"
      ? "Email confirmation failed. Try signing in, or create a new account."
      : null;

  return <AuthForm mode="login" initialError={initialError} />;
}
