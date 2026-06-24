"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type {
  ActionResult,
  CreateTransactionInput,
  Transaction,
  UpdateTransactionInput,
} from "@/lib/types";

export async function createTransaction(
  data: CreateTransactionInput
): Promise<ActionResult<Transaction>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: txn, error } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      account_id: data.account_id,
      category_id: data.category_id,
      type: data.type,
      amount: data.amount,
      description: data.description,
      date: data.date,
      transfer_to_account_id: data.transfer_to_account_id,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  await applyTransactionBalance(supabase, data);

  revalidatePath("/", "layout");
  return { success: true, data: txn as Transaction };
}

async function reverseTransactionBalance(
  supabase: Awaited<ReturnType<typeof createClient>>,
  txn: Pick<
    Transaction,
    "type" | "amount" | "account_id" | "transfer_to_account_id"
  >
) {
  if (txn.type === "expense") {
    await supabase.rpc("adjust_account_balance", {
      p_account_id: txn.account_id,
      p_delta: txn.amount,
    });
  } else if (txn.type === "income") {
    await supabase.rpc("adjust_account_balance", {
      p_account_id: txn.account_id,
      p_delta: -txn.amount,
    });
  } else if (txn.type === "transfer") {
    await supabase.rpc("adjust_account_balance", {
      p_account_id: txn.account_id,
      p_delta: txn.amount,
    });
    if (txn.transfer_to_account_id) {
      await supabase.rpc("adjust_account_balance", {
        p_account_id: txn.transfer_to_account_id,
        p_delta: -txn.amount,
      });
    }
  }
}

async function applyTransactionBalance(
  supabase: Awaited<ReturnType<typeof createClient>>,
  txn: Pick<
    Transaction,
    "type" | "amount" | "account_id" | "transfer_to_account_id"
  >
) {
  if (txn.type === "expense") {
    await supabase.rpc("adjust_account_balance", {
      p_account_id: txn.account_id,
      p_delta: -txn.amount,
    });
  } else if (txn.type === "income") {
    await supabase.rpc("adjust_account_balance", {
      p_account_id: txn.account_id,
      p_delta: txn.amount,
    });
  } else if (txn.type === "transfer") {
    await supabase.rpc("adjust_account_balance", {
      p_account_id: txn.account_id,
      p_delta: -txn.amount,
    });
    if (txn.transfer_to_account_id) {
      await supabase.rpc("adjust_account_balance", {
        p_account_id: txn.transfer_to_account_id,
        p_delta: txn.amount,
      });
    }
  }
}

export async function updateTransaction(
  id: string,
  data: UpdateTransactionInput
): Promise<ActionResult<Transaction>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: txn, error: fetchErr } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchErr || !txn)
    return { success: false, error: "Transaction not found" };

  const { data: updated, error } = await supabase
    .from("transactions")
    .update({
      category_id: data.category_id,
      description: data.description,
      date: data.date,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/", "layout");
  return { success: true, data: updated as Transaction };
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: txn, error: fetchErr } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchErr || !txn)
    return { success: false, error: "Transaction not found" };

  await reverseTransactionBalance(supabase, txn);

  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/", "layout");
  return { success: true, data: undefined };
}
