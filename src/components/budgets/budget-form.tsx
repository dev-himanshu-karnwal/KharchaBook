"use client";

import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
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
import {
  generateMonthlyBudgetName,
  getMonthDateRange,
} from "@/lib/expense-budget";
import { cn, formatDate, toISODate } from "@/lib/utils";
import type {
  BudgetPeriodType,
  BudgetWithStatus,
  CreateBudgetInput,
  UpdateBudgetInput,
} from "@/lib/types";

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

function getYearOptions() {
  const currentYear = Number(toISODate().slice(0, 4));
  const years: number[] = [];
  for (let y = currentYear - 2; y <= currentYear + 2; y++) {
    years.push(y);
  }
  return years;
}

interface BudgetFormProps {
  budget?: BudgetWithStatus;
  onSubmit: (data: CreateBudgetInput | UpdateBudgetInput) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function BudgetForm({
  budget,
  onSubmit,
  onCancel,
  loading,
}: BudgetFormProps) {
  const isEdit = !!budget;
  const today = toISODate();

  const [periodType, setPeriodType] = useState<BudgetPeriodType>(
    budget?.period_type ?? "monthly"
  );
  const [amount, setAmount] = useState(budget ? String(budget.amount) : "");
  const [month, setMonth] = useState(
    budget?.period_type === "monthly"
      ? Number(budget.start_date.slice(5, 7))
      : Number(today.slice(5, 7))
  );
  const [year, setYear] = useState(
    budget?.period_type === "monthly"
      ? Number(budget.start_date.slice(0, 4))
      : Number(today.slice(0, 4))
  );
  const [name, setName] = useState(budget?.name ?? "");
  const [startDate, setStartDate] = useState(
    budget?.period_type === "custom" ? budget.start_date : today
  );
  const [endDate, setEndDate] = useState(
    budget?.period_type === "custom" ? budget.end_date : today
  );

  const monthlyRange = useMemo(
    () => getMonthDateRange(year, month),
    [year, month]
  );

  const autoMonthlyName = useMemo(
    () => generateMonthlyBudgetName(year, month),
    [year, month]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    if (isEdit) {
      const updateData: UpdateBudgetInput = { amount: parsedAmount };

      if (periodType === "monthly") {
        updateData.month = month;
        updateData.year = year;
        updateData.name = name.trim() || autoMonthlyName;
      } else {
        updateData.name = name.trim();
        updateData.start_date = startDate;
        updateData.end_date = endDate;
      }

      await onSubmit(updateData);
      return;
    }

    const createData: CreateBudgetInput = {
      period_type: periodType,
      amount: parsedAmount,
    };

    if (periodType === "monthly") {
      createData.month = month;
      createData.year = year;
      createData.name = name.trim() || autoMonthlyName;
    } else {
      createData.name = name.trim();
      createData.start_date = startDate;
      createData.end_date = endDate;
    }

    await onSubmit(createData);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isEdit && (
        <div className="bg-muted flex gap-1 rounded-lg p-1">
          {(["monthly", "custom"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setPeriodType(type)}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                periodType === type
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {type === "monthly" ? "Monthly" : "Custom"}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="budgetAmount">Budget Limit</Label>
        <Input
          id="budgetAmount"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          autoFocus
        />
      </div>

      {periodType === "monthly" ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Month</Label>
              <Select
                value={String(month)}
                onValueChange={(v) => v && setMonth(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={String(m.value)}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <Select
                value={String(year)}
                onValueChange={(v) => v && setYear(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getYearOptions().map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="budgetName">Name</Label>
            <Input
              id="budgetName"
              value={
                periodType === "monthly" && !isEdit && !name.trim()
                  ? autoMonthlyName
                  : name
              }
              onChange={(e) => setName(e.target.value)}
              placeholder={autoMonthlyName}
            />
          </div>

          <div className="bg-muted/50 rounded-lg px-3 py-2 text-sm">
            <p className="text-muted-foreground">
              Period: {formatDate(monthlyRange.start)} –{" "}
              {formatDate(monthlyRange.end)}
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="customName">Name</Label>
            <Input
              id="customName"
              placeholder="e.g. Goa Trip"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
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
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>
        </>
      )}

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
            loading || !amount || (periodType === "custom" && !name.trim())
          }
        >
          {loading && <Loader2 className="animate-spin" aria-hidden />}
          {loading ? "Saving…" : isEdit ? "Update Budget" : "Create Budget"}
        </Button>
      </div>
    </form>
  );
}
