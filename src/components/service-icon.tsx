import {
  Banknote,
  Bus,
  Droplets,
  Flame,
  Fuel,
  GraduationCap,
  HeartPulse,
  Smartphone,
  Wifi,
  Zap,
} from "lucide-react";

import type { ServiceType } from "@/lib/types";

const ICONS: Record<ServiceType, typeof Zap> = {
  electricity: Zap,
  water: Droplets,
  gas: Flame,
  internet: Wifi,
  mobile: Smartphone,
  transport: Bus,
  health: HeartPulse,
  fuel: Fuel,
  education: GraduationCap,
  banking: Banknote,
};

export function ServiceIcon({
  service,
  className,
}: {
  service: ServiceType;
  className?: string;
}) {
  const Icon = ICONS[service];
  return <Icon className={className} aria-hidden />;
}
