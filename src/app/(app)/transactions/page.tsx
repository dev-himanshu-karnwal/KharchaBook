import { createClient } from "@/utils/supabase/server";
import { TransactionList } from "@/components/transactions/transaction-list";
import type { Transaction } from "@/lib/types";

export default async function TransactionsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("transactions")
    .select(
      "*, account:accounts!transactions_account_id_fkey(*), category:categories(*), transfer_to_account:accounts!transactions_transfer_to_account_id_fkey(*)",
    )
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) console.error("transactions fetch error:", error);

  return <TransactionList transactions={(data ?? []) as Transaction[]} />;
}
