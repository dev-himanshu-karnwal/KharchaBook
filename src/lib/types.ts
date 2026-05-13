export type AccountType = "bank" | "cash" | "wallet" | "credit_card";
export type TransactionType = "income" | "expense" | "transfer";
export type CategoryType = "income" | "expense";
export type Frequency = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
export type RecurringTag =
  | "emi"
  | "sip"
  | "subscription"
  | "salary"
  | "rent"
  | "insurance"
  | "other";

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  icon: string | null;
  color: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  type: CategoryType;
  icon: string | null;
  color: string | null;
  is_system: boolean;
  sort_order: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string | null;
  type: TransactionType;
  amount: number;
  description: string | null;
  date: string;
  transfer_to_account_id: string | null;
  recurring_id: string | null;
  created_at: string;
  updated_at: string;
  account?: Account;
  category?: Category;
  transfer_to_account?: Account;
}

export interface RecurringTransaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string | null;
  type: TransactionType;
  name: string;
  amount: number;
  frequency: Frequency;
  start_date: string;
  end_date: string | null;
  next_due_date: string;
  is_active: boolean;
  tag: RecurringTag | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  account?: Account;
  category?: Category;
}

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface MonthlySummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  netSavings: number;
}

export interface CreateTransactionInput {
  account_id: string;
  category_id: string | null;
  type: TransactionType;
  amount: number;
  description: string | null;
  date: string;
  transfer_to_account_id: string | null;
}

export interface CreateAccountInput {
  name: string;
  type: AccountType;
  balance: number;
  color: string | null;
}

export interface CreateRecurringInput {
  account_id: string;
  category_id: string | null;
  type: TransactionType;
  name: string;
  amount: number;
  frequency: Frequency;
  start_date: string;
  end_date: string | null;
  tag: RecurringTag | null;
  notes: string | null;
}
