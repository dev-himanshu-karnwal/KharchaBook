import { createClient } from "@/utils/supabase/server";
import { getExpensesByCategory } from "@/actions/dashboard";
import { getLoanSummary, getLoans } from "@/actions/loans";
import { getMonthRange } from "@/lib/utils";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { ExpenseCategoryChart } from "@/components/dashboard/expense-category-chart";
import { AccountBalances } from "@/components/dashboard/account-balances";
import { LoanSummaryCard } from "@/components/dashboard/loan-summary-card";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { buildActivityFeed, sortActivity } from "@/lib/activity-feed";
import type { Account, MonthlySummary, Transaction } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { start, end } = getMonthRange();

  const [
    accountsRes,
    incomeRes,
    expenseRes,
    transactionsRes,
    categoryExpensesRes,
    loanSummaryRes,
    loansRes,
  ] = await Promise.all([
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
    supabase
      .from("transactions")
      .select(
        "*, account:accounts!transactions_account_id_fkey(*), category:categories(*), transfer_to_account:accounts!transactions_transfer_to_account_id_fkey(*)"
      )
      .gte("date", start)
      .lte("date", end),
    getExpensesByCategory(start, end),
    getLoanSummary(),
    getLoans(),
  ]);

  const accounts = (accountsRes.data ?? []) as Account[];
  const loans = loansRes.success ? loansRes.data : [];
  const transactions = (transactionsRes.data ?? []) as Transaction[];

  const monthlyActivity = sortActivity(
    buildActivityFeed(transactions, loans).filter(
      (item) => item.date >= start && item.date <= end
    ),
    "date",
    "desc",
    loans
  );
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
      {loanSummaryRes.success && (
        <LoanSummaryCard summary={loanSummaryRes.data} />
      )}
      <RecentActivity items={monthlyActivity} loans={loans} />
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
