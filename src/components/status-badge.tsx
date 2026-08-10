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
  operational: {
    className: "bg-ok-muted text-ok-foreground border-ok/30",
    Icon: CircleCheck,
  },
  degraded: {
    className: "bg-warn-muted text-warn-foreground border-warn/40",
    Icon: AlertTriangle,
  },
  outage: {
    className: "bg-down-muted text-down-foreground border-down/40",
    Icon: CircleX,
  },
  restoring: {
    className: "bg-fixing-muted text-fixing-foreground border-fixing/40",
    Icon: Wrench,
  },
  unknown: {
    className: "bg-muted text-muted-foreground border-border",
    Icon: CircleHelp,
  },
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
        // Stamped rather than pill-shaped: this is a label applied to a record,
        // not a tag. Uppercase mono keeps every status the same visual weight,
        // so "sin confirmar" reads as an answer rather than a missing one.
        "label-signage inline-flex items-center gap-1.5 rounded-sm border",
        size === "lg" ? "px-2.5 py-1.5 text-xs" : "px-2 py-1",
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
