import { createClient } from "@supabase/supabase-js";
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const configured = Boolean(url && key);
export const cloud = createClient(url || "https://unconfigured.invalid", key || "unconfigured");
export async function apiFetch(path: string, options: RequestInit) {
  const { data } = await cloud.auth.getSession();
  if (!data.session) throw new Error("Session expirée / Session expired");
  return fetch(path, { ...options, headers: { ...options.headers, Authorization: `Bearer ${data.session.access_token}` } });
}
