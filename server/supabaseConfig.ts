export type ConfigProblem = "missing-url" | "missing-key" | "invalid-url" | "dashboard-url" | "secret-key" | "invalid-key";

export interface SupabaseConfig { url: string; key: string; host: string; problem: ConfigProblem | null; }

const clean = (value: string | undefined) => (value ?? "").trim().replace(/^["'`]+|["'`]+$/g, "").trim();

/** Normalizes pasted Supabase settings and reports the most likely mistake without exposing the key. */
export function readSupabaseConfig(rawUrl: string | undefined, rawKey: string | undefined): SupabaseConfig {
  let url = clean(rawUrl);
  const key = clean(rawKey);
  if (!url) return { url, key, host: "", problem: "missing-url" };
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  url = url.replace(/\/+(rest|auth|storage)\/v1.*$/i, "").replace(/\/+$/, "");
  let host = "";
  try {
    const parsed = new URL(url);
    host = parsed.host;
    if (/(^|\.)supabase\.com$/i.test(parsed.hostname)) return { url, key, host, problem: "dashboard-url" };
    const local = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    if ((parsed.protocol !== "https:" && !local) || parsed.pathname !== "/" || parsed.search) return { url, key, host, problem: "invalid-url" };
    url = parsed.origin;
  } catch {
    return { url, key, host, problem: "invalid-url" };
  }
  if (!key) return { url, key, host, problem: "missing-key" };
  if (/^sb_secret_/i.test(key) || jwtRole(key) === "service_role") return { url, key, host, problem: "secret-key" };
  if (!/^sb_publishable_/i.test(key) && jwtRole(key) !== "anon") return { url, key, host, problem: "invalid-key" };
  return { url, key, host, problem: null };
}

function jwtRole(key: string): string | null {
  const part = key.split(".")[1];
  if (!part) return null;
  try {
    const json = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof json.role === "string" ? json.role : null;
  } catch {
    return null;
  }
}

export function problemMessage(problem: ConfigProblem, fr: boolean): string {
  const messages: Record<ConfigProblem, [string, string]> = {
    "missing-url": ["VITE_SUPABASE_URL est vide dans Vercel.", "VITE_SUPABASE_URL is empty in Vercel."],
    "missing-key": ["VITE_SUPABASE_PUBLISHABLE_KEY est vide dans Vercel.", "VITE_SUPABASE_PUBLISHABLE_KEY is empty in Vercel."],
    "invalid-url": ["VITE_SUPABASE_URL doit ressembler à https://abcdefgh.supabase.co (sans chemin à la fin).", "VITE_SUPABASE_URL must look like https://abcdefgh.supabase.co (no path at the end)."],
    "dashboard-url": ["VITE_SUPABASE_URL contient l'adresse du tableau de bord (supabase.com). Utilisez la « Project URL » : https://abcdefgh.supabase.co", "VITE_SUPABASE_URL contains the dashboard address (supabase.com). Use the “Project URL”: https://abcdefgh.supabase.co"],
    "secret-key": ["VITE_SUPABASE_PUBLISHABLE_KEY contient une clé secrète. Remplacez-la par la clé publique (anon / publishable) et changez la clé secrète dans Supabase.", "VITE_SUPABASE_PUBLISHABLE_KEY contains a secret key. Replace it with the public (anon / publishable) key and rotate the secret key in Supabase."],
    "invalid-key": ["VITE_SUPABASE_PUBLISHABLE_KEY n'est pas une clé publique valide (elle commence par eyJ… ou sb_publishable_…).", "VITE_SUPABASE_PUBLISHABLE_KEY is not a valid public key (it starts with eyJ… or sb_publishable_…)."],
  };
  return messages[problem][fr ? 0 : 1];
}

/** Turns the browser's bare network error into an actionable message naming the server it tried. */
export function networkMessage(error: unknown, host: string, fr: boolean): string {
  const text = error instanceof Error ? error.message : String(error ?? "");
  if (!/failed to fetch|networkerror|load failed|fetch failed/i.test(text)) return text || (fr ? "Service indisponible" : "Service unavailable");
  return fr
    ? `Impossible de joindre le serveur de comptes (${host}). Vérifiez que VITE_SUPABASE_URL est exactement la « Project URL » de Supabase, que le projet n'est pas en pause, puis redéployez sans cache. Désactivez aussi tout bloqueur de publicité pour ce site.`
    : `Cannot reach the account server (${host}). Check that VITE_SUPABASE_URL is exactly the Supabase “Project URL”, that the project is not paused, then redeploy without cache. Also disable any ad blocker for this site.`;
}
