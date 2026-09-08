import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Zap, Smartphone, Shield, Cable, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DEVICES = [
  {
    id: "iphone-15-16",
    brand: "Apple",
    model: "iPhone 15 / 15 Pro / 16 / 16 Pro",
    cable: "Type-C to Type-C (Power Delivery)",
    wattage: "27W - 35W سريع",
    protector: "لاصقة زجاجية بحواف سوداء 9D مقاومة للصدمات",
    caseType: "كفر مغناطيسي يدعم MagSafe",
    targetCategory: "chargers",
  },
  {
    id: "iphone-11-14",
    brand: "Apple",
    model: "iPhone 11 / 12 / 13 / 14 (Lightning)",
    cable: "Type-C to Lightning (PD)",
    wattage: "20W - 25W سريع",
    protector: "لاصقة خصوصية (لقافة) أو سيراميك مطفي",
    caseType: "كفر سيليكون مقاوم للصدمات",
    targetCategory: "cables",
  },
  {
    id: "samsung-s23-s24",
    brand: "Samsung",
    model: "Samsung Galaxy S23 / S24 / S25 Ultra",
    cable: "Type-C to Type-C (Super Fast Charging 2.0)",
    wattage: "45W GaN فائق السرعة",
    protector: "لاصقة بصمة متوافقة مع شاشة Ultra",
    caseType: "كفر مدرع بحماية كاميرا مدمجة",
    targetCategory: "chargers",
  },
  {
    id: "samsung-a-series",
    brand: "Samsung",
    model: "Samsung Galaxy A54 / A55 / A35 / A15",
    cable: "Type-C to Type-C 25W",
    wattage: "25W أصلي معتمد",
    protector: "لاصقة حماية كاملة للشاشة 2.5D",
    caseType: "كفر شفاف مع زوايا ممتصة للصدمات",
    targetCategory: "screen-protectors",
  },
  {
    id: "xiaomi-redmi",
    brand: "Xiaomi",
    model: "Xiaomi 13 / 14 / Redmi Note 13 Series",
    cable: "Type-C Turbo Charge 6A",
    wattage: "67W - 120W HyperCharge",
    protector: "لاصقة حماية متكاملة ضد الخدوش",
    caseType: "كفر كاربون فايبر خفيف الوزن",
    targetCategory: "chargers",
  },
];

export function DeviceCompatibilityTool() {
  const [selectedId, setSelectedId] = useState(DEVICES[0].id);
  const selectedDevice = DEVICES.find((d) => d.id === selectedId) ?? DEVICES[0];

  return (
    <section className="mt-14 overflow-hidden rounded-3xl glass-card border border-primary/30 p-6 sm:p-8 deep-shadow">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl sea-gradient text-primary-foreground glow-shadow">
              <Zap className="size-5" />
            </span>
            <span className="text-xs font-bold text-accent tracking-wide uppercase">
              مساعد التوافق الذكي
            </span>
          </div>
          <h2 className="font-display text-2xl font-black mt-1">
            دليلك السريع: أي الشواحن والاكسسوارات تناسب هاتفك؟
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            اختر موديل هاتفك لمعرفة أقصى سرعة شحن مدعومة، نوع الكيبل الصحيح، وأفضل كفر ولاصقة حماية.
          </p>
        </div>

        {/* قائمة اختيار الجهاز */}
        <div className="w-full sm:w-80 shrink-0">
          <label htmlFor="device-select" className="block text-xs font-bold text-muted-foreground mb-1.5">
            اختر نوع هاتفك:
          </label>
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger id="device-select" className="w-full h-11 rounded-2xl bg-secondary/40 font-bold text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEVICES.map((d) => (
                <SelectItem key={d.id} value={d.id} className="text-xs font-bold">
                  {d.model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* نتائج التوافق للجهاز المحدد */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-secondary/25 p-4 border border-border/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-primary font-bold text-xs mb-2">
              <Zap className="size-4" />
              <span>أقصى سرعة شحن مدعومة</span>
            </div>
            <p className="font-display font-black text-lg text-foreground">{selectedDevice.wattage}</p>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">شحن آمن يحافظ على صحة البطارية</p>
        </div>

        <div className="rounded-2xl bg-secondary/25 p-4 border border-border/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-accent font-bold text-xs mb-2">
              <Cable className="size-4" />
              <span>نوع الكيبل والمنفذ الموصى به</span>
            </div>
            <p className="font-bold text-sm text-foreground">{selectedDevice.cable}</p>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">نقل بيانات سريع وشحن معتمد</p>
        </div>

        <div className="rounded-2xl bg-secondary/25 p-4 border border-border/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-2">
              <Shield className="size-4" />
              <span>لاصقة الحماية الموصى بها</span>
            </div>
            <p className="font-bold text-sm text-foreground">{selectedDevice.protector}</p>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">صلابة 9H ضد الكسر والخدش</p>
        </div>

        <div className="rounded-2xl bg-secondary/25 p-4 border border-border/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-primary font-bold text-xs mb-2">
              <Smartphone className="size-4" />
              <span>الكفر المناسب</span>
            </div>
            <p className="font-bold text-sm text-foreground">{selectedDevice.caseType}</p>
          </div>
          <Button asChild size="sm" className="mt-3 w-full gap-1 text-xs">
            <Link to="/category/$slug" params={{ slug: selectedDevice.targetCategory }}>
              تصفح مستلزمات هذا الهاتف
              <ArrowLeft className="size-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}