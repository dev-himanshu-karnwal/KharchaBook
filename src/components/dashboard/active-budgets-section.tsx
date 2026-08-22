import Link from "next/link";
import { ArrowRight, PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getBudgetProgressColor } from "@/lib/expense-budget";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { BudgetWithStatus } from "@/lib/types";
import { Section } from "@/components/v2/section";
import { StatusPill } from "@/components/v2/status-pill";
import { StateBlock } from "@/components/v2/state-block";

function BudgetProgressCard({ budget }: { budget: BudgetWithStatus }) {
  const progress = Math.min(budget.utilizationPercent, 100);
  const progressColor = getBudgetProgressColor(budget.utilizationPercent);

  return (
    <div className="surface-panel min-w-[260px] flex-1 shrink-0 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{budget.name}</p>
          <p className="text-muted-foreground text-xs">
            {formatDate(budget.start_date)} – {formatDate(budget.end_date)}
          </p>
        </div>
        <StatusPill tone="neutral">{budget.period_type}</StatusPill>
      </div>

      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Spent</span>
          <span className="tabular-money text-sm font-semibold">
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
              "tabular-money font-medium",
              budget.remaining < 0 && "text-[var(--expense)]"
            )}
          >
            {formatCurrency(Math.abs(budget.remaining))}
          </span>
        </div>
      </div>

      {budget.warnings.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {budget.warnings.map((warning) => (
            <StatusPill
              key={warning.level}
              tone={warning.level === "over_budget" ? "danger" : "warning"}
            >
              {warning.message}
            </StatusPill>
          ))}
        </div>
      )}
    </div>
  );
}

export function ActiveBudgetsSection({
  budgets,
}: {
  budgets: BudgetWithStatus[];
}) {
  if (budgets.length === 0) {
    return (
      <Section
        title="Budgets"
        description="Active spending limits for this period"
        bare
      >
        <div className="surface-panel">
          <StateBlock
            kind="empty"
            icon={PiggyBank}
            title="No active budget"
            description="Set a monthly or custom limit to keep expenses intentional."
            action={
              <Button size="sm" render={<Link href="/budgets" />}>
                Set a limit
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            }
            className="py-8"
          />
        </div>
      </Section>
    );
  }

  return (
    <Section
      title="Active budgets"
      description="Live spending against your limits"
      href="/budgets"
      hrefLabel="Manage"
      bare
    >
      <div className="flex gap-3 overflow-x-auto pb-1">
        {budgets.map((budget) => (
          <BudgetProgressCard key={budget.id} budget={budget} />
        ))}
      </div>
    </Section>
  );
}
