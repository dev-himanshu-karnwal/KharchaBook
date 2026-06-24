export type AccountType = "bank" | "cash" | "wallet" | "credit_card";
export type TransactionType = "income" | "expense" | "transfer";
export type CategoryType = "income" | "expense";
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
  created_at: string;
  updated_at: string;
  account?: Account;
  category?: Category;
  transfer_to_account?: Account;
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

export interface UpdateTransactionInput {
  category_id: string | null;
  description: string | null;
  date: string;
}

export interface CreateAccountInput {
  name: string;
  type: AccountType;
  balance: number;
  color: string | null;
}

export type LoanDirection = "lent" | "borrowed";

export interface PersonalLoan {
  id: string;
  user_id: string;
  account_id: string;
  person_name: string;
  direction: LoanDirection;
  amount: number;
  date: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  account?: Account;
  repayments?: LoanRepayment[];
  repaid_amount?: number;
  outstanding_amount?: number;
}

export interface LoanRepayment {
  id: string;
  user_id: string;
  loan_id: string;
  account_id: string;
  amount: number;
  date: string;
  description: string | null;
  created_at: string;
  account?: Account;
}

export interface LoanSummary {
  owedToYou: number;
  youOwe: number;
}

export interface CreateLoanInput {
  account_id: string;
  person_name: string;
  direction: LoanDirection;
  amount: number;
  date: string;
  description: string | null;
}

export interface CreateRepaymentInput {
  loan_id: string;
  account_id: string;
  amount: number;
  date: string;
  description: string | null;
}
