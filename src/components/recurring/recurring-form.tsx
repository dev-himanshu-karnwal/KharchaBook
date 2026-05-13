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
import { FREQUENCIES, RECURRING_TAGS } from "@/lib/constants";
import { cn, toISODate } from "@/lib/utils";
import type {
  Account,
  Category,
  CreateRecurringInput,
  Frequency,
  RecurringTag,
  TransactionType,
} from "@/lib/types";

interface RecurringFormProps {
  accounts: Account[];
  categories: Category[];
  onSubmit: (data: CreateRecurringInput) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  initialData?: {
    type: TransactionType;
    name: string;
    amount: number;
    account_id: string;
    category_id: string | null;
    frequency: Frequency;
    start_date: string;
    end_date: string | null;
    tag: RecurringTag | null;
    notes: string | null;
  };
}

export function RecurringForm({
  accounts,
  categories,
  onSubmit,
  onCancel,
  loading,
  initialData,
}: RecurringFormProps) {
  const isEditing = !!initialData;
  const [type, setType] = useState<TransactionType>(initialData?.type ?? "expense");
  const [name, setName] = useState(initialData?.name ?? "");
  const [amount, setAmount] = useState(initialData ? String(initialData.amount) : "");
  const [accountId, setAccountId] = useState(initialData?.account_id ?? accounts[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState(initialData?.category_id ?? "");
  const [frequency, setFrequency] = useState<Frequency>(initialData?.frequency ?? "monthly");
  const [startDate, setStartDate] = useState(initialData?.start_date ?? toISODate());
  const [endDate, setEndDate] = useState(initialData?.end_date ?? "");
  const [tag, setTag] = useState<RecurringTag | "">(initialData?.tag ?? "");
  const [notes, setNotes] = useState(initialData?.notes ?? "");

  const filteredCategories = categories.filter((c) => c.type === type);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    await onSubmit({
      type: type as "income" | "expense",
      name: name.trim(),
      amount: parsedAmount,
      account_id: accountId,
      category_id: categoryId || null,
      frequency,
      start_date: startDate,
      end_date: endDate || null,
      tag: (tag as RecurringTag) || null,
      notes: notes.trim() || null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type toggle */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {(["expense", "income"] as const).map((t) => (
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

      <div className="space-y-2">
        <Label htmlFor="recName">Name</Label>
        <Input
          id="recName"
          placeholder="e.g. Netflix, Home Loan EMI"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="recAmount">Amount</Label>
        <Input
          id="recAmount"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Frequency</Label>
          <Select value={frequency} onValueChange={(v) => v && setFrequency(v as Frequency)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FREQUENCIES.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Tag</Label>
          <Select value={tag} onValueChange={(v) => setTag((v ?? "") as RecurringTag | "")}>
            <SelectTrigger>
              <SelectValue placeholder="Optional" />
            </SelectTrigger>
            <SelectContent>
              {RECURRING_TAGS.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Account</Label>
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

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End Date (optional)</Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="recNotes">Notes (optional)</Label>
        <Input
          id="recNotes"
          placeholder="Any additional details"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={loading || !name.trim() || !accountId}
        >
          {loading ? "Saving..." : isEditing ? "Save Changes" : "Add Recurring"}
        </Button>
      </div>
    </form>
  );
}
