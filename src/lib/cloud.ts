import { createClient } from "@supabase/supabase-js";
import { readSupabaseConfig } from "../../server/supabaseConfig";
export const cloudConfig = readSupabaseConfig(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
export const configured = cloudConfig.problem === null;
export const cloud = createClient(configured ? cloudConfig.url : "https://unconfigured.invalid", configured ? cloudConfig.key : "unconfigured");
export async function apiFetch(path: string, options: RequestInit) {
  const { data } = await cloud.auth.getSession();
  if (!data.session) throw new Error("Session expirée / Session expired");
  return fetch(path, { ...options, headers: { ...options.headers, Authorization: `Bearer ${data.session.access_token}` } });
}
