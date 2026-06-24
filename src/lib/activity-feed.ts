import type {
  Account,
  LoanDirection,
  PersonalLoan,
  Transaction,
  TransactionType,
} from "./types";

export type ActivityKind = "transaction" | "loan" | "repayment";

export type ActivityDisplayType =
  | TransactionType
  | "loan_lent"
  | "loan_borrowed"
  | "loan_repayment";

export type ActivityTypeFilter =
  | TransactionType
  | "loan_lent"
  | "loan_borrowed"
  | "loan_repayment"
  | "loan"
  | "all";

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  displayType: ActivityDisplayType;
  amount: number;
  date: string;
  created_at: string;
  title: string;
  subtitle: string;
  account_id: string;
  account?: Account;
  color: string;
  transaction?: Transaction;
  loanId?: string;
}

const LOAN_COLOR = "#8b5cf6";

function loanTitle(direction: LoanDirection, person: string): string {
  return direction === "lent" ? `Lent to ${person}` : `Borrowed from ${person}`;
}

function repaymentTitle(direction: LoanDirection, person: string): string {
  return direction === "lent"
    ? `Repayment from ${person}`
    : `Repayment to ${person}`;
}

function signedRepaymentAmount(
  direction: LoanDirection,
  amount: number
): number {
  return direction === "lent" ? amount : -amount;
}

export function buildActivityFeed(
  transactions: Transaction[],
  loans: PersonalLoan[]
): ActivityItem[] {
  const items: ActivityItem[] = [];

  for (const txn of transactions) {
    items.push({
      id: `txn-${txn.id}`,
      kind: "transaction",
      displayType: txn.type,
      amount: Number(txn.amount),
      date: txn.date,
      created_at: txn.created_at,
      title: txn.description || txn.category?.name || txn.type,
      subtitle: [
        txn.account?.name,
        txn.type === "transfer" && txn.transfer_to_account
          ? `→ ${txn.transfer_to_account.name}`
          : null,
        txn.category && txn.description ? txn.category.name : null,
      ]
        .filter(Boolean)
        .join(" · "),
      account_id: txn.account_id,
      account: txn.account,
      color: txn.category?.color ?? "#888",
      transaction: txn,
    });
  }

  for (const loan of loans) {
    items.push({
      id: `loan-${loan.id}`,
      kind: "loan",
      displayType: loan.direction === "lent" ? "loan_lent" : "loan_borrowed",
      amount: Number(loan.amount),
      date: loan.date,
      created_at: loan.created_at,
      title: loanTitle(loan.direction, loan.person_name),
      subtitle: [loan.account?.name, loan.description]
        .filter(Boolean)
        .join(" · "),
      account_id: loan.account_id,
      account: loan.account,
      color: LOAN_COLOR,
      loanId: loan.id,
    });

    for (const repayment of loan.repayments ?? []) {
      items.push({
        id: `repayment-${repayment.id}`,
        kind: "repayment",
        displayType: "loan_repayment",
        amount: Number(repayment.amount),
        date: repayment.date,
        created_at: repayment.created_at,
        title: repaymentTitle(loan.direction, loan.person_name),
        subtitle: [repayment.account?.name, repayment.description]
          .filter(Boolean)
          .join(" · "),
        account_id: repayment.account_id,
        account: repayment.account,
        color: LOAN_COLOR,
        loanId: loan.id,
      });
    }
  }

  return items;
}

export function getSignedAmount(
  item: ActivityItem,
  loans: PersonalLoan[]
): number {
  if (item.kind === "transaction") {
    if (item.displayType === "income") return item.amount;
    if (item.displayType === "expense") return -item.amount;
    return item.amount;
  }
  if (item.displayType === "loan_lent") return -item.amount;
  if (item.displayType === "loan_borrowed") return item.amount;
  const loan = loans.find((l) => l.id === item.loanId);
  if (!loan) return item.amount;
  return signedRepaymentAmount(loan.direction, item.amount);
}

export const ACTIVITY_TYPE_LABELS: Record<ActivityDisplayType, string> = {
  expense: "Expense",
  income: "Income",
  transfer: "Transfer",
  loan_lent: "Loan · Lent",
  loan_borrowed: "Loan · Borrowed",
  loan_repayment: "Loan · Repayment",
};

export function activityTypeLabel(item: ActivityItem): string {
  return ACTIVITY_TYPE_LABELS[item.displayType];
}

export function activityAmountColor(item: ActivityItem): string {
  if (
    item.displayType === "loan_lent" ||
    item.displayType === "loan_borrowed" ||
    item.displayType === "loan_repayment"
  ) {
    return "text-violet-400";
  }
  if (item.displayType === "income") return "text-emerald-400";
  if (item.displayType === "expense") return "text-red-400";
  return "text-blue-400";
}

export function activityAmountPrefix(
  item: ActivityItem,
  signedAmount: number
): string {
  if (
    item.displayType === "loan_lent" ||
    item.displayType === "loan_borrowed" ||
    item.displayType === "loan_repayment"
  ) {
    return signedAmount > 0 ? "+" : signedAmount < 0 ? "-" : "";
  }
  if (item.displayType === "income") return "+";
  if (item.displayType === "expense") return "-";
  return "";
}

export type ActivitySortField = "date" | "amount";
export type ActivitySortDir = "asc" | "desc";

export interface ActivityFilters {
  search: string;
  type: ActivityTypeFilter;
  accountId: string;
  categoryId: string;
  dateFrom: string;
  dateTo: string;
  sortField: ActivitySortField;
  sortDir: ActivitySortDir;
}

export const DEFAULT_ACTIVITY_FILTERS: ActivityFilters = {
  search: "",
  type: "all",
  accountId: "",
  categoryId: "",
  dateFrom: "",
  dateTo: "",
  sortField: "date",
  sortDir: "desc",
};

export function hasActiveActivityFilters(filters: ActivityFilters): boolean {
  return (
    filters.search.trim() !== "" ||
    filters.type !== "all" ||
    filters.accountId !== "" ||
    filters.categoryId !== "" ||
    filters.dateFrom !== "" ||
    filters.dateTo !== "" ||
    filters.sortField !== DEFAULT_ACTIVITY_FILTERS.sortField ||
    filters.sortDir !== DEFAULT_ACTIVITY_FILTERS.sortDir
  );
}

function matchesActivitySearch(item: ActivityItem, query: string): boolean {
  const haystack = [
    item.title,
    item.subtitle,
    activityTypeLabel(item),
    item.account?.name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function matchesActivityType(
  item: ActivityItem,
  type: ActivityTypeFilter
): boolean {
  if (type === "all") return true;
  if (type === "loan") {
    return (
      item.displayType === "loan_lent" ||
      item.displayType === "loan_borrowed" ||
      item.displayType === "loan_repayment"
    );
  }
  return item.displayType === type;
}

export function filterActivity(
  items: ActivityItem[],
  filters: ActivityFilters
): ActivityItem[] {
  const search = filters.search.trim().toLowerCase();

  return items.filter((item) => {
    if (search && !matchesActivitySearch(item, search)) return false;
    if (!matchesActivityType(item, filters.type)) return false;
    if (filters.accountId) {
      const matchesAccount = item.account_id === filters.accountId;
      const matchesTransfer =
        item.kind === "transaction" &&
        item.transaction?.transfer_to_account_id === filters.accountId;
      if (!matchesAccount && !matchesTransfer) return false;
    }
    if (filters.categoryId) {
      if (item.kind !== "transaction") return false;
      const txn = item.transaction!;
      if (filters.categoryId.startsWith("uncategorized-")) {
        const txnType = filters.categoryId.replace("uncategorized-", "");
        if (txn.category_id !== null || txn.type !== txnType) return false;
      } else if (txn.category_id !== filters.categoryId) {
        return false;
      }
    }
    if (filters.dateFrom && item.date < filters.dateFrom) return false;
    if (filters.dateTo && item.date > filters.dateTo) return false;
    return true;
  });
}

function compareActivityDate(
  a: ActivityItem,
  b: ActivityItem,
  dir: ActivitySortDir
) {
  const cmp = a.date.localeCompare(b.date);
  if (cmp !== 0) return dir === "asc" ? cmp : -cmp;
  const created = a.created_at.localeCompare(b.created_at);
  return dir === "asc" ? created : -created;
}

export function sortActivity(
  items: ActivityItem[],
  sortField: ActivitySortField,
  sortDir: ActivitySortDir,
  loans: PersonalLoan[] = []
): ActivityItem[] {
  const sorted = [...items];
  sorted.sort((a, b) => {
    if (sortField === "amount") {
      const cmp =
        Math.abs(getSignedAmount(a, loans)) -
        Math.abs(getSignedAmount(b, loans));
      return sortDir === "asc" ? cmp : -cmp;
    }
    return compareActivityDate(a, b, sortDir);
  });
  return sorted;
}

export function groupActivityByDate(
  items: ActivityItem[],
  sortDir: ActivitySortDir = "desc"
) {
  const groups: Record<string, ActivityItem[]> = {};
  for (const item of items) {
    const key = item.date;
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return Object.entries(groups).sort(([a], [b]) =>
    sortDir === "asc" ? a.localeCompare(b) : b.localeCompare(a)
  );
}
