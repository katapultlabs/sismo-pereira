import { DatabaseZap } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getDictionary, type Lang } from "@/lib/i18n";

/**
 * Shown when a page rendered from fallback data instead of the live database.
 * Being explicit about this matters more than hiding it: readers are making
 * real decisions and deserve to know how stale what they're reading might be.
 */
export function DegradedNotice({ lang }: { lang: Lang }) {
  const t = getDictionary(lang).degraded;

  return (
    <Alert className="border-warn/40 bg-warn-muted text-warn-foreground">
      <DatabaseZap className="size-4" aria-hidden />
      <AlertTitle>{t.title}</AlertTitle>
      <AlertDescription className="text-warn-foreground/80">
        {t.body}
      </AlertDescription>
    </Alert>
  );
}
