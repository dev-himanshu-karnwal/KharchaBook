"use client";

import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteTransaction } from "@/actions/transactions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { Transaction } from "@/lib/types";

function groupByDate(transactions: Transaction[]) {
  const groups: Record<string, Transaction[]> = {};
  for (const txn of transactions) {
    const key = txn.date;
    if (!groups[key]) groups[key] = [];
    groups[key].push(txn);
  }
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
}

export function TransactionList({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const router = useRouter();

  async function handleDelete(id: string) {
    const result = await deleteTransaction(id);
    if (result.success) {
      toast.success("Transaction deleted");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  if (transactions.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        No transactions found. Start by adding your first transaction.
      </p>
    );
  }

  const grouped = groupByDate(transactions);

  return (
    <div className="space-y-6">
      {grouped.map(([date, txns]) => (
        <div key={date}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {formatDate(date)}
          </h3>
          <div className="space-y-1">
            {txns.map((txn) => (
              <div
                key={txn.id}
                className="group flex items-center justify-between rounded-lg border border-transparent px-3 py-2.5 transition-colors hover:border-border hover:bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: txn.category?.color ?? "#888",
                    }}
                  />
                  <div>
                    <p className="text-sm font-medium">
                      {txn.description || txn.category?.name || txn.type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {txn.account?.name}
                      {txn.type === "transfer" && txn.transfer_to_account && (
                        <> &rarr; {txn.transfer_to_account.name}</>
                      )}
                      {txn.category && txn.description && (
                        <> &middot; {txn.category.name}</>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => handleDelete(txn.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
