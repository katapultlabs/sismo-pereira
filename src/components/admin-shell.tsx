import Link from "next/link";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/moderation";
import { cn } from "@/lib/utils";

/**
 * The chrome shared by every moderator page.
 *
 * Extracted when WhatsApp added a second and third admin surface: repeating a
 * masthead is how an operations console stops reading as one tool, and a
 * moderator switching between the report queue and the WhatsApp inbox during
 * an incident should never have to re-orient.
 */

interface AdminTab {
  href: string;
  label: string;
  /** Rendered as a mono readout, like the queue counter. Omit when zero. */
  count?: number;
}

export function AdminShell({
  title,
  user,
  tabs,
  active,
  children,
}: {
  title: string;
  user?: string | null;
  tabs?: AdminTab[];
  active?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:py-12">
      <header className="flex flex-wrap items-center justify-between gap-3 border-t border-foreground/25 pt-3">
        <div>
          <h1 className="display-condensed text-3xl font-extrabold uppercase">
            {title}
          </h1>
          {user ? (
            <p className="font-mono text-xs text-muted-foreground">{user}</p>
          ) : null}
        </div>
        {user ? (
          <form action={signOut}>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="label-signage rounded-sm"
            >
              Cerrar sesión
            </Button>
          </form>
        ) : null}
      </header>

      {tabs && tabs.length > 0 ? (
        <nav className="flex flex-wrap gap-1 border-b border-foreground/25 pb-2">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={tab.href === active ? "page" : undefined}
              className={cn(
                "label-signage rounded-sm px-2 py-1 transition-colors",
                tab.href === active
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
              {tab.count ? (
                <span data-readout className="ml-1.5 tabular-nums">
                  {tab.count}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>
      ) : null}

      {children}
    </div>
  );
}

export const ADMIN_TABS: AdminTab[] = [
  { href: "/admin", label: "Reportes" },
  { href: "/admin/whatsapp", label: "WhatsApp" },
  { href: "/admin/whatsapp/difusion", label: "Difusión" },
];
