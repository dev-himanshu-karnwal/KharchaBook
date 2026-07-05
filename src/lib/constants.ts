import type { AccountType } from "./types";

export const ASSET_ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: "bank", label: "Bank Account" },
  { value: "cash", label: "Cash" },
  { value: "wallet", label: "Wallet" },
];

/** @deprecated Use ASSET_ACCOUNT_TYPES for asset account forms */
export const ACCOUNT_TYPES = ASSET_ACCOUNT_TYPES;

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
