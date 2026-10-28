import { test } from "node:test";
import assert from "node:assert/strict";
import { readSupabaseConfig, networkMessage } from "../server/supabaseConfig";
const anon = `x.${btoa(JSON.stringify({ role: "anon" }))}.y`;
const service = `x.${btoa(JSON.stringify({ role: "service_role" }))}.y`;
test("pasted quotes, spaces and API paths are cleaned from the project URL", () => {
  const c = readSupabaseConfig(' "https://abcd.supabase.co/rest/v1/" ', ` ${anon} `);
  assert.equal(c.problem, null); assert.equal(c.url, "https://abcd.supabase.co"); assert.equal(c.key, anon);
});
test("a URL without https gets it added", () => { assert.equal(readSupabaseConfig("abcd.supabase.co", anon).url, "https://abcd.supabase.co"); });
test("the dashboard address is rejected", () => { assert.equal(readSupabaseConfig("https://supabase.com/dashboard/project/abcd", anon).problem, "dashboard-url"); });
test("secret keys are refused in the browser", () => {
  assert.equal(readSupabaseConfig("https://abcd.supabase.co", service).problem, "secret-key");
  assert.equal(readSupabaseConfig("https://abcd.supabase.co", "sb_secret_123").problem, "secret-key");
});
test("publishable keys are accepted", () => { assert.equal(readSupabaseConfig("https://abcd.supabase.co", "sb_publishable_123").problem, null); });
test("random text is not a key", () => { assert.equal(readSupabaseConfig("https://abcd.supabase.co", "hello").problem, "invalid-key"); });
test("missing values are reported", () => {
  assert.equal(readSupabaseConfig("", anon).problem, "missing-url");
  assert.equal(readSupabaseConfig("https://abcd.supabase.co", "").problem, "missing-key");
});
test("Failed to fetch names the server it tried", () => {
  assert.ok(networkMessage(new TypeError("Failed to fetch"), "abcd.supabase.co", true).includes("abcd.supabase.co"));
  assert.equal(networkMessage(new Error("Invalid login credentials"), "abcd.supabase.co", false), "Invalid login credentials");
});
