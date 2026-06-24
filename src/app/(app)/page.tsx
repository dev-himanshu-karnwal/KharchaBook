import { createClient } from "@/utils/supabase/server";
import { getExpensesByCategory } from "@/actions/dashboard";
import { getMonthRange } from "@/lib/utils";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { ExpenseCategoryChart } from "@/components/dashboard/expense-category-chart";
import { AccountBalances } from "@/components/dashboard/account-balances";
import type { Account, MonthlySummary } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { start, end } = getMonthRange();

  const [accountsRes, incomeRes, expenseRes, categoryExpensesRes] =
    await Promise.all([
      supabase.from("accounts").select("*").eq("is_active", true).order("name"),
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
      getExpensesByCategory(start, end),
    ]);

  const accounts = (accountsRes.data ?? []) as Account[];
  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);
  const monthlyIncome = (incomeRes.data ?? []).reduce(
    (sum, t) => sum + Number(t.amount),
    0
  );
  const monthlyExpenses = (expenseRes.data ?? []).reduce(
    (sum, t) => sum + Number(t.amount),
    0
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
        <ExpenseCategoryChart
          initialData={
            categoryExpensesRes.success ? categoryExpensesRes.data : []
          }
          initialStart={start}
          initialEnd={end}
        />
        <AccountBalances accounts={accounts} />
      </div>
    </div>
  );
}
