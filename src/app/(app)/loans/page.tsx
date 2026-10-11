import { createClient } from "@/utils/supabase/server";
import { getLoans } from "@/actions/loans";
import { summarizeLoans } from "@/lib/loan-summary";
import { LoansClient } from "@/components/loans/loans-client";
import type { Account } from "@/lib/types";

export default async function LoansPage() {
  const supabase = await createClient();

  const [accountsRes, loansRes] = await Promise.all([
    supabase.from("accounts").select("*").eq("is_active", true).order("name"),
    getLoans(),
  ]);

  const accounts = (accountsRes.data ?? []) as Account[];

  return (
    <LoansClient
      loans={loansRes.success ? loansRes.data : []}
      accounts={accounts}
      summary={
        loansRes.success
          ? summarizeLoans(loansRes.data)
          : { owedToYou: 0, youOwe: 0 }
      }
    />
  );
}
