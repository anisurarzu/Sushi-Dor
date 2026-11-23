#!/usr/bin/env node
/**
 * Push Resend email env vars to Vercel (production + preview + development).
 * Usage: node scripts/set-vercel-email-env.mjs
 * Requires: vercel login (and linked project .vercel/)
 */
import { readFileSync, existsSync } from "fs";
import { spawnSync } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env");

function loadEnv(path) {
  if (!existsSync(path)) throw new Error(`Missing ${path}`);
  const out = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#") || !t.includes("=")) continue;
    const i = t.indexOf("=");
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

function vercelEnvAdd(name, value, environment) {
  const r = spawnSync(
    "npx",
    ["vercel", "env", "add", name, environment, "--force", "--yes"],
    {
      cwd: root,
      input: value,
      encoding: "utf8",
      shell: process.platform === "win32",
    },
  );
  const out = `${r.stdout || ""}${r.stderr || ""}`.trim();
  console.log(`[${environment}] ${name}: ${r.status === 0 ? "OK" : "FAIL"}`);
  if (r.status !== 0) console.log(out.slice(-400));
  return r.status === 0;
}

const env = loadEnv(envPath);
const key = env.EMAIL_API_KEY || env.RESEND_API_KEY;
const from = env.EMAIL_FROM || "Sushi D'or <onboarding@resend.dev>";
const admin = env.ADMIN_EMAIL || "sushidorreservations@gmail.com";

if (!key) {
  console.error("EMAIL_API_KEY missing in .env");
  process.exit(1);
}

const who = spawnSync("npx", ["vercel", "whoami"], {
  cwd: root,
  encoding: "utf8",
  shell: process.platform === "win32",
});
if (who.status !== 0) {
  console.error("Not logged in. Run: npx vercel login");
  console.error(who.stderr || who.stdout);
  process.exit(1);
}
console.log("Vercel user:", (who.stdout || "").trim());

let ok = true;
for (const environment of ["production", "preview", "development"]) {
  ok =
    vercelEnvAdd("EMAIL_API_KEY", key, environment) &&
    vercelEnvAdd("EMAIL_FROM", from, environment) &&
    vercelEnvAdd("ADMIN_EMAIL", admin, environment) &&
    ok;
}

if (!ok) process.exit(1);

console.log("\nRedeploying production…");
const deploy = spawnSync(
  "npx",
  ["vercel", "redeploy", "--yes", "sushi-dor.vercel.app"],
  {
    cwd: root,
    encoding: "utf8",
    shell: process.platform === "win32",
  },
);
console.log(deploy.stdout || deploy.stderr);
console.log("Done. Check https://sushi-dor.vercel.app/api/health/email");
