#!/usr/bin/env node
/**
 * Issue an API key to a partner organization.
 *
 *   node scripts/issue-api-key.mjs <org-slug>
 *
 * Prints the plaintext key ONCE. Only the SHA-256 digest is stored, so a lost
 * key cannot be recovered — reissue instead. Requires SUPABASE_SERVICE_ROLE_KEY.
 */

import { createHash, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const slug = process.argv[2];
if (!slug) {
  console.error("Usage: node scripts/issue-api-key.mjs <org-slug>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Run `vercel env pull .env.local` first, then `node --env-file=.env.local ...`",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

const key = `sp_${randomBytes(32).toString("base64url")}`;
const hash = createHash("sha256").update(key).digest("hex");

const { data, error } = await supabase
  .from("organizations")
  .update({
    api_key_hash: hash,
    api_key_last4: key.slice(-4),
    // Issuing a key implies a human has confirmed who this organization is.
    verified: true,
  })
  .eq("slug", slug)
  .select("id, slug, name")
  .single();

if (error) {
  console.error(`Failed: ${error.message}`);
  process.exit(1);
}

console.log(`\nOrganization: ${data.name} (${data.slug})`);
console.log(`API key (shown once, store it now):\n\n  ${key}\n`);
console.log("Test it:\n");
console.log(`  curl -X POST "$SITE_URL/api/v1/status" \\`);
console.log(`    -H "Authorization: Bearer ${key}" \\`);
console.log(`    -H "Content-Type: application/json" \\`);
console.log(
  `    -d '{"service":"electricity","zone_slug":"cuba","status":"restoring","headline":"Cuadrillas en sitio"}'\n`,
);
