import { createClient } from "@/utils/supabase/server";
import { TransactionList } from "@/components/transactions/transaction-list";
import type { Account, Category, Transaction } from "@/lib/types";

export default async function TransactionsPage() {
  const supabase = await createClient();

  const [transactionsRes, accountsRes, categoriesRes] = await Promise.all([
    supabase
      .from("transactions")
      .select(
        "*, account:accounts!transactions_account_id_fkey(*), category:categories(*), transfer_to_account:accounts!transactions_transfer_to_account_id_fkey(*)"
      )
      .order("date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("accounts").select("*").eq("is_active", true).order("name"),
    supabase.from("categories").select("*").order("sort_order"),
  ]);

  if (transactionsRes.error) {
    console.error("transactions fetch error:", transactionsRes.error);
  }

  return (
    <TransactionList
      transactions={(transactionsRes.data ?? []) as Transaction[]}
      accounts={(accountsRes.data ?? []) as Account[]}
      categories={(categoriesRes.data ?? []) as Category[]}
    />
  );
}
