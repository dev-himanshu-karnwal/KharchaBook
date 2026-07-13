import { getBudgets } from "@/actions/budgets";
import { BudgetsClient } from "@/components/budgets/budgets-client";

export default async function BudgetsPage() {
  const result = await getBudgets();
  const budgets = result.success ? result.data : [];

  return <BudgetsClient initialBudgets={budgets} />;
}
