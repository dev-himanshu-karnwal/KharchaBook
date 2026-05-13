"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type { Account, ActionResult, CreateAccountInput } from "@/lib/types";

export async function createAccount(
  data: CreateAccountInput,
): Promise<ActionResult<Account>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: account, error } = await supabase
    .from("accounts")
    .insert({
      user_id: user.id,
      name: data.name,
      type: data.type,
      balance: data.balance,
      color: data.color,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/");
  return { success: true, data: account as Account };
}

export async function updateAccount(
  id: string,
  data: Partial<CreateAccountInput>,
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.from("accounts").update(data).eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/");
  return { success: true, data: undefined };
}

export async function deleteAccount(id: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { count } = await supabase
    .from("transactions")
    .select("*", { count: "exact", head: true })
    .eq("account_id", id);

  if (count && count > 0) {
    return {
      success: false,
      error: "Cannot delete account with existing transactions. Deactivate it instead.",
    };
  }

  const { error } = await supabase.from("accounts").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/");
  return { success: true, data: undefined };
}

export async function toggleAccountActive(
  id: string,
  isActive: boolean,
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("accounts")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/");
  return { success: true, data: undefined };
}
