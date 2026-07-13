"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  enrichBudgetWithStatus,
  getMonthDateRange,
  generateMonthlyBudgetName,
  isDateInBudgetRange,
  resolveCreateBudgetInput,
  validateUpdateBudgetInput,
} from "@/lib/expense-budget";
import { toISODate } from "@/lib/utils";
import type {
  ActionResult,
  BudgetWithStatus,
  CreateBudgetInput,
  ExpenseBudget,
  UpdateBudgetInput,
} from "@/lib/types";

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

function computeSpentByBudget(
  budgets: ExpenseBudget[],
  transactions: { amount: number; date: string }[]
): Map<string, number> {
  const spentMap = new Map<string, number>();

  for (const budget of budgets) {
    let spent = 0;
    for (const txn of transactions) {
      if (txn.date >= budget.start_date && txn.date <= budget.end_date) {
        spent += Number(txn.amount);
      }
    }
    spentMap.set(budget.id, spent);
  }

  return spentMap;
}

async function enrichBudgetsWithSpent(
  budgets: ExpenseBudget[]
): Promise<BudgetWithStatus[]> {
  if (budgets.length === 0) return [];

  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return [];

  const minDate = budgets.reduce(
    (min, b) => (b.start_date < min ? b.start_date : min),
    budgets[0].start_date
  );
  const maxDate = budgets.reduce(
    (max, b) => (b.end_date > max ? b.end_date : max),
    budgets[0].end_date
  );

  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("amount, date")
    .eq("type", "expense")
    .gte("date", minDate)
    .lte("date", maxDate);

  if (error) {
    return budgets.map((budget) => enrichBudgetWithStatus(budget, 0));
  }

  const spentMap = computeSpentByBudget(budgets, transactions ?? []);

  return budgets
    .map((budget) =>
      enrichBudgetWithStatus(budget, spentMap.get(budget.id) ?? 0)
    )
    .sort((a, b) => b.start_date.localeCompare(a.start_date));
}

export async function getBudgets(): Promise<ActionResult<BudgetWithStatus[]>> {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("expense_budgets")
    .select("*")
    .order("start_date", { ascending: false });

  if (error) return { success: false, error: error.message };

  const budgets = (data ?? []) as ExpenseBudget[];
  const enriched = await enrichBudgetsWithSpent(budgets);
  return { success: true, data: enriched };
}

export async function getActiveBudgets(): Promise<
  ActionResult<BudgetWithStatus[]>
> {
  const result = await getBudgets();
  if (!result.success) return result;

  const active = result.data.filter((b) => b.lifecycle === "active");
  return { success: true, data: active };
}

export async function getBudgetsForDate(
  date: string
): Promise<ActionResult<BudgetWithStatus[]>> {
  const result = await getBudgets();
  if (!result.success) return result;

  const matching = result.data.filter((b) =>
    isDateInBudgetRange(date, b.start_date, b.end_date)
  );
  return { success: true, data: matching };
}

export async function createBudget(
  input: CreateBudgetInput
): Promise<ActionResult<ExpenseBudget>> {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const resolved = resolveCreateBudgetInput(input);
  if (!resolved.ok) return { success: false, error: resolved.error };

  const { data, error } = await supabase
    .from("expense_budgets")
    .insert({
      user_id: user.id,
      ...resolved.data,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/", "layout");
  return { success: true, data: data as ExpenseBudget };
}

export async function updateBudget(
  id: string,
  input: UpdateBudgetInput
): Promise<ActionResult<ExpenseBudget>> {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: existing, error: fetchError } = await supabase
    .from("expense_budgets")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return { success: false, error: "Budget not found" };
  }

  const budget = existing as ExpenseBudget;
  const validation = validateUpdateBudgetInput(input, budget.period_type);
  if (!validation.ok) return { success: false, error: validation.error };

  const updates: Record<string, unknown> = {};

  if (input.amount !== undefined) updates.amount = input.amount;
  if (input.name !== undefined) updates.name = input.name.trim();

  if (budget.period_type === "monthly" && input.month && input.year) {
    const { start, end } = getMonthDateRange(input.year, input.month);
    updates.start_date = start;
    updates.end_date = end;
    if (input.name === undefined) {
      updates.name = generateMonthlyBudgetName(input.year, input.month);
    }
  } else if (budget.period_type === "custom") {
    if (input.start_date !== undefined) updates.start_date = input.start_date;
    if (input.end_date !== undefined) updates.end_date = input.end_date;
  }

  if (
    updates.start_date &&
    updates.end_date &&
    (updates.end_date as string) < (updates.start_date as string)
  ) {
    return { success: false, error: "End date must be on or after start date" };
  }

  const { data, error } = await supabase
    .from("expense_budgets")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/", "layout");
  return { success: true, data: data as ExpenseBudget };
}

export async function deleteBudget(id: string): Promise<ActionResult> {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("expense_budgets")
    .delete()
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/", "layout");
  return { success: true, data: undefined };
}

export async function getCurrentMonthParts(): Promise<{
  month: number;
  year: number;
}> {
  const today = toISODate();
  return {
    year: Number(today.slice(0, 4)),
    month: Number(today.slice(5, 7)),
  };
}
