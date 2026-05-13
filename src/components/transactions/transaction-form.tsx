"use client";

import { useState } from "react";
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
import { cn, toISODate } from "@/lib/utils";
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

export function TransactionForm({
  accounts,
  categories,
  onSubmit,
  onCancel,
  loading,
}: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState("");
  const [transferToAccountId, setTransferToAccountId] = useState("");
  const [date, setDate] = useState(toISODate());
  const [description, setDescription] = useState("");

  const filteredCategories = categories.filter(
    (c) => c.type === (type === "transfer" ? "expense" : type),
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type toggle */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {(["expense", "income", "transfer"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors",
              type === t
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Amount */}
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

      {/* Account */}
      <div className="space-y-2">
        <Label>{type === "transfer" ? "From Account" : "Account"}</Label>
        <Select value={accountId} onValueChange={(v) => v && setAccountId(v)} required>
          <SelectTrigger>
            <SelectValue placeholder="Select account" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Transfer to account */}
      {type === "transfer" && (
        <div className="space-y-2">
          <Label>To Account</Label>
          <Select value={transferToAccountId} onValueChange={(v) => v && setTransferToAccountId(v)} required>
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
        </div>
      )}

      {/* Category (not for transfers) */}
      {type !== "transfer" && (
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
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

      {/* Date */}
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

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Input
          id="description"
          placeholder="What was this for?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={loading || !accountId}>
          {loading ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}
