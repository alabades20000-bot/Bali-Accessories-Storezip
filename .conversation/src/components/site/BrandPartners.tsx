import { ShieldCheck } from "lucide-react";

const BRANDS = [
  { name: "Apple", tagline: "أصلي معتمد" },
  { name: "Samsung", tagline: "ضمان الوكيل" },
  { name: "Anker", tagline: "شواحن وبطاريات" },
  { name: "Joyroom", tagline: "إكسسوارات وسماعات" },
  { name: "Baseus", tagline: "جودة وكفاءة" },
  { name: "Green Lion", tagline: "حماية ولاصقات" },
  { name: "WiWU", tagline: "حقائب وإلكترونيات" },
  { name: "Hoco", tagline: "كيبلات ومحولات" },
  { name: "Oraimo", tagline: "صوتيات وشحن" },
  { name: "Xiaomi", tagline: "أجهزة ذكية" },
];

export function BrandPartners() {
  return (
    <section className="mt-14 rounded-3xl glass-card p-6 sm:p-8 border border-border/70">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-4">
        <div>
          <h2 className="font-display text-xl font-bold flex items-center gap-2">
            <ShieldCheck className="size-5 text-accent" />
            وكالات وماركات عالمية معتمدة
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            نوفر منتجات أصلية 100% مستوردة مباشرة من الشركات العالمية المعتمدة
          </p>
        </div>
        <span className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold text-primary">
          ضمان حقيقي مفحوص
        </span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {BRANDS.map((brand) => (
          <div
            key={brand.name}
            className="flex flex-col items-center justify-center rounded-2xl bg-secondary/25 p-4 text-center border border-border/40 hover:bg-secondary/50 hover:border-primary/40 transition-all duration-300 group"
          >
            <span className="font-display text-lg font-black tracking-tight text-foreground group-hover:text-primary transition-colors">
              {brand.name}
            </span>
            <span className="text-[11px] text-muted-foreground mt-1">{brand.tagline}</span>
          </div>
        ))}
      </div>
    </section>
  );
}