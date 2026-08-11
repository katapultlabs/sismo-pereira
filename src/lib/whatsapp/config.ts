import "server-only";

/**
 * WhatsApp Cloud API configuration.
 *
 * The credentials are the ones already issued to the ProCarmelita Business
 * account — same app, same verified number — so nothing here needs a new Meta
 * review. See `docs/WHATSAPP.md` for why that sharing has consequences and how
 * webhook delivery is split between the two projects.
 *
 * Like `getServerSupabase()`, everything degrades to "not configured" rather
 * than throwing at import time: the site must build and boot with no WhatsApp
 * env at all.
 */

/** Pinned deliberately — v21.0 is what the ProCarmelita integration runs on. */
export const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION ?? "v21.0";
export const GRAPH_URL = `https://graph.facebook.com/${GRAPH_VERSION}`;

export interface WhatsAppConfig {
  token: string;
  phoneNumberId: string;
  businessId: string | null;
  appSecret: string;
  verifyToken: string;
}

/**
 * Returns null unless every credential needed to *both* send and safely
 * receive is present. Half-configured is treated as unconfigured on purpose:
 * an inbound webhook we cannot verify the signature of is worse than none.
 */
export function getWhatsAppConfig(): WhatsAppConfig | null {
  const token = process.env.WHATSAPP_CLOUD_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID;
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (!token || !phoneNumberId || !appSecret || !verifyToken) return null;

  return {
    token,
    phoneNumberId,
    businessId: process.env.WHATSAPP_CLOUD_BUSINESS_ID ?? null,
    appSecret,
    verifyToken,
  };
}

export function isWhatsAppConfigured(): boolean {
  return getWhatsAppConfig() !== null;
}

/**
 * The template used to broadcast a published update to subscribers.
 *
 * Recipients of a broadcast are by definition outside the 24-hour service
 * window, so Meta will only accept an approved template. There is no
 * fallback and no invented default: if this is unset, broadcasting is off.
 */
export function getBroadcastTemplate(): { name: string; lang: string } | null {
  const name = process.env.WHATSAPP_BROADCAST_TEMPLATE;
  if (!name) return null;
  return { name, lang: process.env.WHATSAPP_BROADCAST_TEMPLATE_LANG ?? "es" };
}

/**
 * How long Meta lets us reply in free text after someone messages us.
 * https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages
 */
export const SERVICE_WINDOW_MS = 24 * 60 * 60 * 1000;

export function isWithinServiceWindow(
  lastInboundAt: string | null | undefined,
  now = Date.now(),
): boolean {
  if (!lastInboundAt) return false;
  const t = new Date(lastInboundAt).getTime();
  return Number.isFinite(t) && now - t < SERVICE_WINDOW_MS;
}
