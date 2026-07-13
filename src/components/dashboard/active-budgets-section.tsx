import Link from "next/link";
import { ArrowRight, PiggyBank } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getBudgetProgressColor } from "@/lib/expense-budget";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { BudgetWithStatus } from "@/lib/types";

function BudgetProgressCard({ budget }: { budget: BudgetWithStatus }) {
  const progress = Math.min(budget.utilizationPercent, 100);
  const progressColor = getBudgetProgressColor(budget.utilizationPercent);

  return (
    <Card className="hover:ring-foreground/20 min-w-[260px] flex-1 shrink-0 transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{budget.name}</p>
            <p className="text-muted-foreground text-xs">
              {formatDate(budget.start_date)} – {formatDate(budget.end_date)}
            </p>
          </div>
          <Badge variant="outline" className="text-[10px] capitalize">
            {budget.period_type}
          </Badge>
        </div>

        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Spent</span>
            <span className="font-semibold tabular-nums">
              {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
            </span>
          </div>

          <div className="bg-muted h-2 overflow-hidden rounded-full">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                backgroundColor: progressColor,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {budget.remaining >= 0 ? "Remaining" : "Over by"}
            </span>
            <span
              className={cn(
                "font-medium tabular-nums",
                budget.remaining < 0 && "text-red-400"
              )}
            >
              {formatCurrency(Math.abs(budget.remaining))}
            </span>
          </div>
        </div>

        {budget.warnings.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {budget.warnings.map((warning) => (
              <Badge
                key={warning.level}
                variant={
                  warning.level === "over_budget" ? "destructive" : "secondary"
                }
                className="text-[10px]"
              >
                {warning.message}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ActiveBudgetsSection({
  budgets,
}: {
  budgets: BudgetWithStatus[];
}) {
  if (budgets.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400/10">
              <PiggyBank className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium">Spending limits</p>
              <p className="text-muted-foreground text-xs">
                Set a budget to track and control your expenses
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" render={<Link href="/budgets" />}>
            Set a limit
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Active Budgets</h2>
        <Button
          variant="link"
          size="sm"
          className="text-muted-foreground h-auto px-0 text-xs"
          render={<Link href="/budgets" />}
        >
          Manage budgets
          <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {budgets.map((budget) => (
          <BudgetProgressCard key={budget.id} budget={budget} />
        ))}
      </div>
    </div>
  );
}
