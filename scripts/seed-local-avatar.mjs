#!/usr/bin/env node
/**
 * LOCAL ONLY — uploads the default Agus Diez avatar into the public `avatars` bucket
 * after `supabase db reset` (SQL seed cannot place storage blobs).
 *
 * Usage (from repo root, local stack running):
 *   pnpm db:seed-local-avatar
 *
 * Env (optional overrides; defaults match `supabase start`):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  (or SERVICE_ROLE_KEY from `supabase status -o env`)
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const USER_ID = "a1111111-1111-4111-8111-111111111111";
const OBJECT_PATH = `${USER_ID}/agus-diez.jpg`;
const ASSET = resolve(root, "supabase/seed-assets/agus-diez.jpg");
const DEFAULT_URL = "http://127.0.0.1:54321";

function loadDotEnvLocal() {
  const envPath = resolve(root, ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

function supabaseStatusEnv() {
  const binCandidates = [
    resolve(root, "node_modules/.bin/supabase"),
    "supabase",
  ];
  for (const bin of binCandidates) {
    const result = spawnSync(bin, ["status", "-o", "env"], {
      cwd: root,
      encoding: "utf8",
    });
    if (result.status !== 0 || !result.stdout) continue;
    const map = {};
    for (const line of result.stdout.split("\n")) {
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
  return {};
}

loadDotEnvLocal();
const status = supabaseStatusEnv();

const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  status.API_URL ||
  DEFAULT_URL;
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SERVICE_ROLE_KEY ||
  status.SERVICE_ROLE_KEY ||
  status.SECRET_KEY;

if (!serviceKey) {
  console.error(
    "Missing service role key. Set SUPABASE_SERVICE_ROLE_KEY or run with local `supabase status` available.",
  );
  process.exit(1);
}

if (!existsSync(ASSET)) {
  console.error(`Missing seed asset: ${ASSET}`);
  process.exit(1);
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
  console.error("Avatar upload failed:", uploadError.message);
  process.exit(1);
}

const {
  data: { publicUrl },
} = supabase.storage.from("avatars").getPublicUrl(OBJECT_PATH);

const { error: profileError } = await supabase
  .from("profiles")
  .update({ avatar_url: publicUrl })
  .eq("id", USER_ID);

if (profileError) {
  console.error("Profile avatar_url update failed:", profileError.message);
  process.exit(1);
}

console.log("Local seed avatar ready:");
console.log(`  path: ${OBJECT_PATH}`);
console.log(`  url:  ${publicUrl}`);
