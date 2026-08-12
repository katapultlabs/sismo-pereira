import { AlertTriangle, CircleHelp, CircleCheck, CircleX, Wrench } from "lucide-react";

import { cn } from "@/lib/utils";
import { STATUS_LABELS, type Lang } from "@/lib/i18n";
import type { StatusLevel } from "@/lib/types";

/**
 * Status is encoded three ways — colour, icon, and text — so it survives
 * colour blindness, greyscale printing, and a cracked phone screen.
 */
const STATUS_STYLES: Record<
  StatusLevel,
  { className: string; Icon: typeof CircleCheck }
> = {
  operational: { className: "bg-ok-muted text-ok-foreground", Icon: CircleCheck },
  degraded: {
    className: "bg-warn-muted text-warn-foreground",
    Icon: AlertTriangle,
  },
  outage: { className: "bg-down-muted text-down-foreground", Icon: CircleX },
  restoring: {
    className: "bg-fixing-muted text-fixing-foreground",
    Icon: Wrench,
  },
  unknown: { className: "bg-muted text-muted-foreground", Icon: CircleHelp },
};

export function StatusBadge({
  status,
  lang,
  size = "default",
  className,
}: {
  status: StatusLevel;
  lang: Lang;
  size?: "default" | "lg";
  className?: string;
}) {
  const { className: statusClass, Icon } = STATUS_STYLES[status];

  return (
    <span
      className={cn(
        // A soft tinted pill — Linear-style — carrying the status tint and its
        // icon. Calm tracking and even padding so the icon and label sit
        // balanced. Colour, icon, and text encode the status three ways, so it
        // survives greyscale and a cracked screen. The trailing `pr` offsets
        // the letter-spacing so the label reads optically centred.
        "inline-flex items-center gap-1.5 rounded-full font-mono font-semibold uppercase leading-none tracking-[0.06em] transition-colors",
        // On a card hover (its surface goes muted), the pill drops to the page
        // background so it never dissolves into the card.
        "group-hover:bg-background",
        size === "lg"
          ? "py-1.5 pr-2.5 pl-3 text-[0.6875rem]"
          : "py-1 pr-2 pl-2.5 text-[0.625rem]",
        statusClass,
        className,
      )}
    >
      <Icon className={size === "lg" ? "size-3.5" : "size-3"} aria-hidden />
      {STATUS_LABELS[lang][status]}
    </span>
  );
}

/** Accent bar used on status cards to make the grid scannable at a glance. */
export const STATUS_ACCENT: Record<StatusLevel, string> = {
  operational: "bg-ok",
  degraded: "bg-warn",
  outage: "bg-down",
  restoring: "bg-fixing",
  unknown: "bg-border",
};
