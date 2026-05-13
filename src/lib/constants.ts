import type { AccountType, Frequency, RecurringTag } from "./types";

export const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: "bank", label: "Bank Account" },
  { value: "cash", label: "Cash" },
  { value: "wallet", label: "Wallet" },
  { value: "credit_card", label: "Credit Card" },
];

export const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

export const RECURRING_TAGS: { value: RecurringTag; label: string }[] = [
  { value: "emi", label: "EMI" },
  { value: "sip", label: "SIP" },
  { value: "subscription", label: "Subscription" },
  { value: "salary", label: "Salary" },
  { value: "rent", label: "Rent" },
  { value: "insurance", label: "Insurance" },
  { value: "other", label: "Other" },
];

export const ACCOUNT_COLORS = [
  "#3b82f6",
  "#ef4444",
  "#22c55e",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
  "#14b8a6",
  "#6366f1",
];

export const CURRENCY = "INR";
