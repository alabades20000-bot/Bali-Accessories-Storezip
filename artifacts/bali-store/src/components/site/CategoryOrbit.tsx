import { Link } from "@tanstack/react-router";
import { CategoryIcon } from "@/components/site/CategoryIcon";
import { SmartImage } from "@/components/site/SmartImage";
import mobiles from "@/assets/cat-mobiles.jpg";
import headphones from "@/assets/cat-headphones.jpg";
import accessories from "@/assets/cat-accessories.jpg";
import screenProtectors from "@/assets/cat-screen-protectors.jpg";
import wirelessEarbuds from "@/assets/cat-wireless-earbuds.jpg";
import chargers from "@/assets/cat-chargers.jpg";
import cables from "@/assets/cat-cables.jpg";
import lenses from "@/assets/cat-lenses.jpg";
import powerBanks from "@/assets/cat-power-banks.jpg";
import cases from "@/assets/cat-cases.jpg";

export type OrbitCategory = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  image_url?: string | null;
};

export const categoryImages: Record<string, string> = {
  mobiles,
  headphones,
  accessories,
  "screen-protectors": screenProtectors,
  "wireless-earbuds": wirelessEarbuds,
  chargers,
  cables,
  lenses,
  "power-banks": powerBanks,
  cases,
};

export function categoryImage(slug: string, fallback?: string | null) {
  return fallback || categoryImages[slug] || mobiles;
}

function OrbitItem({ category, index = 99 }: { category: OrbitCategory; index?: number }) {
  const imgSrc = categoryImage(category.slug, category.image_url);

  return (
    <Link
      to="/category/$slug"
      params={{ slug: category.slug }}
      className="group flex w-full flex-col items-center gap-2 cursor-pointer transition-transform hover:scale-105"
    >
      <span className="relative block size-24 overflow-hidden rounded-full ring-2 ring-primary/40 transition-all duration-300 group-hover:ring-accent group-hover:glow-shadow sm:size-28">
        <SmartImage
          src={imgSrc}
          alt={category.name}
          width={160}
          widths={[112, 160, 224]}
          sizes="(max-width: 640px) 96px, 112px"
          eager={index < 4}
          wrapperClassName="size-full"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
          fallbacks={[categoryImages[category.slug] || mobiles]}
        />
        <span className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <span className="absolute bottom-2 left-1/2 flex size-7 -translate-x-1/2 items-center justify-center rounded-full sea-gradient">
          <CategoryIcon name={category.icon} className="size-4 text-primary-foreground" />
        </span>
      </span>

      <span className="max-w-[7.5rem] truncate text-center text-sm font-bold text-foreground group-hover:text-primary transition-colors">
        {category.name}
      </span>
    </Link>
  );
}

export function CategoryOrbit({ categories }: { categories: OrbitCategory[] }) {
  const count = categories.length || 1;

  return (
    <div>
      {/* Mobile / tablet: sequential grid */}
      <div className="grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4 lg:hidden">
        {categories.map((c, i) => (
          <OrbitItem key={c.slug || c.id} category={c} index={i} />
        ))}
      </div>

      {/* Desktop: circular sequence */}
      <div className="relative mx-auto hidden aspect-square w-full max-w-[680px] lg:block">
        <div className="absolute inset-[8%] rounded-full border border-primary/25" />
        <div className="absolute inset-[22%] rounded-full border border-dashed border-accent/25" />

        <div className="absolute left-1/2 top-1/2 flex size-44 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full glass-card text-center deep-shadow">
          <span className="font-display text-3xl font-black">
            Bali<span className="text-primary">+</span>
          </span>
          <span className="mt-1 px-4 text-[11px] leading-snug text-muted-foreground">
            كل الأقسام بين يديك
          </span>
        </div>

        {categories.map((c, i) => {
          const angle = (-90 + (360 / count) * i) * (Math.PI / 180);
          const r = 40; // percent of container
          const x = 50 + r * Math.cos(angle);
          const y = 50 + r * Math.sin(angle);
          return (
            <div
              key={c.slug || c.id}
              className="absolute w-32 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <OrbitItem category={c} index={i} />
            </div>
          );
        })}
      </div>
    </div>
  );
}