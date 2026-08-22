import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  Scale,
  Wallet,
} from "lucide-react";
import { MoneyAmount } from "@/components/v2/money-amount";
import { StatusPill } from "@/components/v2/status-pill";
import { cn, formatCurrency } from "@/lib/utils";
import type { MonthlySummary } from "@/lib/types";

export function PositionHero({
  summary,
  attentionCount,
}: {
  summary: MonthlySummary;
  attentionCount: number;
}) {
  const savingsPositive = summary.netSavings >= 0;

  return (
    <div className="fade-up surface-panel relative overflow-hidden p-5 md:p-7">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 50% 80% at 100% 0%, color-mix(in oklch, var(--primary) 12%, transparent), transparent)",
        }}
      />
      <div className="relative grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone="info">This month</StatusPill>
            {attentionCount > 0 && (
              <StatusPill tone="warning">
                {attentionCount} need{attentionCount === 1 ? "s" : ""} attention
              </StatusPill>
            )}
          </div>

          <div>
            <p className="text-muted-foreground text-sm font-medium">
              Net worth
            </p>
            <div className="mt-1 flex items-baseline gap-3">
              <MoneyAmount amount={summary.netWorth} size="xl" />
              <Scale
                className="text-muted-foreground hidden h-5 w-5 sm:block"
                aria-hidden
              />
            </div>
            <p className="text-muted-foreground mt-2 max-w-md text-sm leading-relaxed">
              Assets minus credit-card outstanding. Loan positions are tracked
              separately under Loans.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <MetricTile
              icon={Wallet}
              label="Assets"
              value={summary.assets}
              href="/accounts"
            />
            <MetricTile
              icon={CreditCard}
              label="Card outstanding"
              value={summary.creditCardOutstanding}
              href="/credit-cards"
              tone="expense"
            />
          </div>
        </div>

        <div className="border-border/70 flex flex-col justify-between gap-4 border-t pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
          <div>
            <p className="text-muted-foreground text-sm font-medium">
              Month cashflow
            </p>
            <div className="mt-2 flex items-center gap-2">
              {savingsPositive ? (
                <ArrowUpRight
                  className="h-5 w-5 text-[var(--income)]"
                  aria-hidden
                />
              ) : (
                <ArrowDownRight
                  className="h-5 w-5 text-[var(--expense)]"
                  aria-hidden
                />
              )}
              <MoneyAmount
                amount={summary.netSavings}
                size="lg"
                signed
                tone={savingsPositive ? "income" : "expense"}
              />
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Income − expenses this calendar month
            </p>
          </div>

          <dl className="space-y-3">
            <CashRow
              label="Income"
              value={summary.monthlyIncome}
              tone="income"
            />
            <CashRow
              label="Expenses"
              value={summary.monthlyExpenses}
              tone="expense"
            />
          </dl>
        </div>
      </div>
    </div>
  );
}

function MetricTile({
  icon: Icon,
  label,
  value,
  href,
  tone = "default",
}: {
  icon: typeof Wallet;
  label: string;
  value: number;
  href: string;
  tone?: "default" | "expense";
}) {
  return (
    <Link
      href={href}
      className="bg-surface-elevated/70 hover:border-primary/30 block rounded-xl border border-transparent p-3 transition-colors"
    >
      <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {label}
      </div>
      <p
        className={cn(
          "tabular-money mt-1 text-lg font-semibold",
          tone === "expense" && "text-[var(--expense)]"
        )}
      >
        {formatCurrency(value)}
      </p>
    </Link>
  );
}

function CashRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "income" | "expense";
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>
        <MoneyAmount amount={value} size="sm" tone={tone} />
      </dd>
    </div>
  );
}

export type AttentionItem = {
  id: string;
  title: string;
  detail: string;
  href: string;
  severity: "warning" | "danger";
};

export function AttentionPanel({ items }: { items: AttentionItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="fade-up fade-up-delay-1 surface-panel p-4 md:p-5">
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-[var(--warning)]" aria-hidden />
        <h2 className="font-heading text-sm font-semibold">Needs attention</h2>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="hover:bg-muted/60 flex items-start justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                  {item.detail}
                </p>
              </div>
              <StatusPill
                tone={item.severity === "danger" ? "danger" : "warning"}
              >
                {item.severity === "danger" ? "Over" : "Watch"}
              </StatusPill>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
