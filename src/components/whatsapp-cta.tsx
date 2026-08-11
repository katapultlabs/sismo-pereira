import { MessageCircle } from "lucide-react";

import { getDictionary, type Lang } from "@/lib/i18n";

/**
 * "Message us on WhatsApp".
 *
 * Renders **nothing** unless `NEXT_PUBLIC_WHATSAPP_NUMBER` is set. Printing a
 * number nobody is answering is the same failure as the placeholder email in
 * commit `eca5dd3` — see EDITORIAL Rule 8. The honest empty state for a
 * channel that is not live is no channel at all.
 *
 * The number is ours, not a reporter's, so publishing it does not touch
 * Rule 4. What Rule 4 governs is the number on the other end, which never
 * leaves `/admin`.
 */
export function WhatsAppCta({ lang }: { lang: Lang }) {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "");
  if (!number) return null;

  const t = getDictionary(lang).whatsapp;
  const href = `https://wa.me/${number}?text=${encodeURIComponent(t.prefill)}`;

  return (
    <aside className="mt-6 border border-border p-4">
      <h2 className="label-signage flex items-center gap-2 text-muted-foreground">
        <MessageCircle className="size-4" aria-hidden />
        {t.heading}
      </h2>
      <p className="mt-2 text-sm leading-relaxed">{t.body}</p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="label-signage mt-3 inline-flex items-center gap-2 rounded-sm border border-foreground/30 px-3 py-2 transition-colors hover:bg-secondary"
      >
        <MessageCircle className="size-3.5" aria-hidden />
        {t.cta}
        <span className="font-mono normal-case">+{number}</span>
      </a>
      <p className="mt-3 text-xs text-muted-foreground">{t.privacy}</p>
    </aside>
  );
}
