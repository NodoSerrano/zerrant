#!/usr/bin/env node
/**
 * LOCAL ONLY — uploads the default Agus Diez avatar into the public `avatars` bucket
 * after `supabase db reset` (SQL seed cannot place storage blobs).
 *
 * Usage (from repo root, local stack running):
 *   pnpm db:seed-local-avatar
 *
 * Credentials resolve from `supabase status -o env` first (never from hosted
 * `.env.local` by default). Non-local API URLs are refused.
 *
 * Keep USER_ID / object path in sync with supabase/seed.sql
 * (v_user_id + avatar path a1111111-…/agus-diez.jpg).
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

/** Must match supabase/seed.sql `v_user_id`. */
const USER_ID = "a1111111-1111-4111-8111-111111111111";
/** Must match supabase/seed.sql avatar object path suffix. */
const OBJECT_PATH = `${USER_ID}/agus-diez.jpg`;
const ASSET = resolve(root, "supabase/seed-assets/agus-diez.jpg");
const DEFAULT_URL = "http://127.0.0.1:54321";

function die(message) {
  console.error(message);
  process.exit(1);
}

function parseEnvLines(text) {
  const map = {};
  for (const line of text.split("\n")) {
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    map[key] = value;
  }
  return map;
}

function supabaseStatusEnv() {
  const binCandidates = [resolve(root, "node_modules/.bin/supabase"), "supabase"];
  for (const bin of binCandidates) {
    const result = spawnSync(bin, ["status", "-o", "env"], {
      cwd: root,
      encoding: "utf8",
    });
    if (result.status !== 0 || !result.stdout) continue;
    return parseEnvLines(result.stdout);
  }
  return {};
}

/** Fail closed unless the API URL is loopback (local supabase start). */
function assertLocalApiUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    die(`Refusing non-local Supabase URL (unparseable): ${url}`);
  }

  const host = parsed.hostname.toLowerCase();
  const localHosts = new Set(["127.0.0.1", "localhost", "::1"]);
  if (!localHosts.has(host)) {
    die(
      `Refusing non-local Supabase URL host "${host}". ` +
        `db:seed-local-avatar only targets local supabase (127.0.0.1 / localhost). ` +
        `Got: ${url}`,
    );
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    die(`Refusing unsupported protocol on local Supabase URL: ${url}`);
  }
}

const forceEnv = process.argv.includes("--allow-env");
const status = supabaseStatusEnv();

// Prefer live local stack credentials. Hosted `.env.local` is ignored unless
// --allow-env is passed (still subject to local URL allowlist).
let url = status.API_URL || DEFAULT_URL;
let serviceKey = status.SERVICE_ROLE_KEY || status.SECRET_KEY || "";

if (forceEnv) {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const envKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY || "";
  if (envUrl) url = envUrl;
  if (envKey) serviceKey = envKey;
}

assertLocalApiUrl(url);

if (!serviceKey) {
  die(
    "Missing local service role key. Start the stack (`pnpm exec supabase start`) " +
      "so `supabase status -o env` exposes SERVICE_ROLE_KEY, then retry.",
  );
}

if (!existsSync(ASSET)) {
  die(`Missing seed asset: ${ASSET}`);
}

const bytes = readFileSync(ASSET);
const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { error: uploadError } = await supabase.storage.from("avatars").upload(OBJECT_PATH, bytes, {
  contentType: "image/jpeg",
  upsert: true,
  cacheControl: "31536000",
});

if (uploadError) {
  die(`Avatar upload failed: ${uploadError.message}`);
}

const {
  data: { publicUrl },
} = supabase.storage.from("avatars").getPublicUrl(OBJECT_PATH);

// getPublicUrl is client-side string build; still refuse if it left loopback.
assertLocalApiUrl(new URL(publicUrl).origin);

const { data: updatedRows, error: profileError } = await supabase
  .from("profiles")
  .update({ avatar_url: publicUrl })
  .eq("id", USER_ID)
  .select("id");

if (profileError) {
  die(`Profile avatar_url update failed: ${profileError.message}`);
}

if (!updatedRows || updatedRows.length === 0) {
  die(
    `Profile avatar_url update matched 0 rows for id=${USER_ID}. ` +
      `Run \`pnpm exec supabase db reset\` first so supabase/seed.sql creates the user.`,
  );
}

console.log("Local seed avatar ready:");
console.log(`  path: ${OBJECT_PATH}`);
console.log(`  url:  ${publicUrl}`);
