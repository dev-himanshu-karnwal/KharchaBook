import Link from "next/link";
import { MoneyAmount } from "@/components/v2/money-amount";
import { Section } from "@/components/v2/section";
import type { LoanSummary } from "@/lib/types";

export function LoanSummaryCard({ summary }: { summary: LoanSummary }) {
  const hasOutstanding = summary.owedToYou > 0 || summary.youOwe > 0;

  if (!hasOutstanding) return null;

  return (
    <Section
      title="Personal loans"
      description="Open positions with people"
      href="/loans"
      hrefLabel="View loans"
    >
      <dl className="space-y-3">
        {summary.owedToYou > 0 && (
          <div className="flex items-center justify-between gap-3 text-sm">
            <dt className="text-muted-foreground">Owed to you</dt>
            <dd>
              <MoneyAmount amount={summary.owedToYou} size="sm" tone="income" />
            </dd>
          </div>
        )}
        {summary.youOwe > 0 && (
          <div className="flex items-center justify-between gap-3 text-sm">
            <dt className="text-muted-foreground">You owe</dt>
            <dd>
              <MoneyAmount amount={summary.youOwe} size="sm" tone="warning" />
            </dd>
          </div>
        )}
      </dl>
      <p className="text-muted-foreground mt-4 text-[11px] leading-relaxed">
        Write-offs close a position without moving cash.{" "}
        <Link
          href="/loans"
          className="hover:text-foreground underline-offset-2 hover:underline"
        >
          Review loans
        </Link>
      </p>
    </Section>
  );
}
