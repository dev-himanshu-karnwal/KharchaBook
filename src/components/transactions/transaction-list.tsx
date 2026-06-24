"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteTransaction, updateTransaction } from "@/actions/transactions";
import { TransactionEditForm } from "./transaction-edit-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type {
  Account,
  Category,
  Transaction,
  UpdateTransactionInput,
} from "@/lib/types";
import {
  DEFAULT_TRANSACTION_FILTERS,
  filterTransactions,
  groupByDate,
  hasActiveFilters,
  sortTransactions,
  type TransactionFilters,
} from "@/lib/transaction-filters";
import { TransactionToolbar } from "./transaction-toolbar";

function TransactionRow({
  txn,
  onEdit,
  onDelete,
}: {
  txn: Transaction;
  onEdit: (txn: Transaction) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="group hover:border-border hover:bg-muted/30 flex items-center justify-between rounded-lg border border-transparent px-3 py-2.5 transition-colors">
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
          <p className="text-muted-foreground text-xs">
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
                : "text-blue-400"
          )}
        >
          {txn.type === "income" ? "+" : txn.type === "expense" ? "-" : ""}
          {formatCurrency(txn.amount)}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={() => onEdit(txn)}
        >
          <Pencil className="text-muted-foreground h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={() => onDelete(txn.id)}
        >
          <Trash2 className="text-muted-foreground h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function filtersFromSearchParams(params: URLSearchParams): TransactionFilters {
  const uncategorized = params.get("uncategorized");
  const categoryId =
    params.get("categoryId") ??
    (uncategorized ? `uncategorized-${uncategorized}` : "");

  const typeParam = params.get("type");
  const type =
    typeParam === "income" ||
    typeParam === "expense" ||
    typeParam === "transfer"
      ? typeParam
      : "all";

  return {
    ...DEFAULT_TRANSACTION_FILTERS,
    categoryId,
    type,
    dateFrom: params.get("dateFrom") ?? "",
    dateTo: params.get("dateTo") ?? "",
  };
}

export function TransactionList({
  transactions,
  accounts,
  categories,
}: {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<TransactionFilters>(() =>
    filtersFromSearchParams(searchParams)
  );
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    const matched = filterTransactions(transactions, filters);
    return sortTransactions(matched, filters.sortField, filters.sortDir);
  }, [transactions, filters]);

  const grouped = useMemo(
    () =>
      filters.sortField === "date"
        ? groupByDate(filtered, filters.sortDir)
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

  async function handleDelete(id: string) {
    const result = await deleteTransaction(id);
    if (result.success) {
      toast.success("Transaction deleted");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  const emptyAll = transactions.length === 0;
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
          totalCount={transactions.length}
          filteredCount={filtered.length}
        />
      )}

      {emptyAll && (
        <p className="text-muted-foreground py-16 text-center text-sm">
          No transactions found. Start by adding your first transaction.
        </p>
      )}

      {emptyFiltered && (
        <div className="py-16 text-center">
          <p className="text-muted-foreground text-sm">
            No transactions match your filters.
          </p>
          {hasActiveFilters(filters) && (
            <Button
              variant="link"
              size="sm"
              className="mt-2"
              onClick={() => setFilters(DEFAULT_TRANSACTION_FILTERS)}
            >
              Clear filters
            </Button>
          )}
        </div>
      )}

      {grouped &&
        grouped.map(([date, txns]) => (
          <div key={date}>
            <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
              {formatDate(date)}
            </h3>
            <div className="space-y-1">
              {txns.map((txn) => (
                <TransactionRow
                  key={txn.id}
                  txn={txn}
                  onEdit={setEditingTxn}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        ))}

      {!grouped && filtered.length > 0 && (
        <div className="space-y-1">
          {filtered.map((txn) => (
            <TransactionRow
              key={txn.id}
              txn={txn}
              onEdit={setEditingTxn}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
