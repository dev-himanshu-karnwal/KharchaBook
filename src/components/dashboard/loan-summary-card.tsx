import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { HandCoins, ArrowRight } from "lucide-react";
import type { LoanSummary } from "@/lib/types";

export function LoanSummaryCard({ summary }: { summary: LoanSummary }) {
  const hasOutstanding = summary.owedToYou > 0 || summary.youOwe > 0;

  if (!hasOutstanding) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">
          Personal Loans
        </CardTitle>
        <HandCoins className="h-4 w-4 text-violet-400" />
      </CardHeader>
      <CardContent className="space-y-2">
        {summary.owedToYou > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Owed to you</span>
            <span className="font-semibold text-emerald-400 tabular-nums">
              {formatCurrency(summary.owedToYou)}
            </span>
          </div>
        )}
        {summary.youOwe > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">You owe</span>
            <span className="font-semibold text-amber-400 tabular-nums">
              {formatCurrency(summary.youOwe)}
            </span>
          </div>
        )}
        <Link
          href="/loans"
          className="text-muted-foreground hover:text-foreground mt-1 inline-flex items-center gap-1 text-xs transition-colors"
        >
          View all loans
          <ArrowRight className="h-3 w-3" />
        </Link>
      </CardContent>
    </Card>
  );
}
