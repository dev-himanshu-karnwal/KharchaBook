import { createClient } from "@/utils/supabase/server";
import type { Account } from "@/lib/types";
import { CreditCardsClient } from "@/components/credit-cards/credit-cards-client";

export default async function CreditCardsPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("accounts")
    .select("*")
    .eq("type", "credit_card")
    .order("is_active", { ascending: false })
    .order("name");

  return <CreditCardsClient accounts={(data ?? []) as Account[]} />;
}
