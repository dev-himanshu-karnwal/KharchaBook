#!/usr/bin/env node
/**
 * Add custom expense categories to Supabase.
 *
 * Usage:
 *   pnpm categories:add-expense
 *
 * Env (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 *
 * One-time DB setup: scripts/setup-category-rpcs.sql
 * (includes add_expense_categories — re-run if you set up RPCs earlier)
 */

import { requirePublishableConfig } from "./lib/supabase-env.mjs";
import { supabaseRpc } from "./lib/supabase-client.mjs";

const EXPENSE_CATEGORIES = [
  {
    name: "Dogesh (My Dog)",
    icon: "paw-print",
    color: "#f472b6",
  },
  {
    name: "Temple",
    icon: "landmark",
    color: "#ea580c",
  },
  {
    name: "Travelling (Trip)",
    icon: "plane",
    color: "#0284c7",
  },
  {
    name: "Transfer to Person",
    icon: "send",
    color: "#7c3aed",
  },
  {
    name: "Udhar Given",
    icon: "hand-coins",
    color: "#b91c1c",
  },
];

const { url, key } = requirePublishableConfig();

let result;
try {
  result = await supabaseRpc(url, key, "add_expense_categories", {
    p_categories: EXPENSE_CATEGORIES,
  });
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const created = result.created ?? [];
const skipped = result.skipped ?? [];

console.log("\nKharchaBook — add expense categories\n");

if (created.length > 0) {
  console.log(`Created ${created.length}:\n`);
  for (const row of created) {
    console.log(`  + ${row.name} (${row.id})`);
  }
  console.log("");
}

if (skipped.length > 0) {
  console.log(`Skipped ${skipped.length} (already exist):\n`);
  for (const row of skipped) {
    console.log(`  ~ ${row.name} (${row.id})`);
  }
  console.log("");
}

if (created.length === 0 && skipped.length === 0) {
  console.log("No categories were added.");
}
