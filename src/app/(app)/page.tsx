import { createClient } from "@/utils/supabase/server";
import { getActiveBudgets } from "@/actions/budgets";
import { getExpensesByCategory } from "@/actions/dashboard";
import { getLoanSummary, getLoans } from "@/actions/loans";
import { getMonthRange } from "@/lib/utils";
import { ActiveBudgetsSection } from "@/components/dashboard/active-budgets-section";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { ExpenseCategoryChart } from "@/components/dashboard/expense-category-chart";
import { AccountBalances } from "@/components/dashboard/account-balances";
import { CreditCardSummary } from "@/components/dashboard/credit-card-summary";
import { LoanSummaryCard } from "@/components/dashboard/loan-summary-card";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { buildActivityFeed, sortActivity } from "@/lib/activity-feed";
import { computeNetWorth } from "@/lib/account-balance";
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
    activeBudgetsRes,
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
    getActiveBudgets(),
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
  const totalBalance = computeNetWorth(accounts);
  const monthlyIncome = (incomeRes.data ?? []).reduce(
    (sum, t) => sum + Number(t.amount),
    0
  );
  const monthlyExpenses = (expenseRes.data ?? []).reduce(
    (sum, t) => sum + Number(t.amount),
    0
  );

  const summary: MonthlySummary = {
    assets: totalBalance.assets,
    creditCardOutstanding: totalBalance.creditCardOutstanding,
    netWorth: totalBalance.netWorth,
    monthlyIncome,
    monthlyExpenses,
    netSavings: monthlyIncome - monthlyExpenses,
  };

  const activeBudgets = activeBudgetsRes.success ? activeBudgetsRes.data : [];

  return (
    <div className="space-y-6">
      <SummaryCards summary={summary} />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <ActiveBudgetsSection budgets={activeBudgets} />
          <ExpenseCategoryChart
            initialData={
              categoryExpensesRes.success ? categoryExpensesRes.data : []
            }
            initialStart={start}
            initialEnd={end}
          />
        </div>
        <div className="space-y-6">
          <AccountBalances accounts={accounts} />
          <CreditCardSummary accounts={accounts} />
          <RecentActivity items={monthlyActivity} loans={loans} />
        </div>
      </div>
      {loanSummaryRes.success && (
        <LoanSummaryCard summary={loanSummaryRes.data} />
      )}
    </div>
  );
}
