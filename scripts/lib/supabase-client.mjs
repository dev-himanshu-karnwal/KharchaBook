import { RPC_SETUP_HINT } from "./supabase-env.mjs";

export async function supabaseRpc(url, key, functionName, body = {}) {
  const response = await fetch(`${url}/rest/v1/rpc/${functionName}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();

    if (
      response.status === 404 ||
      text.includes("Could not find the function") ||
      text.includes("function public." + functionName)
    ) {
      throw new Error(
        `Database function "${functionName}" is not installed.\n${RPC_SETUP_HINT}`
      );
    }

    throw new Error(`RPC ${functionName} failed (${response.status}): ${text}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
