import { createClient } from "@/utils/supabase/server";
import { getActiveBudgets } from "@/actions/budgets";
import { getExpensesByCategory } from "@/actions/dashboard";
import { getLoans } from "@/actions/loans";
import { summarizeLoans } from "@/lib/loan-summary";
import { getMonthRange } from "@/lib/utils";
import { PAGE_META } from "@/lib/nav";
import { PageHeader } from "@/components/v2/page-header";
import { Section } from "@/components/v2/section";
import { StateBlock } from "@/components/v2/state-block";
import {
  AttentionPanel,
  PositionHero,
  type AttentionItem,
} from "@/components/dashboard/position-hero";
import { ActiveBudgetsSection } from "@/components/dashboard/active-budgets-section";
import { ExpenseCategoryChart } from "@/components/dashboard/expense-category-chart";
import { AccountBalances } from "@/components/dashboard/account-balances";
import { CreditCardSummary } from "@/components/dashboard/credit-card-summary";
import { LoanSummaryCard } from "@/components/dashboard/loan-summary-card";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { buildActivityFeed, sortActivity } from "@/lib/activity-feed";
import { computeNetWorth, isCreditCard } from "@/lib/account-balance";
import { getCreditCardWarnings } from "@/lib/credit-card";
import type { Account, MonthlySummary, Transaction } from "@/lib/types";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { start, end } = getMonthRange();
  const meta = PAGE_META["/"];

  const [
    accountsRes,
    incomeRes,
    expenseRes,
    transactionsRes,
    categoryExpensesRes,
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
    getLoans(),
    getActiveBudgets(),
  ]);

  const fetchError =
    accountsRes.error?.message ||
    incomeRes.error?.message ||
    expenseRes.error?.message ||
    transactionsRes.error?.message;

  if (fetchError) {
    return (
      <div>
        <PageHeader title={meta.title} subtitle={meta.subtitle} />
        <div className="surface-panel">
          <StateBlock
            kind="error"
            title="Dashboard unavailable"
            description={fetchError}
          />
        </div>
      </div>
    );
  }

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

  const attention: AttentionItem[] = [];
  for (const budget of activeBudgets) {
    for (const warning of budget.warnings) {
      attention.push({
        id: `budget-${budget.id}-${warning.level}`,
        title: budget.name,
        detail: warning.message,
        href: "/budgets",
        severity: warning.level === "over_budget" ? "danger" : "warning",
      });
    }
  }
  for (const account of accounts) {
    if (!isCreditCard(account)) continue;
    for (const warning of getCreditCardWarnings(account)) {
      attention.push({
        id: `card-${account.id}-${warning.level}`,
        title: account.name,
        detail: warning.message,
        href: "/credit-cards",
        severity: warning.level === "over_limit" ? "danger" : "warning",
      });
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={meta.title}
        subtitle={meta.subtitle}
        className="mb-0 hidden lg:flex"
        actions={
          <Button
            size="sm"
            variant="outline"
            render={<Link href="/transactions" />}
          >
            <ArrowLeftRight className="mr-1.5 h-4 w-4" />
            Open activity
          </Button>
        }
      />

      <PositionHero summary={summary} attentionCount={attention.length} />

      <AttentionPanel items={attention} />

      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-8">
          <ActiveBudgetsSection budgets={activeBudgets} />
          <Section
            title="Spending by category"
            description="Where this month’s expenses went"
            bare
          >
            <ExpenseCategoryChart
              initialData={
                categoryExpensesRes.success ? categoryExpensesRes.data : []
              }
              initialStart={start}
              initialEnd={end}
            />
          </Section>
        </div>

        <div className="space-y-8">
          <AccountBalances accounts={accounts} />
          <CreditCardSummary accounts={accounts} />
          <RecentActivity items={monthlyActivity} loans={loans} />
          {loansRes.success && (
            <LoanSummaryCard summary={summarizeLoans(loansRes.data)} />
          )}
        </div>
      </div>
    </div>
  );
}
