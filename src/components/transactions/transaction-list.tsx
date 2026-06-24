"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteTransaction, updateTransaction } from "@/actions/transactions";
import { deleteLoan, deleteRepayment } from "@/actions/loans";
import { TransactionEditForm } from "./transaction-edit-form";
import { ActivityRow } from "@/components/shared/activity-row";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, FilterX } from "lucide-react";
import type {
  Account,
  Category,
  PersonalLoan,
  Transaction,
  UpdateTransactionInput,
} from "@/lib/types";
import {
  DEFAULT_ACTIVITY_FILTERS,
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

function deleteDescription(item: ActivityItem): string {
  if (item.kind === "transaction") {
    return "This transaction will be permanently removed and account balances will be updated.";
  }
  if (item.kind === "loan") {
    return "This loan and all its repayments will be permanently removed.";
  }
  return "This repayment will be permanently removed and the loan balance will be updated.";
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
  const [deletingItem, setDeletingItem] = useState<ActivityItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  async function handleConfirmDelete() {
    if (!deletingItem) return;
    setDeleting(true);

    let result;
    if (deletingItem.kind === "transaction" && deletingItem.transaction) {
      result = await deleteTransaction(deletingItem.transaction.id);
    } else if (deletingItem.kind === "loan" && deletingItem.loanId) {
      result = await deleteLoan(deletingItem.loanId);
    } else if (deletingItem.kind === "repayment") {
      const repaymentId = deletingItem.id.replace("repayment-", "");
      result = await deleteRepayment(repaymentId);
    } else {
      setDeleting(false);
      return;
    }

    setDeleting(false);

    if (result.success) {
      toast.success("Deleted");
      setDeletingItem(null);
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

      <ConfirmDialog
        open={!!deletingItem}
        onOpenChange={(open) => !open && setDeletingItem(null)}
        title="Are you sure?"
        description={deletingItem ? deleteDescription(deletingItem) : ""}
        onConfirm={handleConfirmDelete}
        loading={deleting}
      />

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
        <EmptyState
          icon={ArrowLeftRight}
          title="No activity yet"
          description="Add a transaction or record a loan to start tracking your finances."
        />
      )}

      {emptyFiltered && (
        <EmptyState
          icon={FilterX}
          title="No matching items"
          description="Try adjusting your filters to find what you're looking for."
          action={
            hasActiveActivityFilters(filters) ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters(DEFAULT_ACTIVITY_FILTERS)}
              >
                Clear filters
              </Button>
            ) : undefined
          }
        />
      )}

      {grouped &&
        grouped.map(([date, items]) => (
          <div key={date}>
            <h3 className="text-muted-foreground mb-2 px-1 text-xs font-semibold tracking-wider uppercase">
              {formatDate(date)}
            </h3>
            <div className="space-y-0.5">
              {items.map((item) => (
                <ActivityRow
                  key={item.id}
                  item={item}
                  signedAmount={getSignedAmount(item, loans)}
                  onEdit={setEditingTxn}
                  onDelete={setDeletingItem}
                />
              ))}
            </div>
          </div>
        ))}

      {!grouped && filtered.length > 0 && (
        <div className="space-y-0.5">
          {filtered.map((item) => (
            <ActivityRow
              key={item.id}
              item={item}
              signedAmount={getSignedAmount(item, loans)}
              onEdit={setEditingTxn}
              onDelete={setDeletingItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}
