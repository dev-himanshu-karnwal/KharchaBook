"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { getCategoryTransactions } from "@/actions/categories";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { groupByDate } from "@/lib/transaction-filters";
import type { CategoryType, Transaction } from "@/lib/types";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

function TransactionItem({ txn }: { txn: Transaction }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-transparent px-3 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {txn.description || txn.category?.name || txn.type}
        </p>
        <p className="text-muted-foreground truncate text-xs">
          {txn.account?.name}
          {txn.description && txn.category && (
            <> &middot; {txn.category.name}</>
          )}
        </p>
      </div>
      <span
        className={cn(
          "shrink-0 text-sm font-semibold tabular-nums",
          txn.type === "income" ? "text-emerald-400" : "text-red-400"
        )}
      >
        {txn.type === "income" ? "+" : "-"}
        {formatCurrency(txn.amount)}
      </span>
    </div>
  );
}

export function CategoryTransactionsSheet({
  open,
  onOpenChange,
  categoryId,
  categoryName,
  categoryColor,
  categoryType,
  start,
  end,
  typeFilter,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string | null;
  categoryName: string;
  categoryColor: string;
  categoryType: CategoryType;
  start: string;
  end: string;
  typeFilter: CategoryType | "all";
}) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open || !categoryId || !start || !end || start > end) {
      return;
    }

    startTransition(async () => {
      const result = await getCategoryTransactions(
        categoryId,
        start,
        end,
        typeFilter
      );
      if (result.success) {
        setTransactions(result.data);
      } else {
        setTransactions([]);
      }
    });
  }, [open, categoryId, start, end, typeFilter]);

  const grouped = useMemo(
    () => groupByDate(transactions, "desc"),
    [transactions]
  );
  const total = transactions.reduce((sum, txn) => sum + Number(txn.amount), 0);

  const transactionsUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (categoryId && !categoryId.startsWith("uncategorized-")) {
      params.set("categoryId", categoryId);
    }
    if (typeFilter !== "all") {
      params.set("type", typeFilter);
    } else {
      params.set("type", categoryType);
    }
    if (start) params.set("dateFrom", start);
    if (end) params.set("dateTo", end);
    if (categoryId?.startsWith("uncategorized-")) {
      params.set("uncategorized", categoryType);
    }
    return `/transactions?${params.toString()}`;
  }, [categoryId, categoryType, typeFilter, start, end]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
        <SheetHeader className="border-border shrink-0 border-b px-4 py-4 pr-12">
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: categoryColor }}
            />
            <SheetTitle className="truncate">{categoryName}</SheetTitle>
            <Badge
              variant="secondary"
              className={cn(
                "shrink-0 text-[10px] capitalize",
                categoryType === "income" ? "text-emerald-600" : "text-red-600"
              )}
            >
              {categoryType}
            </Badge>
          </div>
          <SheetDescription>
            {formatDate(start)} – {formatDate(end)}
            {typeFilter !== "all" && <> &middot; {typeFilter} only</>}
          </SheetDescription>
          {!isPending && transactions.length > 0 && (
            <p className="text-sm font-semibold tabular-nums">
              {transactions.length} transaction
              {transactions.length === 1 ? "" : "s"} &middot;{" "}
              {formatCurrency(total)}
            </p>
          )}
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
          {isPending ? (
            <div className="space-y-3 px-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-muted-foreground px-4 py-12 text-center text-sm">
              No transactions for this category in the selected period.
            </p>
          ) : (
            <div className="space-y-4 px-2">
              {grouped.map(([date, txns]) => (
                <div key={date}>
                  <h3 className="text-muted-foreground mb-2 px-1 text-xs font-semibold tracking-wider uppercase">
                    {formatDate(date)}
                  </h3>
                  <div className="space-y-1">
                    {txns.map((txn) => (
                      <TransactionItem key={txn.id} txn={txn} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-border shrink-0 border-t p-4">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            render={<Link href={transactionsUrl} />}
          >
            View in Transactions
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
