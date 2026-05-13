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
import { ACCOUNT_TYPES, ACCOUNT_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { AccountType, CreateAccountInput } from "@/lib/types";

interface AccountFormProps {
  onSubmit: (data: CreateAccountInput) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function AccountForm({ onSubmit, onCancel, loading }: AccountFormProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("bank");
  const [balance, setBalance] = useState("");
  const [color, setColor] = useState(ACCOUNT_COLORS[0]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedBalance = parseFloat(balance) || 0;

    await onSubmit({
      name: name.trim(),
      type,
      balance: parsedBalance,
      color,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="accountName">Account Name</Label>
        <Input
          id="accountName"
          placeholder="e.g. HDFC Savings"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label>Type</Label>
        <Select value={type} onValueChange={(v) => v && setType(v as AccountType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACCOUNT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="balance">Opening Balance</Label>
        <Input
          id="balance"
          type="number"
          step="0.01"
          placeholder="0.00"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2">
          {ACCOUNT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={cn(
                "h-6 w-6 rounded-full transition-all",
                color === c ? "ring-2 ring-offset-2 ring-offset-background" : "",
              )}
              style={{ backgroundColor: c, ["--tw-ring-color" as string]: c }}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={loading || !name.trim()}>
          {loading ? "Saving..." : "Add Account"}
        </Button>
      </div>
    </form>
  );
}
