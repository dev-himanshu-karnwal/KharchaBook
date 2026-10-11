"use server";

import { createClient } from "@/utils/supabase/server";
import { validateCreditCardInput } from "@/lib/credit-card";
import type {
  Account,
  ActionResult,
  CreateAccountInput,
  CreateCreditCardInput,
  UpdateCreditCardInput,
} from "@/lib/types";

export async function createAccount(
  data: CreateAccountInput
): Promise<ActionResult<Account>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  if (data.type === "credit_card") {
    return {
      success: false,
      error: "Use the Credit Cards page to add a credit card",
    };
  }

  const { data: account, error } = await supabase
    .from("accounts")
    .insert({
      user_id: user.id,
      name: data.name,
      type: data.type,
      nature: "asset",
      balance: data.balance,
      color: data.color,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  return { success: true, data: account as Account };
}

export async function createCreditCard(
  data: CreateCreditCardInput
): Promise<ActionResult<Account>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const validation = validateCreditCardInput(data);
  if (!validation.ok) return { success: false, error: validation.error };

  const { data: account, error } = await supabase
    .from("accounts")
    .insert({
      user_id: user.id,
      name: data.name,
      type: "credit_card",
      nature: "liability",
      balance: data.balance,
      color: data.color,
      credit_limit: data.credit_limit,
      payment_due_day: data.payment_due_day,
      statement_day: data.statement_day,
      card_last4: data.card_last4,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  return { success: true, data: account as Account };
}

export async function updateAccount(
  id: string,
  data: Partial<CreateAccountInput>
): Promise<ActionResult> {
  const supabase = await createClient();

  if (data.type === "credit_card") {
    return {
      success: false,
      error: "Credit cards must be updated from the Credit Cards page",
    };
  }

  const { error } = await supabase.from("accounts").update(data).eq("id", id);

  if (error) return { success: false, error: error.message };

  return { success: true, data: undefined };
}

export async function updateCreditCard(
  id: string,
  data: UpdateCreditCardInput
): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return { success: false, error: "Credit card not found" };
  }

  if (existing.type !== "credit_card") {
    return { success: false, error: "Account is not a credit card" };
  }

  const merged = {
    credit_limit:
      data.credit_limit !== undefined
        ? data.credit_limit
        : existing.credit_limit,
    payment_due_day:
      data.payment_due_day !== undefined
        ? data.payment_due_day
        : existing.payment_due_day,
    statement_day:
      data.statement_day !== undefined
        ? data.statement_day
        : existing.statement_day,
    card_last4:
      data.card_last4 !== undefined ? data.card_last4 : existing.card_last4,
    balance: Number(existing.balance),
  };

  const validation = validateCreditCardInput(merged);
  if (!validation.ok) return { success: false, error: validation.error };

  const { error } = await supabase
    .from("accounts")
    .update({
      name: data.name,
      color: data.color,
      credit_limit: data.credit_limit,
      payment_due_day: data.payment_due_day,
      statement_day: data.statement_day,
      card_last4: data.card_last4,
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

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
      error:
        "Cannot delete account with existing transactions. Deactivate it instead.",
    };
  }

  const { error } = await supabase.from("accounts").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  return { success: true, data: undefined };
}

export async function toggleAccountActive(
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("accounts")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  return { success: true, data: undefined };
}
