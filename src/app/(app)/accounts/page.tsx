import { createClient } from "@/utils/supabase/server";
import type { Account } from "@/lib/types";
import { AccountsClient } from "@/components/accounts/accounts-client";

export default async function AccountsPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("accounts")
    .select("*")
    .order("is_active", { ascending: false })
    .order("name");

  return <AccountsClient accounts={(data ?? []) as Account[]} />;
}
