"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isCreditCard } from "@/lib/account-balance";
import { computeCreditCardMetrics } from "@/lib/credit-card";
import { cn, formatCurrency, toISODate } from "@/lib/utils";
import type {
  Account,
  Category,
  CreateTransactionInput,
  TransactionType,
} from "@/lib/types";

interface TransactionFormProps {
  accounts: Account[];
  categories: Category[];
  onSubmit: (data: CreateTransactionInput) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

type FormStep = "account" | "details";
type FormTransactionType = TransactionType;

const ASSET_TYPE_LABELS: Record<string, string> = {
  bank: "Bank",
  cash: "Cash",
  wallet: "Wallet",
};

function AccountPicker({
  accounts,
  onSelect,
}: {
  accounts: Account[];
  onSelect: (accountId: string) => void;
}) {
  const assetAccounts = accounts.filter((account) => !isCreditCard(account));
  const creditCardAccounts = accounts.filter((account) =>
    isCreditCard(account)
  );

  function renderAccountButton(account: Account) {
    const isCard = isCreditCard(account);
    const metrics = isCard ? computeCreditCardMetrics(account) : null;
    const balanceLabel = isCard
      ? `Outstanding ${formatCurrency(metrics?.outstanding ?? 0)}`
      : formatCurrency(account.balance);

    return (
      <button
        key={account.id}
        type="button"
        onClick={() => onSelect(account.id)}
        className="hover:bg-muted/50 border-border flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors"
      >
        <span
          className="h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: account.color ?? "#3b82f6" }}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{account.name}</p>
          <p className="text-muted-foreground text-xs">
            {isCard
              ? "Credit Card"
              : (ASSET_TYPE_LABELS[account.type] ?? account.type)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-sm font-medium tabular-nums">
            {balanceLabel}
          </span>
          <ChevronRight className="text-muted-foreground h-4 w-4" />
        </div>
      </button>
    );
  }

  return (
    <div className="space-y-4">
      {assetAccounts.length > 0 && (
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Asset accounts
          </p>
          <div className="space-y-2">
            {assetAccounts.map(renderAccountButton)}
          </div>
        </div>
      )}
      {creditCardAccounts.length > 0 && (
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Credit cards
          </p>
          <div className="space-y-2">
            {creditCardAccounts.map(renderAccountButton)}
          </div>
        </div>
      )}
    </div>
  );
}

export function TransactionForm({
  accounts,
  categories,
  onSubmit,
  onCancel,
  loading,
}: TransactionFormProps) {
  const [step, setStep] = useState<FormStep>("account");
  const [type, setType] = useState<FormTransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [transferToAccountId, setTransferToAccountId] = useState("");
  const [date, setDate] = useState(toISODate());
  const [description, setDescription] = useState("");

  const selectedAccount = accounts.find((account) => account.id === accountId);
  const isSelectedCreditCard = selectedAccount
    ? isCreditCard(selectedAccount)
    : false;

  const typeOptions = useMemo(() => {
    if (isSelectedCreditCard) {
      return [
        { value: "expense" as const, label: "Purchase" },
        { value: "income" as const, label: "Refund" },
        { value: "transfer" as const, label: "Transfer" },
      ];
    }

    return [
      { value: "expense" as const, label: "Expense" },
      { value: "income" as const, label: "Income" },
      { value: "transfer" as const, label: "Transfer" },
    ];
  }, [isSelectedCreditCard]);

  const filteredCategories = categories.filter(
    (c) => c.type === (type === "transfer" ? "expense" : type)
  );

  function handleSelectAccount(id: string) {
    setAccountId(id);
    setType("expense");
    setCategoryId("");
    setTransferToAccountId("");
    setAmount("");
    setDescription("");
    setDate(toISODate());
    setStep("details");
  }

  function handleBackToAccounts() {
    setStep("account");
  }

  function handleTypeChange(nextType: FormTransactionType) {
    setType(nextType);
    if (nextType === "transfer") {
      setCategoryId("");
    } else {
      setTransferToAccountId("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0 || !accountId) return;

    await onSubmit({
      type,
      amount: parsedAmount,
      account_id: accountId,
      category_id: type === "transfer" ? null : categoryId || null,
      transfer_to_account_id: type === "transfer" ? transferToAccountId : null,
      date,
      description: description.trim() || null,
    });
  }

  if (step === "account") {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Choose the account for this transaction.
        </p>
        <AccountPicker accounts={accounts} onSelect={handleSelectAccount} />
        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0"
          onClick={handleBackToAccounts}
          aria-label="Change account"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{
                backgroundColor: selectedAccount?.color ?? "#3b82f6",
              }}
            />
            <p className="truncate text-sm font-medium">
              {selectedAccount?.name}
            </p>
          </div>
          <p className="text-muted-foreground text-xs">
            {isSelectedCreditCard
              ? "Credit Card"
              : (ASSET_TYPE_LABELS[selectedAccount?.type ?? ""] ??
                selectedAccount?.type)}
          </p>
        </div>
        <Button
          type="button"
          variant="link"
          size="sm"
          className="text-muted-foreground h-auto shrink-0 px-0 text-xs"
          onClick={handleBackToAccounts}
        >
          Change
        </Button>
      </div>

      <div className="bg-muted flex gap-1 rounded-lg p-1">
        {typeOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => handleTypeChange(option.value)}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              type === option.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          autoFocus
          className="text-lg"
        />
      </div>

      {type === "transfer" && (
        <div className="space-y-2">
          <Label>To Account</Label>
          <Select
            value={transferToAccountId}
            onValueChange={(v) => v && setTransferToAccountId(v)}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select destination" />
            </SelectTrigger>
            <SelectContent>
              {accounts
                .filter((a) => a.id !== accountId)
                .map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {isSelectedCreditCard && (
            <p className="text-muted-foreground text-xs">
              Transferring from a credit card increases outstanding (cash
              advance).
            </p>
          )}
          {selectedAccount &&
            !isSelectedCreditCard &&
            accounts.find((a) => a.id === transferToAccountId) &&
            isCreditCard(
              accounts.find((a) => a.id === transferToAccountId)!
            ) && (
              <p className="text-muted-foreground text-xs">
                Paying a credit card bill reduces outstanding without creating
                an expense.
              </p>
            )}
        </div>
      )}

      {type !== "transfer" && (
        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={categoryId}
            onValueChange={(v) => setCategoryId(v ?? "")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {filteredCategories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: c.color ?? "#888" }}
                    />
                    {c.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Input
          id="description"
          placeholder="What was this for?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={
            loading ||
            !accountId ||
            (type === "transfer" && !transferToAccountId)
          }
        >
          {loading ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}
