import { createClient } from "@/utils/supabase/server";
import { getMonthRange } from "@/lib/utils";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { UpcomingRecurring } from "@/components/dashboard/upcoming-recurring";
import { AccountBalances } from "@/components/dashboard/account-balances";
import type { Account, MonthlySummary, RecurringTransaction, Transaction } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { start, end } = getMonthRange();
  const today = new Date().toISOString().split("T")[0];
  const next30 = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

  const [accountsRes, incomeRes, expenseRes, recentRes, upcomingRes] =
    await Promise.all([
      supabase
        .from("accounts")
        .select("*")
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("transactions")
        .select("amount")
        .eq("type", "income")
        .gte("date", start)
        .lte("date", end),
      supabase
        .from("transactions")
        .select("amount")
        .eq("type", "expense")
        .gte("date", start)
        .lte("date", end),
      supabase
        .from("transactions")
        .select("*, account:accounts(*), category:categories(*)")
        .order("date", { ascending: false })
        .limit(10),
      supabase
        .from("recurring_transactions")
        .select("*, account:accounts(*), category:categories(*)")
        .eq("is_active", true)
        .gte("next_due_date", today)
        .lte("next_due_date", next30)
        .order("next_due_date"),
    ]);

  const accounts = (accountsRes.data ?? []) as Account[];
  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);
  const monthlyIncome = (incomeRes.data ?? []).reduce(
    (sum, t) => sum + Number(t.amount),
    0,
  );
  const monthlyExpenses = (expenseRes.data ?? []).reduce(
    (sum, t) => sum + Number(t.amount),
    0,
  );

  const summary: MonthlySummary = {
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
    netSavings: monthlyIncome - monthlyExpenses,
  };

  return (
    <div className="space-y-6">
      <SummaryCards summary={summary} />
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentTransactions transactions={(recentRes.data ?? []) as Transaction[]} />
        <div className="space-y-6">
          <AccountBalances accounts={accounts} />
          <UpcomingRecurring
            recurring={(upcomingRes.data ?? []) as RecurringTransaction[]}
          />
        </div>
      </div>
    </div>
  );
}
