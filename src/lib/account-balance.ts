import type { Account, AccountNature, TransactionType } from "./types";

export interface BalanceDelta {
  accountId: string;
  delta: number;
}

type AccountRef = Pick<Account, "id" | "type" | "nature" | "balance">;

export function getAccountNature(
  account: Pick<Account, "type" | "nature">
): AccountNature {
  if (account.nature) return account.nature;
  return account.type === "credit_card" ? "liability" : "asset";
}

export function isLiabilityAccount(
  account: Pick<Account, "type" | "nature">
): boolean {
  return getAccountNature(account) === "liability";
}

export function isAssetAccount(
  account: Pick<Account, "type" | "nature">
): boolean {
  return getAccountNature(account) === "asset";
}

export function isCreditCard(account: Pick<Account, "type">): boolean {
  return account.type === "credit_card";
}

function applyAssetTransaction(
  txnType: TransactionType,
  role: "primary" | "transfer_destination",
  amount: number
): number {
  switch (txnType) {
    case "expense":
      return -amount;
    case "income":
      return amount;
    case "transfer":
      return role === "primary" ? -amount : amount;
  }
}

function applyCreditCardTransaction(
  txnType: TransactionType,
  role: "primary" | "transfer_destination",
  amount: number
): number {
  switch (txnType) {
    case "expense":
      return amount;
    case "income":
      return -amount;
    case "transfer":
      return role === "primary" ? amount : -amount;
  }
}

function applyAccountTransaction(
  account: Pick<Account, "type" | "nature">,
  txnType: TransactionType,
  role: "primary" | "transfer_destination",
  amount: number
): number {
  if (isLiabilityAccount(account)) {
    return applyCreditCardTransaction(txnType, role, amount);
  }
  return applyAssetTransaction(txnType, role, amount);
}

/**
 * Balance impact when creating/reversing a personal loan.
 * Asset: lent decreases cash, borrowed increases cash.
 * Liability (credit card): signs flip — lending on a card increases outstanding.
 */
export function loanBalanceDelta(
  account: Pick<Account, "type" | "nature">,
  direction: "lent" | "borrowed",
  amount: number,
  action: "create" | "reverse"
): number {
  const sign = action === "create" ? 1 : -1;
  const assetDelta = direction === "lent" ? -amount : amount;
  return (isLiabilityAccount(account) ? -assetDelta : assetDelta) * sign;
}

/**
 * Balance impact when recording/reversing a loan repayment.
 * Asset: collecting a lent repayment increases cash; paying a borrowed loan decreases cash.
 * Liability: signs flip relative to assets.
 */
export function repaymentBalanceDelta(
  account: Pick<Account, "type" | "nature">,
  direction: "lent" | "borrowed",
  amount: number,
  action: "create" | "reverse"
): number {
  const sign = action === "create" ? 1 : -1;
  const assetDelta = direction === "lent" ? amount : -amount;
  return (isLiabilityAccount(account) ? -assetDelta : assetDelta) * sign;
}

export function computeTransactionBalanceDeltas(
  txn: {
    type: TransactionType;
    amount: number;
    account_id: string;
    transfer_to_account_id: string | null;
  },
  accountsById: Map<string, AccountRef>
): BalanceDelta[] {
  const primary = accountsById.get(txn.account_id);
  if (!primary) {
    throw new Error("Account not found");
  }

  const deltas: BalanceDelta[] = [
    {
      accountId: txn.account_id,
      delta: applyAccountTransaction(primary, txn.type, "primary", txn.amount),
    },
  ];

  if (txn.type === "transfer" && txn.transfer_to_account_id) {
    const destination = accountsById.get(txn.transfer_to_account_id);
    if (!destination) {
      throw new Error("Transfer destination account not found");
    }

    deltas.push({
      accountId: txn.transfer_to_account_id,
      delta: applyAccountTransaction(
        destination,
        txn.type,
        "transfer_destination",
        txn.amount
      ),
    });
  }

  return deltas;
}

export function validateBalanceDelta(
  account: AccountRef,
  delta: number
): { ok: true } | { ok: false; error: string } {
  const projected = Number(account.balance) + delta;

  if (isLiabilityAccount(account) && projected < 0) {
    return {
      ok: false,
      error: "Outstanding cannot become negative",
    };
  }

  return { ok: true };
}

export function sumAssetBalances(accounts: Account[]): number {
  return accounts
    .filter((account) => account.is_active && isAssetAccount(account))
    .reduce((sum, account) => sum + Number(account.balance), 0);
}

export function sumCreditCardOutstanding(accounts: Account[]): number {
  return accounts
    .filter((account) => account.is_active && isLiabilityAccount(account))
    .reduce((sum, account) => sum + Number(account.balance), 0);
}

export function computeNetWorth(accounts: Account[]): {
  assets: number;
  creditCardOutstanding: number;
  netWorth: number;
} {
  const assets = sumAssetBalances(accounts);
  const creditCardOutstanding = sumCreditCardOutstanding(accounts);

  return {
    assets,
    creditCardOutstanding,
    netWorth: assets - creditCardOutstanding,
  };
}
