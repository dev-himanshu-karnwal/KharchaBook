"use server";

import { createClient, getAuthClaims } from "@/utils/supabase/server";
import {
  loanBalanceDelta,
  repaymentBalanceDelta,
  validateBalanceDelta,
} from "@/lib/account-balance";
import { summarizeLoans } from "@/lib/loan-summary";
import type {
  Account,
  ActionResult,
  CreateLoanInput,
  CreateRepaymentInput,
  LoanRepayment,
  LoanSummary,
  PersonalLoan,
} from "@/lib/types";

function enrichLoan(loan: Record<string, unknown>): PersonalLoan {
  const repayments = (loan.repayments ?? []) as LoanRepayment[];
  const repaid = repayments.reduce((sum, r) => sum + Number(r.amount), 0);
  const rawOutstanding = Number(loan.amount) - repaid;
  const isWrittenOff = Boolean(loan.is_written_off ?? false);

  return {
    ...(loan as unknown as PersonalLoan),
    amount: Number(loan.amount),
    is_written_off: isWrittenOff,
    written_off_amount: loan.written_off_amount
      ? Number(loan.written_off_amount)
      : null,
    repayments: repayments.map((r) => ({ ...r, amount: Number(r.amount) })),
    repaid_amount: repaid,
    outstanding_amount: isWrittenOff ? 0 : Math.max(0, rawOutstanding),
  };
}

async function fetchAccount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  accountId: string
): Promise<Account | { error: string }> {
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", accountId)
    .single();

  if (error || !data) return { error: error?.message ?? "Account not found" };
  return data as Account;
}

async function applyAccountDelta(
  supabase: Awaited<ReturnType<typeof createClient>>,
  account: Account,
  delta: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  const validation = validateBalanceDelta(account, delta);
  if (!validation.ok) return validation;

  const { error } = await supabase.rpc("adjust_account_balance", {
    p_account_id: account.id,
    p_delta: delta,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function getLoans(): Promise<ActionResult<PersonalLoan[]>> {
  const supabase = await createClient();
  const user = await getAuthClaims(supabase);
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: loans, error } = await supabase
    .from("personal_loans")
    .select(
      "*, account:accounts(*), repayments:loan_repayments(*, account:accounts(*))"
    )
    .eq("user_id", user.id)
    .order("date", { ascending: false });

  if (error) return { success: false, error: error.message };

  const enriched = (loans ?? []).map((loan) => enrichLoan(loan));

  return { success: true, data: enriched };
}

export async function getLoanSummary(): Promise<ActionResult<LoanSummary>> {
  const result = await getLoans();
  if (!result.success) return result;

  return { success: true, data: summarizeLoans(result.data) };
}

export async function createLoan(
  data: CreateLoanInput
): Promise<ActionResult<PersonalLoan>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const account = await fetchAccount(supabase, data.account_id);
  if ("error" in account) return { success: false, error: account.error };

  const delta = loanBalanceDelta(
    account,
    data.direction,
    data.amount,
    "create"
  );
  const validation = validateBalanceDelta(account, delta);
  if (!validation.ok) return { success: false, error: validation.error };

  const { data: loan, error } = await supabase
    .from("personal_loans")
    .insert({
      user_id: user.id,
      account_id: data.account_id,
      person_name: data.person_name.trim(),
      direction: data.direction,
      amount: data.amount,
      date: data.date,
      description: data.description,
    })
    .select("*, account:accounts(*)")
    .single();

  if (error) return { success: false, error: error.message };

  const applied = await applyAccountDelta(supabase, account, delta);
  if (!applied.ok) return { success: false, error: applied.error };

  return {
    success: true,
    data: enrichLoan({
      ...loan,
      repayments: [],
    }),
  };
}

export async function createRepayment(
  data: CreateRepaymentInput
): Promise<ActionResult<LoanRepayment>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: loan, error: loanErr } = await supabase
    .from("personal_loans")
    .select("*, repayments:loan_repayments(amount)")
    .eq("id", data.loan_id)
    .single();

  if (loanErr || !loan) return { success: false, error: "Loan not found" };

  if (loan.is_written_off) {
    return {
      success: false,
      error: "Cannot add repayment to a written-off loan",
    };
  }

  const repaid = (loan.repayments ?? []).reduce(
    (sum: number, r: { amount: number }) => sum + Number(r.amount),
    0
  );
  const outstanding = Number(loan.amount) - repaid;

  if (data.amount > outstanding) {
    return {
      success: false,
      error: `Repayment exceeds outstanding balance of ${outstanding.toFixed(2)}`,
    };
  }

  const account = await fetchAccount(supabase, data.account_id);
  if ("error" in account) return { success: false, error: account.error };

  const direction = loan.direction as "lent" | "borrowed";
  const delta = repaymentBalanceDelta(
    account,
    direction,
    data.amount,
    "create"
  );
  const validation = validateBalanceDelta(account, delta);
  if (!validation.ok) return { success: false, error: validation.error };

  const { data: repayment, error } = await supabase
    .from("loan_repayments")
    .insert({
      user_id: user.id,
      loan_id: data.loan_id,
      account_id: data.account_id,
      amount: data.amount,
      date: data.date,
      description: data.description,
    })
    .select("*, account:accounts(*)")
    .single();

  if (error) return { success: false, error: error.message };

  const applied = await applyAccountDelta(supabase, account, delta);
  if (!applied.ok) return { success: false, error: applied.error };

  return {
    success: true,
    data: { ...(repayment as LoanRepayment), amount: Number(repayment.amount) },
  };
}

export async function deleteLoan(id: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: loan, error: loanErr } = await supabase
    .from("personal_loans")
    .select("*, account:accounts(*)")
    .eq("id", id)
    .single();

  if (loanErr || !loan) return { success: false, error: "Loan not found" };

  if (loan.is_written_off) {
    return {
      success: false,
      error:
        "Restore this loan before deleting. Written-off loans are kept for your records and don't affect balance.",
    };
  }

  const { data: repayments, error: repayErr } = await supabase
    .from("loan_repayments")
    .select("*, account:accounts(*)")
    .eq("loan_id", id);

  if (repayErr) return { success: false, error: repayErr.message };

  const direction = loan.direction as "lent" | "borrowed";
  const loanAccount = loan.account as Account | null;
  if (!loanAccount) return { success: false, error: "Loan account not found" };

  for (const repayment of repayments ?? []) {
    const repaymentAccount = repayment.account as Account | null;
    if (!repaymentAccount) {
      return { success: false, error: "Repayment account not found" };
    }

    const applied = await applyAccountDelta(
      supabase,
      repaymentAccount,
      repaymentBalanceDelta(
        repaymentAccount,
        direction,
        Number(repayment.amount),
        "reverse"
      )
    );
    if (!applied.ok) return { success: false, error: applied.error };
  }

  const loanReversed = await applyAccountDelta(
    supabase,
    loanAccount,
    loanBalanceDelta(loanAccount, direction, Number(loan.amount), "reverse")
  );
  if (!loanReversed.ok) return { success: false, error: loanReversed.error };

  const { error } = await supabase.from("personal_loans").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  return { success: true, data: undefined };
}

export async function deleteRepayment(id: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: repayment, error: fetchErr } = await supabase
    .from("loan_repayments")
    .select("*, account:accounts(*), loan:personal_loans(direction)")
    .eq("id", id)
    .single();

  if (fetchErr || !repayment)
    return { success: false, error: "Repayment not found" };

  const direction = (repayment.loan as { direction: "lent" | "borrowed" })
    .direction;
  const account = repayment.account as Account | null;
  if (!account) return { success: false, error: "Repayment account not found" };

  const applied = await applyAccountDelta(
    supabase,
    account,
    repaymentBalanceDelta(
      account,
      direction,
      Number(repayment.amount),
      "reverse"
    )
  );
  if (!applied.ok) return { success: false, error: applied.error };

  const { error } = await supabase
    .from("loan_repayments")
    .delete()
    .eq("id", id);
  if (error) return { success: false, error: error.message };

  return { success: true, data: undefined };
}

export async function writeOffLoan(
  id: string
): Promise<ActionResult<PersonalLoan>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: loan, error: loanErr } = await supabase
    .from("personal_loans")
    .select("*, repayments:loan_repayments(amount)")
    .eq("id", id)
    .single();

  if (loanErr || !loan) return { success: false, error: "Loan not found" };
  if (loan.is_written_off) {
    return { success: false, error: "Loan is already written off" };
  }

  const repaid = (loan.repayments ?? []).reduce(
    (sum: number, r: { amount: number }) => sum + Number(r.amount),
    0
  );
  const outstanding = Number(loan.amount) - repaid;

  if (outstanding <= 0) {
    return { success: false, error: "Nothing left to write off" };
  }

  // Write-off only closes the receivable/payable — no cash movement.
  // Borrowed: keep net cash (amount - repaid). Lent: keep net cash (-amount + repaid).
  const { data: updated, error } = await supabase
    .from("personal_loans")
    .update({
      is_written_off: true,
      written_off_at: new Date().toISOString(),
      written_off_amount: outstanding,
    })
    .eq("id", id)
    .select(
      "*, account:accounts(*), repayments:loan_repayments(*, account:accounts(*))"
    )
    .single();

  if (error) return { success: false, error: error.message };

  return { success: true, data: enrichLoan(updated) };
}

export async function undoWriteOffLoan(
  id: string
): Promise<ActionResult<PersonalLoan>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: loan, error: loanErr } = await supabase
    .from("personal_loans")
    .select("is_written_off")
    .eq("id", id)
    .single();

  if (loanErr || !loan) return { success: false, error: "Loan not found" };
  if (!loan.is_written_off) {
    return { success: false, error: "Loan is not written off" };
  }

  const { data: updated, error } = await supabase
    .from("personal_loans")
    .update({
      is_written_off: false,
      written_off_at: null,
      written_off_amount: null,
    })
    .eq("id", id)
    .select(
      "*, account:accounts(*), repayments:loan_repayments(*, account:accounts(*))"
    )
    .single();

  if (error) return { success: false, error: error.message };

  return { success: true, data: enrichLoan(updated) };
}
