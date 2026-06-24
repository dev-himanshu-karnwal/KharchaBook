#!/usr/bin/env node
/**
 * Remove categories not referenced by any transaction or recurring rule.
 *
 * Usage:
 *   pnpm categories:prune-unused              # dry run (default)
 *   pnpm categories:prune-unused -- --apply     # delete unused categories
 *
 * Env (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 *
 * One-time DB setup: scripts/setup-category-rpcs.sql
 */

import { requirePublishableConfig } from "./lib/supabase-env.mjs";
import { supabaseRpc } from "./lib/supabase-client.mjs";

const apply = process.argv.includes("--apply");
const { url, key } = requirePublishableConfig();

let result;
try {
  result = await supabaseRpc(url, key, "prune_unused_categories", {
    p_apply: apply,
  });
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const unused = result.unused ?? result.deleted ?? [];

console.log(`\nKharchaBook category cleanup (${apply ? "APPLY" : "DRY RUN"})`);

if (apply) {
  console.log(`Deleted ${result.deleted_count ?? 0} unused categories.\n`);
} else {
  console.log(
    `Categories: ${result.total_categories ?? "?"} total, ${result.in_use_count ?? "?"} in use, ${result.unused_count ?? unused.length} unused\n`
  );
}

if (unused.length === 0) {
  console.log("Nothing to remove.");
  process.exit(0);
}

console.log(`${apply ? "Deleted" : "Unused"} categories:\n`);
for (const row of unused) {
  console.log(
    `  - [${row.type}] ${row.name} (${row.is_system ? "system" : "custom"}) ${row.id}`
  );
}

if (!apply) {
  console.log(
    "\nDry run only. Re-run with --apply to delete these categories."
  );
}
