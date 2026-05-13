import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/lib/types";
import Link from "next/link";

export function RecentTransactions({
  transactions,
}: {
  transactions: Transaction[];
}) {
  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-muted-foreground">
            No transactions yet. Add your first one!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Recent Transactions</CardTitle>
        <Link
          href="/transactions"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent className="space-y-1">
        {transactions.map((txn) => (
          <div
            key={txn.id}
            className="flex items-center justify-between rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{
                  backgroundColor: txn.category?.color ?? "#888",
                }}
              />
              <div>
                <p className="text-sm font-medium">
                  {txn.description || txn.category?.name || txn.type}
                </p>
                <p className="text-xs text-muted-foreground">
                  {txn.account?.name} &middot; {formatDateShort(txn.date)}
                </p>
              </div>
            </div>
            <span
              className={cn(
                "text-sm font-semibold tabular-nums",
                txn.type === "income"
                  ? "text-emerald-400"
                  : txn.type === "expense"
                    ? "text-red-400"
                    : "text-blue-400",
              )}
            >
              {txn.type === "income" ? "+" : txn.type === "expense" ? "-" : ""}
              {formatCurrency(txn.amount)}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
