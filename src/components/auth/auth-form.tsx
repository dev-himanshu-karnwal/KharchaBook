"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, signup } from "@/actions/auth";

export function AuthForm({
  mode,
  initialError,
}: {
  mode: "login" | "signup";
  initialError?: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isSignup = mode === "signup";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const formData = new FormData(e.currentTarget);

    if (isSignup) {
      const result = await signup(formData);
      if (!result.success) {
        setError(result.error);
        setLoading(false);
        return;
      }
      if (result.data.needsConfirmation) {
        setMessage("Check your email for a confirmation link, then sign in.");
        setLoading(false);
        return;
      }
      router.push("/");
      router.refresh();
      return;
    }

    const result = await login(formData);
    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          autoFocus
          aria-invalid={!!error}
          aria-describedby={error ? "auth-error" : undefined}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={isSignup ? 6 : undefined}
          autoComplete={isSignup ? "new-password" : "current-password"}
          placeholder="••••••••"
          aria-invalid={!!error}
        />
      </div>
      {isSignup && (
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="••••••••"
            aria-invalid={!!error}
          />
        </div>
      )}
      {error && (
        <p
          id="auth-error"
          role="alert"
          className="rounded-xl bg-[color-mix(in_oklch,var(--expense)_12%,transparent)] px-3 py-2 text-sm text-[var(--expense)]"
        >
          {error}
        </p>
      )}
      {message && (
        <p
          role="status"
          className="rounded-xl bg-[color-mix(in_oklch,var(--income)_12%,transparent)] px-3 py-2 text-sm text-[var(--income)]"
        >
          {message}
        </p>
      )}
      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading
          ? isSignup
            ? "Creating account…"
            : "Signing in…"
          : isSignup
            ? "Create account"
            : "Sign in"}
      </Button>
      <p className="text-muted-foreground text-center text-sm">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-foreground font-medium underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link
              href="/signup"
              className="text-foreground font-medium underline-offset-4 hover:underline"
            >
              Create an account
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
