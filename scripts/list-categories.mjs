#!/usr/bin/env node
/**
 * List all categories from Supabase with transaction/recurring usage.
 *
 * Usage:
 *   pnpm categories:list
 *
 * Env (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 *
 * One-time DB setup: scripts/setup-category-rpcs.sql
 */

import { requirePublishableConfig } from "./lib/supabase-env.mjs";
import { supabaseRpc } from "./lib/supabase-client.mjs";

function pad(value, width) {
  const text = String(value ?? "");
  return text.length >= width ? text : text + " ".repeat(width - text.length);
}

const { url, key } = requirePublishableConfig();

let categories;
try {
  categories = await supabaseRpc(url, key, "list_categories_with_usage");
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const income = categories.filter((c) => c.type === "income");
const expense = categories.filter((c) => c.type === "expense");

console.log(`\nKharchaBook categories (${categories.length} total)\n`);

function printSection(title, rows) {
  console.log(`=== ${title} (${rows.length}) ===\n`);

  const headers = [
    "sort",
    "name",
    "icon",
    "color",
    "system",
    "txns",
    "rec",
    "id",
  ];
  const widths = [4, 22, 16, 8, 6, 4, 3, 36];

  console.log(headers.map((h, i) => pad(h, widths[i])).join("  "));
  console.log(widths.map((w) => "-".repeat(w)).join("  "));

  for (const row of rows) {
    console.log(
      [
        pad(row.sort_order, widths[0]),
        pad(row.name, widths[1]),
        pad(row.icon ?? "-", widths[2]),
        pad(row.color ?? "-", widths[3]),
        pad(row.is_system ? "yes" : "no", widths[4]),
        pad(row.transaction_count ?? 0, widths[5]),
        pad(row.recurring_count ?? 0, widths[6]),
        pad(row.id, widths[7]),
      ].join("  ")
    );
  }

  console.log("");
}

printSection("Income", income);
printSection("Expense", expense);

const custom = categories.filter((c) => !c.is_system);
if (custom.length > 0) {
  console.log(`Custom user categories: ${custom.length}`);
  for (const row of custom) {
    console.log(
      `  - ${row.name} (${row.type}) txns=${row.transaction_count} recurring=${row.recurring_count} [${row.id}]`
    );
  }
  console.log("");
}

console.log("--- JSON (paste this back when editing categories) ---\n");
console.log(
  JSON.stringify(
    categories.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      icon: row.icon,
      color: row.color,
      is_system: row.is_system,
      sort_order: row.sort_order,
      transaction_count: Number(row.transaction_count ?? 0),
      recurring_count: Number(row.recurring_count ?? 0),
    })),
    null,
    2
  )
);
console.log("");
