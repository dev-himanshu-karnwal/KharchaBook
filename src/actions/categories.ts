"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type { ActionResult, Category, CategoryType } from "@/lib/types";

export async function createCategory(
  name: string,
  type: CategoryType,
  color: string | null,
): Promise<ActionResult<Category>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: category, error } = await supabase
    .from("categories")
    .insert({
      user_id: user.id,
      name,
      type,
      color,
      is_system: false,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/", "layout");
  return { success: true, data: category as Category };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/", "layout");
  return { success: true, data: undefined };
}
