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
import { formatCurrency } from "@/lib/utils";
import type {
  Category,
  Transaction,
  UpdateTransactionInput,
} from "@/lib/types";

interface TransactionEditFormProps {
  transaction: Transaction;
  categories: Category[];
  onSubmit: (data: UpdateTransactionInput) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function TransactionEditForm({
  transaction,
  categories,
  onSubmit,
  onCancel,
  loading,
}: TransactionEditFormProps) {
  const [categoryId, setCategoryId] = useState(transaction.category_id ?? "");
  const [date, setDate] = useState(transaction.date);
  const [description, setDescription] = useState(transaction.description ?? "");

  const filteredCategories = categories.filter(
    (c) =>
      c.type ===
      (transaction.type === "transfer" ? "expense" : transaction.type)
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    await onSubmit({
      category_id: transaction.type === "transfer" ? null : categoryId || null,
      date,
      description: description.trim() || null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-muted space-y-1 rounded-lg px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium capitalize">
            {transaction.type}
          </span>
          <span className="text-sm font-semibold tabular-nums">
            {formatCurrency(transaction.amount)}
          </span>
        </div>
        <p className="text-muted-foreground text-xs">
          {transaction.account?.name}
          {transaction.type === "transfer" &&
            transaction.transfer_to_account && (
              <> &rarr; {transaction.transfer_to_account.name}</>
            )}
        </p>
      </div>

      {transaction.type !== "transfer" && (
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
        <Label htmlFor="edit-date">Date</Label>
        <Input
          id="edit-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-description">Description (optional)</Label>
        <Input
          id="edit-description"
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
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}
