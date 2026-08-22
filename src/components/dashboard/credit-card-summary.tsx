import Link from "next/link";
import { sumCreditCardOutstanding } from "@/lib/account-balance";
import {
  computeCreditCardMetrics,
  getCreditCardWarnings,
} from "@/lib/credit-card";
import { MoneyAmount } from "@/components/v2/money-amount";
import { Section } from "@/components/v2/section";
import { StatusPill } from "@/components/v2/status-pill";
import type { Account } from "@/lib/types";

export function CreditCardSummary({ accounts }: { accounts: Account[] }) {
  const activeCards = accounts.filter(
    (account) => account.type === "credit_card" && account.is_active
  );
  const totalOutstanding = sumCreditCardOutstanding(accounts);

  if (activeCards.length === 0) {
    return null;
  }

  return (
    <Section
      title="Credit cards"
      description="Outstanding liability on active cards"
      href="/credit-cards"
      hrefLabel="View all"
    >
      <div className="mb-4">
        <p className="text-muted-foreground text-xs font-medium">
          Total outstanding
        </p>
        <MoneyAmount
          amount={totalOutstanding}
          size="lg"
          tone="expense"
          className="mt-1"
        />
      </div>
      <ul className="space-y-3">
        {activeCards.map((card) => {
          const metrics = computeCreditCardMetrics(card);
          const warnings = getCreditCardWarnings(card);
          return (
            <li
              key={card.id}
              className="bg-muted/40 flex items-start justify-between gap-3 rounded-xl px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{card.name}</p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {metrics?.utilizationPercent != null
                    ? `${metrics.utilizationPercent.toFixed(0)}% utilized`
                    : "No credit limit set"}
                </p>
                {warnings.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {warnings.map((w) => (
                      <StatusPill
                        key={w.level}
                        tone={w.level === "over_limit" ? "danger" : "warning"}
                      >
                        {w.message}
                      </StatusPill>
                    ))}
                  </div>
                )}
              </div>
              <MoneyAmount
                amount={metrics?.outstanding ?? Number(card.balance)}
                size="sm"
                tone="expense"
              />
            </li>
          );
        })}
      </ul>
      <p className="text-muted-foreground mt-3 text-[11px]">
        <Link
          href="/credit-cards"
          className="hover:text-foreground underline-offset-2 hover:underline"
        >
          Manage cards
        </Link>
      </p>
    </Section>
  );
}
