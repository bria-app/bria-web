/** Public status endpoints (no session needed): what the API reports about itself and the engine. */
import { API_BASE_URL } from "./client";

/** The JSON body of `/health` or `/status`, or null when it can't be read. */
export async function readStatus(path: "/health" | "/status"): Promise<unknown> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, { cache: "no-store" });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}
