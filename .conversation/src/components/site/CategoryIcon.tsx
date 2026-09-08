import {
  Smartphone,
  Headphones,
  Sparkles,
  Shield,
  Ear,
  Zap,
  Cable,
  Camera,
  BatteryCharging,
  SmartphoneCharging,
  Package,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  smartphone: Smartphone,
  headphones: Headphones,
  sparkles: Sparkles,
  shield: Shield,
  ear: Ear,
  zap: Zap,
  cable: Cable,
  camera: Camera,
  "battery-charging": BatteryCharging,
  "smartphone-charging": SmartphoneCharging,
  package: Package,
};

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Package;
  return <Icon className={className} />;
}

export const ICON_OPTIONS = Object.keys(ICONS);
