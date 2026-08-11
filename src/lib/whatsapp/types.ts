/**
 * Meta WhatsApp Cloud API webhook payload shapes.
 *
 * Hand-written rather than pulled from a package, for the same reason the
 * Postgres enums are hand-mirrored in `src/lib/types.ts`: the payload is a
 * contract with an external system and we want the drift to be visible in a
 * diff. Every field is optional-by-default because Meta adds message types
 * without warning, and an unknown type must degrade, never throw.
 */

export interface WaMediaPayload {
  id: string;
  mime_type?: string;
  sha256?: string;
  filename?: string;
  caption?: string;
}

export interface WaInboundMessage {
  from: string;
  id: string;
  /** Unix seconds, as a string. */
  timestamp: string;
  type: string;
  text?: { body: string };
  image?: WaMediaPayload;
  document?: WaMediaPayload;
  audio?: WaMediaPayload;
  video?: WaMediaPayload;
  sticker?: WaMediaPayload;
  location?: { latitude: number; longitude: number; name?: string; address?: string };
  reaction?: { message_id: string; emoji: string };
  button?: { text?: string; payload?: string };
  interactive?: {
    type: string;
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string; description?: string };
  };
  context?: { from?: string; id?: string };
  errors?: Array<{ code: number; title: string; message?: string }>;
}

export interface WaStatusUpdate {
  id: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: string;
  recipient_id: string;
  errors?: Array<{ code: number; title: string; message?: string }>;
}

export interface WaContact {
  wa_id: string;
  profile?: { name?: string };
}

export interface WaChangeValue {
  messaging_product?: string;
  metadata?: { display_phone_number?: string; phone_number_id?: string };
  contacts?: WaContact[];
  messages?: WaInboundMessage[];
  statuses?: WaStatusUpdate[];
}

export interface WaWebhookPayload {
  object?: string;
  entry?: Array<{
    id?: string;
    changes?: Array<{ field?: string; value?: WaChangeValue }>;
  }>;
}

/** Normalised view of an inbound message, after type-specific unwrapping. */
export interface NormalisedInbound {
  waId: string;
  waMessageId: string;
  occurredAt: string;
  messageType: string;
  /** Human-readable text: the body, the caption, or an honest placeholder. */
  body: string;
  /** True when `body` is a placeholder we generated, not words the sender typed. */
  bodyIsPlaceholder: boolean;
  media: { id: string; mime: string | null; filename: string | null } | null;
  profileName: string | null;
}
