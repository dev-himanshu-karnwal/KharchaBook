"use server";

import { createClient } from "@/utils/supabase/server";
import {
  computeTransactionBalanceDeltas,
  validateBalanceDelta,
} from "@/lib/account-balance";
import type {
  Account,
  ActionResult,
  CreateTransactionInput,
  Transaction,
  UpdateTransactionInput,
} from "@/lib/types";

async function fetchAccountsForTransaction(
  supabase: Awaited<ReturnType<typeof createClient>>,
  txn: Pick<CreateTransactionInput, "account_id" | "transfer_to_account_id">
): Promise<Map<string, Account> | { error: string }> {
  const accountIds = [txn.account_id];
  if (txn.transfer_to_account_id) {
    accountIds.push(txn.transfer_to_account_id);
  }

  const { data: accounts, error } = await supabase
    .from("accounts")
    .select("*")
    .in("id", accountIds);

  if (error) return { error: error.message };
  if (!accounts || accounts.length !== accountIds.length) {
    return { error: "One or more accounts not found" };
  }

  return new Map(
    (accounts as Account[]).map((account) => [account.id, account])
  );
}

async function applyBalanceDeltas(
  supabase: Awaited<ReturnType<typeof createClient>>,
  accountsById: Map<string, Account>,
  txn: Pick<
    CreateTransactionInput,
    "type" | "amount" | "account_id" | "transfer_to_account_id"
  >
): Promise<{ ok: true } | { ok: false; error: string }> {
  let deltas;
  try {
    deltas = computeTransactionBalanceDeltas(txn, accountsById);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Invalid transaction",
    };
  }

  for (const { accountId, delta } of deltas) {
    const account = accountsById.get(accountId);
    if (!account) continue;

    const validation = validateBalanceDelta(account, delta);
    if (!validation.ok) {
      return validation;
    }
  }

  for (const { accountId, delta } of deltas) {
    const { error } = await supabase.rpc("adjust_account_balance", {
      p_account_id: accountId,
      p_delta: delta,
    });

    if (error) {
      return { ok: false, error: error.message };
    }
  }

  return { ok: true };
}

export async function createTransaction(
  data: CreateTransactionInput
): Promise<ActionResult<Transaction>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const accountsResult = await fetchAccountsForTransaction(supabase, data);
  if (!(accountsResult instanceof Map)) {
    return { success: false, error: accountsResult.error };
  }

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

  const balanceResult = await applyBalanceDeltas(
    supabase,
    accountsResult,
    data
  );
  if (!balanceResult.ok) {
    await supabase.from("transactions").delete().eq("id", txn.id);
    return { success: false, error: balanceResult.error };
  }

  return { success: true, data: txn as Transaction };
}

async function reverseTransactionBalance(
  supabase: Awaited<ReturnType<typeof createClient>>,
  txn: Pick<
    Transaction,
    "type" | "amount" | "account_id" | "transfer_to_account_id"
  >
) {
  const accountsResult = await fetchAccountsForTransaction(supabase, txn);
  if (!(accountsResult instanceof Map)) {
    throw new Error(accountsResult.error);
  }

  const reversed = {
    ...txn,
    amount: txn.amount,
  };

  const deltas = computeTransactionBalanceDeltas(reversed, accountsResult).map(
    ({ accountId, delta }) => ({
      accountId,
      delta: -delta,
    })
  );

  for (const { accountId, delta } of deltas) {
    const account = accountsResult.get(accountId);
    if (!account) continue;

    const validation = validateBalanceDelta(account, delta);
    if (!validation.ok) {
      throw new Error(validation.error);
    }

    const { error } = await supabase.rpc("adjust_account_balance", {
      p_account_id: accountId,
      p_delta: delta,
    });

    if (error) throw new Error(error.message);
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

  try {
    await reverseTransactionBalance(supabase, txn);
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to reverse balances",
    };
  }

  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  return { success: true, data: undefined };
}
