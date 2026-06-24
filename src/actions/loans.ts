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

  const enriched = (loans ?? []).map((loan) => {
    const repayments = (loan.repayments ?? []) as LoanRepayment[];
    const repaid = repayments.reduce((sum, r) => sum + Number(r.amount), 0);
    return {
      ...loan,
      amount: Number(loan.amount),
      repayments: repayments.map((r) => ({ ...r, amount: Number(r.amount) })),
      repaid_amount: repaid,
      outstanding_amount: Number(loan.amount) - repaid,
    } as PersonalLoan;
  });

  return { success: true, data: enriched };
}

export async function getLoanSummary(): Promise<ActionResult<LoanSummary>> {
  const result = await getLoans();
  if (!result.success) return result;

  let owedToYou = 0;
  let youOwe = 0;

  for (const loan of result.data) {
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
    data: {
      ...(loan as PersonalLoan),
      amount: Number(loan.amount),
      repaid_amount: 0,
      outstanding_amount: Number(loan.amount),
      repayments: [],
    },
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
    .select("*, repayments:loan_repayments(*)")
    .eq("id", id)
    .single();

  if (loanErr || !loan) return { success: false, error: "Loan not found" };

  const direction = loan.direction as "lent" | "borrowed";

  for (const repayment of loan.repayments ?? []) {
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
