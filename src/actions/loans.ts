"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type {
  ActionResult,
  CreateLoanInput,
  CreateRepaymentInput,
  LoanRepayment,
  LoanSummary,
  PersonalLoan,
} from "@/lib/types";

function loanBalanceDelta(
  direction: "lent" | "borrowed",
  amount: number,
  action: "create" | "reverse"
): number {
  const sign = action === "create" ? 1 : -1;
  if (direction === "lent") return -amount * sign;
  return amount * sign;
}

function repaymentBalanceDelta(
  direction: "lent" | "borrowed",
  amount: number,
  action: "create" | "reverse"
): number {
  const sign = action === "create" ? 1 : -1;
  if (direction === "lent") return amount * sign;
  return -amount * sign;
}

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

export async function getLoans(): Promise<ActionResult<PersonalLoan[]>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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

  let owedToYou = 0;
  let youOwe = 0;

  for (const loan of result.data) {
    if (loan.is_written_off) continue;
    const outstanding = loan.outstanding_amount ?? 0;
    if (outstanding <= 0) continue;
    if (loan.direction === "lent") owedToYou += outstanding;
    else youOwe += outstanding;
  }

  return { success: true, data: { owedToYou, youOwe } };
}

export async function createLoan(
  data: CreateLoanInput
): Promise<ActionResult<PersonalLoan>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

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

  await supabase.rpc("adjust_account_balance", {
    p_account_id: data.account_id,
    p_delta: loanBalanceDelta(data.direction, data.amount, "create"),
  });

  revalidatePath("/", "layout");
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

  await supabase.rpc("adjust_account_balance", {
    p_account_id: data.account_id,
    p_delta: repaymentBalanceDelta(
      loan.direction as "lent" | "borrowed",
      data.amount,
      "create"
    ),
  });

  revalidatePath("/", "layout");
  return {
    success: true,
    data: { ...(repayment as LoanRepayment), amount: Number(repayment.amount) },
  };
}

export async function deleteLoan(id: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: loan, error: loanErr } = await supabase
    .from("personal_loans")
    .select("*")
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
    .select("*")
    .eq("loan_id", id);

  if (repayErr) return { success: false, error: repayErr.message };

  const direction = loan.direction as "lent" | "borrowed";

  for (const repayment of repayments ?? []) {
    await supabase.rpc("adjust_account_balance", {
      p_account_id: repayment.account_id,
      p_delta: repaymentBalanceDelta(
        direction,
        Number(repayment.amount),
        "reverse"
      ),
    });
  }

  await supabase.rpc("adjust_account_balance", {
    p_account_id: loan.account_id,
    p_delta: loanBalanceDelta(direction, Number(loan.amount), "reverse"),
  });

  const { error } = await supabase.from("personal_loans").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/", "layout");
  return { success: true, data: undefined };
}

export async function deleteRepayment(id: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: repayment, error: fetchErr } = await supabase
    .from("loan_repayments")
    .select("*, loan:personal_loans(direction)")
    .eq("id", id)
    .single();

  if (fetchErr || !repayment)
    return { success: false, error: "Repayment not found" };

  const direction = (repayment.loan as { direction: "lent" | "borrowed" })
    .direction;

  await supabase.rpc("adjust_account_balance", {
    p_account_id: repayment.account_id,
    p_delta: repaymentBalanceDelta(
      direction,
      Number(repayment.amount),
      "reverse"
    ),
  });

  const { error } = await supabase
    .from("loan_repayments")
    .delete()
    .eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/", "layout");
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

  revalidatePath("/", "layout");
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

  revalidatePath("/", "layout");
  return { success: true, data: enrichLoan(updated) };
}
