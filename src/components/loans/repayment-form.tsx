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
import { formatCurrency, toISODate } from "@/lib/utils";
import type { Account, CreateRepaymentInput, PersonalLoan } from "@/lib/types";

interface RepaymentFormProps {
  loan: PersonalLoan;
  accounts: Account[];
  onSubmit: (data: CreateRepaymentInput) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function RepaymentForm({
  loan,
  accounts,
  onSubmit,
  onCancel,
  loading,
}: RepaymentFormProps) {
  const outstanding = loan.outstanding_amount ?? 0;
  const [amount, setAmount] = useState(
    outstanding > 0 ? String(outstanding) : ""
  );
  const [accountId, setAccountId] = useState(loan.account_id);
  const [date, setDate] = useState(toISODate());
  const [description, setDescription] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    await onSubmit({
      loan_id: loan.id,
      account_id: accountId,
      amount: parsedAmount,
      date,
      description: description.trim() || null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-muted-foreground text-sm">
        {loan.direction === "lent"
          ? `Recording repayment from ${loan.person_name}`
          : `Recording repayment to ${loan.person_name}`}
        {" · "}
        Outstanding: {formatCurrency(outstanding)}
      </p>

      <div className="space-y-2">
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          min="0.01"
          max={outstanding}
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          autoFocus
          className="text-lg"
        />
      </div>

      <div className="space-y-2">
        <Label>{loan.direction === "lent" ? "Received In" : "Paid From"}</Label>
        <Select
          value={accountId}
          onValueChange={(v) => v && setAccountId(v)}
          required
        >
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
        <Label htmlFor="description">Note (optional)</Label>
        <Input
          id="description"
          placeholder="Installment details"
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
          disabled={loading || !accountId}
        >
          {loading ? "Saving..." : "Record Repayment"}
        </Button>
      </div>
    </form>
  );
}
