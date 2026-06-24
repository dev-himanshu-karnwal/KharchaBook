"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteTransaction, updateTransaction } from "@/actions/transactions";
import { deleteLoan, deleteRepayment } from "@/actions/loans";
import { TransactionEditForm } from "./transaction-edit-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type {
  Account,
  Category,
  PersonalLoan,
  Transaction,
  UpdateTransactionInput,
} from "@/lib/types";
import {
  DEFAULT_ACTIVITY_FILTERS,
  activityAmountColor,
  activityAmountPrefix,
  activityTypeLabel,
  buildActivityFeed,
  filterActivity,
  getSignedAmount,
  groupActivityByDate,
  hasActiveActivityFilters,
  sortActivity,
  type ActivityFilters,
  type ActivityItem,
} from "@/lib/activity-feed";
import { TransactionToolbar } from "./transaction-toolbar";

function ActivityRow({
  item,
  signedAmount,
  onEdit,
  onDelete,
}: {
  item: ActivityItem;
  signedAmount: number;
  onEdit: (txn: Transaction) => void;
  onDelete: (item: ActivityItem) => void;
}) {
  const isLoan =
    item.displayType === "loan_lent" ||
    item.displayType === "loan_borrowed" ||
    item.displayType === "loan_repayment";

  return (
    <div className="group hover:border-border hover:bg-muted/30 flex items-center justify-between rounded-lg border border-transparent px-3 py-2.5 transition-colors">
      <div className="flex items-center gap-3">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: item.color }}
        />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">{item.title}</p>
            {isLoan && (
              <Badge variant="outline" className="text-[10px] text-violet-400">
                {activityTypeLabel(item)}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-xs">{item.subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "text-sm font-semibold tabular-nums",
            activityAmountColor(item)
          )}
        >
          {activityAmountPrefix(item, signedAmount)}
          {formatCurrency(Math.abs(signedAmount))}
        </span>
        {item.kind === "transaction" && item.transaction && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={() => onEdit(item.transaction!)}
          >
            <Pencil className="text-muted-foreground h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={() => onDelete(item)}
        >
          <Trash2 className="text-muted-foreground h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function filtersFromSearchParams(params: URLSearchParams): ActivityFilters {
  const uncategorized = params.get("uncategorized");
  const categoryId =
    params.get("categoryId") ??
    (uncategorized ? `uncategorized-${uncategorized}` : "");

  const typeParam = params.get("type");
  const validTypes = [
    "income",
    "expense",
    "transfer",
    "loan",
    "loan_lent",
    "loan_borrowed",
    "loan_repayment",
  ] as const;
  const type =
    typeParam && validTypes.includes(typeParam as (typeof validTypes)[number])
      ? (typeParam as ActivityFilters["type"])
      : "all";

  return {
    ...DEFAULT_ACTIVITY_FILTERS,
    categoryId,
    type,
    dateFrom: params.get("dateFrom") ?? "",
    dateTo: params.get("dateTo") ?? "",
  };
}

export function TransactionList({
  transactions,
  loans,
  accounts,
  categories,
}: {
  transactions: Transaction[];
  loans: PersonalLoan[];
  accounts: Account[];
  categories: Category[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<ActivityFilters>(() =>
    filtersFromSearchParams(searchParams)
  );
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(false);

  const allItems = useMemo(
    () => buildActivityFeed(transactions, loans),
    [transactions, loans]
  );

  const filtered = useMemo(() => {
    const matched = filterActivity(allItems, filters);
    return sortActivity(matched, filters.sortField, filters.sortDir, loans);
  }, [allItems, filters, loans]);

  const grouped = useMemo(
    () =>
      filters.sortField === "date"
        ? groupActivityByDate(filtered, filters.sortDir)
        : null,
    [filtered, filters.sortField, filters.sortDir]
  );

  async function handleUpdate(data: UpdateTransactionInput) {
    if (!editingTxn) return;
    setLoading(true);
    const result = await updateTransaction(editingTxn.id, data);
    setLoading(false);

    if (result.success) {
      toast.success("Transaction updated");
      setEditingTxn(null);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function handleDelete(item: ActivityItem) {
    let result;
    if (item.kind === "transaction" && item.transaction) {
      result = await deleteTransaction(item.transaction.id);
    } else if (item.kind === "loan" && item.loanId) {
      result = await deleteLoan(item.loanId);
    } else if (item.kind === "repayment") {
      const repaymentId = item.id.replace("repayment-", "");
      result = await deleteRepayment(repaymentId);
    } else {
      return;
    }

    if (result.success) {
      toast.success("Deleted");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  const emptyAll = allItems.length === 0;
  const emptyFiltered = !emptyAll && filtered.length === 0;

  return (
    <div className="space-y-4">
      <Dialog
        open={!!editingTxn}
        onOpenChange={(open) => !open && setEditingTxn(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          {editingTxn && (
            <TransactionEditForm
              transaction={editingTxn}
              categories={categories}
              onSubmit={handleUpdate}
              onCancel={() => setEditingTxn(null)}
              loading={loading}
            />
          )}
        </DialogContent>
      </Dialog>

      {!emptyAll && (
        <TransactionToolbar
          filters={filters}
          onChange={setFilters}
          accounts={accounts}
          categories={categories}
          totalCount={allItems.length}
          filteredCount={filtered.length}
        />
      )}

      {emptyAll && (
        <p className="text-muted-foreground py-16 text-center text-sm">
          No activity yet. Add a transaction or record a loan to get started.
        </p>
      )}

      {emptyFiltered && (
        <div className="py-16 text-center">
          <p className="text-muted-foreground text-sm">
            No items match your filters.
          </p>
          {hasActiveActivityFilters(filters) && (
            <Button
              variant="link"
              size="sm"
              className="mt-2"
              onClick={() => setFilters(DEFAULT_ACTIVITY_FILTERS)}
            >
              Clear filters
            </Button>
          )}
        </div>
      )}

      {grouped &&
        grouped.map(([date, items]) => (
          <div key={date}>
            <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
              {formatDate(date)}
            </h3>
            <div className="space-y-1">
              {items.map((item) => (
                <ActivityRow
                  key={item.id}
                  item={item}
                  signedAmount={getSignedAmount(item, loans)}
                  onEdit={setEditingTxn}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        ))}

      {!grouped && filtered.length > 0 && (
        <div className="space-y-1">
          {filtered.map((item) => (
            <ActivityRow
              key={item.id}
              item={item}
              signedAmount={getSignedAmount(item, loans)}
              onEdit={setEditingTxn}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
