"use server";

import { headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import type { ActionResult } from "@/lib/types";

function readEmail(formData: FormData): string {
  return String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
}

function readPassword(formData: FormData): string {
  return String(formData.get("password") ?? "");
}

async function getOrigin(): Promise<string> {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;

  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`;

  return process.env.NEXT_PUBLIC_SITE_URL ?? "";
}

export async function login(formData: FormData): Promise<ActionResult> {
  const email = readEmail(formData);
  const password = readPassword(formData);

  if (!email || !password) {
    return { success: false, error: "Email and password are required" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}

export async function signup(
  formData: FormData
): Promise<ActionResult<{ needsConfirmation: boolean }>> {
  const email = readEmail(formData);
  const password = readPassword(formData);
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!email || !password) {
    return { success: false, error: "Email and password are required" };
  }
  if (password.length < 6) {
    return {
      success: false,
      error: "Password must be at least 6 characters",
    };
  }
  if (password !== confirmPassword) {
    return { success: false, error: "Passwords do not match" };
  }

  const origin = await getOrigin();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: origin ? `${origin}/auth/callback` : undefined,
    },
  });

  if (error) return { success: false, error: error.message };

  // Confirm-email on + existing confirmed user → fake user, empty identities
  if (data.user && !data.session && (data.user.identities?.length ?? 0) === 0) {
    return {
      success: false,
      error: "An account with this email already exists. Sign in instead.",
    };
  }

  return {
    success: true,
    data: { needsConfirmation: !data.session },
  };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
