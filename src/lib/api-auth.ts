import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

import { getServiceSupabase } from "./supabase/server";

export interface AuthedOrg {
  id: string;
  slug: string;
  name: string;
  services: string[];
  verified: boolean;
}

export type AuthResult =
  | { ok: true; org: AuthedOrg }
  | { ok: false; status: 401 | 403 | 503; message: string };

/** API keys are stored only as SHA-256 digests; the plaintext is never kept. */
export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/**
 * Authenticate a partner request via `Authorization: Bearer <key>`.
 *
 * Uses the service-role client because the caller is a machine, not a logged-in
 * user, so there is no RLS session to lean on. Every write performed after this
 * check is explicitly scoped to the returned org id.
 */
export async function authenticateOrg(request: Request): Promise<AuthResult> {
  const header = request.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return { ok: false, status: 401, message: "Missing bearer token." };
  }

  const supabase = getServiceSupabase();
  if (!supabase) {
    return {
      ok: false,
      status: 503,
      message: "Server is not configured for partner ingestion.",
    };
  }

  const digest = hashApiKey(token.trim());

  const { data, error } = await supabase
    .from("organizations")
    .select("id, slug, name, services, verified, api_key_hash")
    .eq("api_key_hash", digest)
    .maybeSingle();

  if (error) {
    console.error(`[api-auth] lookup failed: ${error.message}`);
    return { ok: false, status: 503, message: "Authentication backend error." };
  }

  if (!data?.api_key_hash) {
    return { ok: false, status: 401, message: "Invalid API key." };
  }

  // The lookup already matched on the digest; this constant-time comparison is
  // belt-and-braces against any future change to how the row is selected.
  const a = Buffer.from(digest, "hex");
  const b = Buffer.from(data.api_key_hash, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, status: 401, message: "Invalid API key." };
  }

  if (!data.verified) {
    return {
      ok: false,
      status: 403,
      message:
        "Organization is not verified yet. Contact the moderators to activate publishing.",
    };
  }

  return {
    ok: true,
    org: {
      id: data.id,
      slug: data.slug,
      name: data.name,
      services: data.services ?? [],
      verified: data.verified,
    },
  };
}

export function jsonError(status: number, message: string, extra?: unknown) {
  return Response.json(
    { ok: false, error: message, ...(extra ? { details: extra } : {}) },
    { status },
  );
}
