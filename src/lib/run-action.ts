import type { ActionResult } from "@/lib/types";

/**
 * Invoke a server action and turn thrown errors (network drops, server
 * crashes) into a failed `ActionResult`, so callers' loading states always
 * settle instead of spinning forever.
 */
export async function runAction<T>(
  action: () => Promise<ActionResult<T>>
): Promise<ActionResult<T>> {
  try {
    return await action();
  } catch (err) {
    console.error(err);
    return {
      success: false,
      error:
        "Couldn’t reach the server. Check your connection and try again." +
        (err instanceof Error && err.message ? ` (${err.message})` : ""),
    };
  }
}
