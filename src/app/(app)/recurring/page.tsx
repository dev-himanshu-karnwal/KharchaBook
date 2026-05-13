import { createClient } from "@/utils/supabase/server";
import { RecurringList } from "@/components/recurring/recurring-list";
import type { RecurringTransaction } from "@/lib/types";

export default async function RecurringPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("recurring_transactions")
    .select("*, account:accounts(*), category:categories(*)")
    .order("is_active", { ascending: false })
    .order("next_due_date");

  return <RecurringList recurring={(data ?? []) as RecurringTransaction[]} />;
}
