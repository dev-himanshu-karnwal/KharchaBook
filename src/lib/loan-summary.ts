import type { LoanSummary, PersonalLoan } from "@/lib/types";

/** Outstanding totals across active (not written off, not settled) loans. */
export function summarizeLoans(loans: PersonalLoan[]): LoanSummary {
  let owedToYou = 0;
  let youOwe = 0;

  for (const loan of loans) {
    if (loan.is_written_off) continue;
    const outstanding = loan.outstanding_amount ?? 0;
    if (outstanding <= 0) continue;
    if (loan.direction === "lent") owedToYou += outstanding;
    else youOwe += outstanding;
  }

  return { owedToYou, youOwe };
}
