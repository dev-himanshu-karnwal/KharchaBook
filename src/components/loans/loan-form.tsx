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
import type { Account, CreateLoanInput, LoanDirection } from "@/lib/types";

interface LoanFormProps {
  accounts: Account[];
  onSubmit: (data: CreateLoanInput) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function LoanForm({
  accounts,
  onSubmit,
  onCancel,
  loading,
}: LoanFormProps) {
  const [direction, setDirection] = useState<LoanDirection>("lent");
  const [personName, setPersonName] = useState("");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [date, setDate] = useState(toISODate());
  const [description, setDescription] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0 || !personName.trim()) return;

    await onSubmit({
      direction,
      person_name: personName.trim(),
      amount: parsedAmount,
      account_id: accountId,
      date,
      description: description.trim() || null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-muted flex gap-1 rounded-lg p-1">
        {(
          [
            { value: "lent", label: "I Lent" },
            { value: "borrowed", label: "I Borrowed" },
          ] as const
        ).map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setDirection(value)}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              direction === value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="text-muted-foreground text-xs">
        {direction === "lent"
          ? "Money you gave someone — not an expense. Track until they pay you back."
          : "Money you received — not income. Track until you pay it back."}
      </p>

      <div className="space-y-2">
        <Label htmlFor="person">Person</Label>
        <Input
          id="person"
          placeholder="Friend or family name"
          value={personName}
          onChange={(e) => setPersonName(e.target.value)}
          required
          autoFocus
        />
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
          className="text-lg"
        />
      </div>

      <div className="space-y-2">
        <Label>{direction === "lent" ? "Paid From" : "Received In"}</Label>
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
          placeholder="Reason or context"
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
          disabled={loading || !accountId || !personName.trim()}
        >
          {loading ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}
