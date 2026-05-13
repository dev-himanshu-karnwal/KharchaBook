"use server";

import { createClient } from "@/utils/supabase/server";
import type { ActionResult } from "@/lib/types";

export async function login(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}

export async function signup(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
