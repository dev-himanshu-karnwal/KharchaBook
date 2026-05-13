"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type {
  ActionResult,
  CreateRecurringInput,
  Frequency,
  RecurringTransaction,
} from "@/lib/types";

function computeNextDueDate(startDate: string, frequency: Frequency): string {
  const start = new Date(startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let next = new Date(start);

  while (next < today) {
    switch (frequency) {
      case "daily":
        next.setDate(next.getDate() + 1);
        break;
      case "weekly":
        next.setDate(next.getDate() + 7);
        break;
      case "monthly":
        next.setMonth(next.getMonth() + 1);
        break;
      case "quarterly":
        next.setMonth(next.getMonth() + 3);
        break;
      case "yearly":
        next.setFullYear(next.getFullYear() + 1);
        break;
    }
  }

  return next.toISOString().split("T")[0];
}

export async function createRecurring(
  data: CreateRecurringInput,
): Promise<ActionResult<RecurringTransaction>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const nextDue = computeNextDueDate(data.start_date, data.frequency);

  const { data: rec, error } = await supabase
    .from("recurring_transactions")
    .insert({
      user_id: user.id,
      account_id: data.account_id,
      category_id: data.category_id,
      type: data.type,
      name: data.name,
      amount: data.amount,
      frequency: data.frequency,
      start_date: data.start_date,
      end_date: data.end_date,
      next_due_date: nextDue,
      tag: data.tag,
      notes: data.notes,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/", "layout");
  return { success: true, data: rec as RecurringTransaction };
}

export async function updateRecurring(
  id: string,
  data: Partial<CreateRecurringInput>,
): Promise<ActionResult> {
  const supabase = await createClient();

  const updateData: Record<string, unknown> = { ...data };

  if (data.start_date && data.frequency) {
    updateData.next_due_date = computeNextDueDate(data.start_date, data.frequency);
  }

  const { error } = await supabase
    .from("recurring_transactions")
    .update(updateData)
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/", "layout");
  return { success: true, data: undefined };
}

export async function deleteRecurring(id: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.from("recurring_transactions").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/", "layout");
  return { success: true, data: undefined };
}

export async function toggleRecurringActive(
  id: string,
  isActive: boolean,
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("recurring_transactions")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/", "layout");
  return { success: true, data: undefined };
}
