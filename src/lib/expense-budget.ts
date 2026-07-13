import { formatDate, toISODate } from "./utils";
import type {
  BudgetLifecycle,
  BudgetPeriodType,
  BudgetWarning,
  BudgetWarningLevel,
  CreateBudgetInput,
  ExpenseBudget,
  BudgetWithStatus,
  UpdateBudgetInput,
} from "./types";

export function getMonthDateRange(year: number, month: number) {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

export function generateMonthlyBudgetName(year: number, month: number): string {
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

export function getBudgetLifecycle(
  startDate: string,
  endDate: string,
  today: string = toISODate()
): BudgetLifecycle {
  if (today < startDate) return "upcoming";
  if (today > endDate) return "past";
  return "active";
}

export function isDateInBudgetRange(
  date: string,
  startDate: string,
  endDate: string
): boolean {
  return date >= startDate && date <= endDate;
}

export interface BudgetMetrics {
  remaining: number;
  utilizationPercent: number;
}

export function computeBudgetMetrics(
  spent: number,
  limit: number
): BudgetMetrics {
  const remaining = limit - spent;
  const utilizationPercent = limit > 0 ? (spent / limit) * 100 : 0;
  return { remaining, utilizationPercent };
}

export function getBudgetWarnings(utilizationPercent: number): BudgetWarning[] {
  const warnings: BudgetWarning[] = [];

  if (utilizationPercent > 100) {
    warnings.push({
      level: "over_budget",
      message: "Over budget",
    });
  } else if (utilizationPercent > 80) {
    warnings.push({
      level: "approaching_limit",
      message: "Approaching limit",
    });
  }

  return warnings;
}

export function enrichBudgetWithStatus(
  budget: ExpenseBudget,
  spent: number,
  today: string = toISODate()
): BudgetWithStatus {
  const limit = Number(budget.amount);
  const { remaining, utilizationPercent } = computeBudgetMetrics(spent, limit);

  return {
    ...budget,
    amount: limit,
    spent,
    remaining,
    utilizationPercent,
    lifecycle: getBudgetLifecycle(budget.start_date, budget.end_date, today),
    warnings: getBudgetWarnings(utilizationPercent),
  };
}

export function formatBudgetPeriod(budget: ExpenseBudget): string {
  if (budget.period_type === "monthly") {
    return generateMonthlyBudgetName(
      Number(budget.start_date.slice(0, 4)),
      Number(budget.start_date.slice(5, 7))
    );
  }

  return `${formatDate(budget.start_date)} – ${formatDate(budget.end_date)}`;
}

export function getBudgetProgressColor(utilizationPercent: number): string {
  if (utilizationPercent > 100) return "#ef4444";
  if (utilizationPercent > 80) return "#f59e0b";
  return "#22c55e";
}

export function resolveCreateBudgetInput(
  input: CreateBudgetInput
):
  | {
      ok: true;
      data: {
        name: string;
        start_date: string;
        end_date: string;
        period_type: BudgetPeriodType;
        amount: number;
      };
    }
  | { ok: false; error: string } {
  if (!input.amount || input.amount <= 0) {
    return { ok: false, error: "Budget amount must be positive" };
  }

  if (input.period_type === "monthly") {
    if (!input.month || !input.year) {
      return {
        ok: false,
        error: "Month and year are required for monthly budgets",
      };
    }
    if (input.month < 1 || input.month > 12) {
      return { ok: false, error: "Invalid month" };
    }

    const { start, end } = getMonthDateRange(input.year, input.month);
    const name =
      input.name?.trim() || generateMonthlyBudgetName(input.year, input.month);

    return {
      ok: true,
      data: {
        period_type: "monthly",
        amount: input.amount,
        name,
        start_date: start,
        end_date: end,
      },
    };
  }

  const name = input.name?.trim();
  if (!name) {
    return { ok: false, error: "Name is required for custom budgets" };
  }
  if (!input.start_date || !input.end_date) {
    return { ok: false, error: "Start and end dates are required" };
  }
  if (input.end_date < input.start_date) {
    return { ok: false, error: "End date must be on or after start date" };
  }

  return {
    ok: true,
    data: {
      period_type: "custom",
      amount: input.amount,
      name,
      start_date: input.start_date,
      end_date: input.end_date,
    },
  };
}

export function validateUpdateBudgetInput(
  input: UpdateBudgetInput,
  periodType: BudgetPeriodType
): { ok: true } | { ok: false; error: string } {
  if (input.amount !== undefined && input.amount <= 0) {
    return { ok: false, error: "Budget amount must be positive" };
  }

  if (input.name !== undefined && !input.name.trim()) {
    return { ok: false, error: "Name cannot be empty" };
  }

  if (periodType === "custom") {
    if (
      input.start_date &&
      input.end_date &&
      input.end_date < input.start_date
    ) {
      return { ok: false, error: "End date must be on or after start date" };
    }
  }

  return { ok: true };
}

export function getProjectedBudgetWarnings(
  budget: BudgetWithStatus,
  additionalAmount: number
): { level: BudgetWarningLevel; message: string }[] {
  const projectedSpent = budget.spent + additionalAmount;
  const { utilizationPercent } = computeBudgetMetrics(
    projectedSpent,
    Number(budget.amount)
  );
  const warnings = getBudgetWarnings(utilizationPercent);

  return warnings.map((warning) => {
    if (warning.level === "over_budget") {
      const overBy = projectedSpent - Number(budget.amount);
      return {
        level: warning.level,
        message: `This will put you ${formatOverAmount(overBy)} over your "${budget.name}" budget`,
      };
    }

    return {
      level: warning.level,
      message: `You'll be at ${utilizationPercent.toFixed(0)}% of your "${budget.name}" budget`,
    };
  });
}

function formatOverAmount(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
