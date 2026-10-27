import { createClient } from "@supabase/supabase-js";
import { handler as analyze } from "../server/analyze-circuit/index.js";
import { handler as schematic } from "../server/generate-schematic/index.js";
import { handler as chat } from "../server/expert-chat/index.js";
import { bearerToken } from "../server/access.js";
interface Incoming {
  method?: string; headers: Record<string, string | string[] | undefined>;
  query: { action?: string | string[] }; body: unknown;
}
interface Outgoing { statusCode: number; setHeader(name: string, value: string): void; end(body?: string): void; write(body: Uint8Array): boolean; }
export default async function endpoint(req: Incoming, res: Outgoing) {
  const send = (status: number, error: string) => { res.statusCode = status; res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify({ error })); };
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return send(405, "Method not allowed"); }
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || !process.env.OPENAI_API_KEY) return send(503, "Service configuration incomplete");
  const token = bearerToken(req.headers.authorization);
  if (!token) return send(401, "Sign in required");
  const cloud = createClient(url, key, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await cloud.auth.getUser(token);
  if (error || !data.user) return send(401, "Invalid session");
  const handlers: Record<string, (req: Request) => Promise<Response>> = { "analyze-circuit": analyze, "generate-schematic": schematic, "expert-chat": chat };
  const action = typeof req.query.action === "string" ? req.query.action : "";
  const handler = handlers[action];
  if (!handler) return send(404, "Unknown action");
  const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
  if (!body || Buffer.byteLength(body) > 4_000_000) return send(413, "Image/request too large (maximum 4 MB)");
  // Atomic database quota prevents parallel requests bypassing per-user limits.
  const quota = await cloud.rpc("consume_ai_request");
  if (quota.error) return send(503, "Usage limit service unavailable");
  if (quota.data !== true) return send(429, "Daily AI request limit reached");
  try {
    const response = await handler(new Request(`https://api.internal/${action}`, { method: "POST", headers: { "Content-Type": "application/json" }, body }));
    res.statusCode = response.status;
    res.setHeader("Content-Type", response.headers.get("Content-Type") || "application/json");
    if (response.body) { const reader = response.body.getReader(); try { while (true) { const { done, value } = await reader.read(); if (done) break; res.write(value); } } finally { reader.releaseLock(); } }
    res.end();
  } catch { send(502, "Service temporarily unavailable"); }
}
