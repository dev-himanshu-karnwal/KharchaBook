import { createClient } from "@/utils/supabase/server";
import { getLoans, getLoanSummary } from "@/actions/loans";
import { LoansClient } from "@/components/loans/loans-client";
import type { Account } from "@/lib/types";

export default async function LoansPage() {
  const supabase = await createClient();

  const [accountsRes, loansRes, summaryRes] = await Promise.all([
    supabase.from("accounts").select("*").eq("is_active", true).order("name"),
    getLoans(),
    getLoanSummary(),
  ]);

  const accounts = (accountsRes.data ?? []) as Account[];

  return (
    <LoansClient
      loans={loansRes.success ? loansRes.data : []}
      accounts={accounts}
      summary={
        summaryRes.success ? summaryRes.data : { owedToYou: 0, youOwe: 0 }
      }
    />
  );
}
