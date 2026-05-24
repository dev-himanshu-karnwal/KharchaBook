import type { Transaction, TransactionType } from "@/lib/types";

export type TransactionSortField = "date" | "amount";
export type TransactionSortDir = "asc" | "desc";

export interface TransactionFilters {
  search: string;
  type: TransactionType | "all";
  accountId: string;
  categoryId: string;
  dateFrom: string;
  dateTo: string;
  sortField: TransactionSortField;
  sortDir: TransactionSortDir;
}

export const DEFAULT_TRANSACTION_FILTERS: TransactionFilters = {
  search: "",
  type: "all",
  accountId: "",
  categoryId: "",
  dateFrom: "",
  dateTo: "",
  sortField: "date",
  sortDir: "desc",
};

export function hasActiveFilters(filters: TransactionFilters): boolean {
  return (
    filters.search.trim() !== "" ||
    filters.type !== "all" ||
    filters.accountId !== "" ||
    filters.categoryId !== "" ||
    filters.dateFrom !== "" ||
    filters.dateTo !== "" ||
    filters.sortField !== DEFAULT_TRANSACTION_FILTERS.sortField ||
    filters.sortDir !== DEFAULT_TRANSACTION_FILTERS.sortDir
  );
}

function matchesSearch(txn: Transaction, query: string): boolean {
  const haystack = [
    txn.description,
    txn.category?.name,
    txn.account?.name,
    txn.transfer_to_account?.name,
    txn.type,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

export function filterTransactions(
  transactions: Transaction[],
  filters: TransactionFilters
): Transaction[] {
  const search = filters.search.trim().toLowerCase();

  return transactions.filter((txn) => {
    if (search && !matchesSearch(txn, search)) return false;
    if (filters.type !== "all" && txn.type !== filters.type) return false;
    if (
      filters.accountId &&
      txn.account_id !== filters.accountId &&
      txn.transfer_to_account_id !== filters.accountId
    ) {
      return false;
    }
    if (filters.categoryId && txn.category_id !== filters.categoryId)
      return false;
    if (filters.dateFrom && txn.date < filters.dateFrom) return false;
    if (filters.dateTo && txn.date > filters.dateTo) return false;
    return true;
  });
}

function compareDate(a: Transaction, b: Transaction, dir: TransactionSortDir) {
  const cmp = a.date.localeCompare(b.date);
  if (cmp !== 0) return dir === "asc" ? cmp : -cmp;
  const created = a.created_at.localeCompare(b.created_at);
  return dir === "asc" ? created : -created;
}

function compareAmount(
  a: Transaction,
  b: Transaction,
  dir: TransactionSortDir
) {
  const cmp = Number(a.amount) - Number(b.amount);
  return dir === "asc" ? cmp : -cmp;
}

export function sortTransactions(
  transactions: Transaction[],
  sortField: TransactionSortField,
  sortDir: TransactionSortDir
): Transaction[] {
  const sorted = [...transactions];
  sorted.sort((a, b) => {
    if (sortField === "amount") return compareAmount(a, b, sortDir);
    return compareDate(a, b, sortDir);
  });
  return sorted;
}

export function groupByDate(
  transactions: Transaction[],
  sortDir: TransactionSortDir = "desc"
) {
  const groups: Record<string, Transaction[]> = {};
  for (const txn of transactions) {
    const key = txn.date;
    if (!groups[key]) groups[key] = [];
    groups[key].push(txn);
  }
  return Object.entries(groups).sort(([a], [b]) =>
    sortDir === "asc" ? a.localeCompare(b) : b.localeCompare(a)
  );
}
