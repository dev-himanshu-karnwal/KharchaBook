"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ACCOUNT_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { CreateCreditCardInput } from "@/lib/types";

interface CreditCardFormProps {
  onSubmit: (data: CreateCreditCardInput) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function CreditCardForm({
  onSubmit,
  onCancel,
  loading,
}: CreditCardFormProps) {
  const [name, setName] = useState("");
  const [outstanding, setOutstanding] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [paymentDueDay, setPaymentDueDay] = useState("");
  const [statementDay, setStatementDay] = useState("");
  const [cardLast4, setCardLast4] = useState("");
  const [color, setColor] = useState(ACCOUNT_COLORS[0]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    await onSubmit({
      name: name.trim(),
      balance: parseFloat(outstanding) || 0,
      color,
      credit_limit: creditLimit ? parseFloat(creditLimit) : null,
      payment_due_day: paymentDueDay ? parseInt(paymentDueDay, 10) : null,
      statement_day: statementDay ? parseInt(statementDay, 10) : null,
      card_last4: cardLast4.trim() || null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="cardName">Card Name</Label>
        <Input
          id="cardName"
          placeholder="e.g. HDFC Millennia"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="creditLimit">Credit Limit</Label>
          <Input
            id="creditLimit"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="Optional"
            value={creditLimit}
            onChange={(e) => setCreditLimit(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="outstanding">Current Outstanding</Label>
          <Input
            id="outstanding"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={outstanding}
            onChange={(e) => setOutstanding(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="paymentDueDay">Payment Due Day</Label>
          <Input
            id="paymentDueDay"
            type="number"
            min="1"
            max="31"
            placeholder="1-31"
            value={paymentDueDay}
            onChange={(e) => setPaymentDueDay(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="statementDay">Statement Day</Label>
          <Input
            id="statementDay"
            type="number"
            min="1"
            max="31"
            placeholder="1-31"
            value={statementDay}
            onChange={(e) => setStatementDay(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cardLast4">Last 4 Digits</Label>
          <Input
            id="cardLast4"
            inputMode="numeric"
            maxLength={4}
            placeholder="1234"
            value={cardLast4}
            onChange={(e) =>
              setCardLast4(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
          />
        </div>
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
                color === c ? "ring-offset-background ring-2 ring-offset-2" : ""
              )}
              style={{ backgroundColor: c, ["--tw-ring-color" as string]: c }}
            />
          ))}
        </div>
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
          disabled={loading || !name.trim()}
        >
          {loading ? "Saving..." : "Add Credit Card"}
        </Button>
      </div>
    </form>
  );
}
