import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X, CheckCircle2, SlidersHorizontal, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCT_COLUMNS } from "@/lib/products";
import { ProductCard, EmptyState, type Product } from "@/components/site/ProductCard";
import { CategoryIcon } from "@/components/site/CategoryIcon";
import { useWholesale } from "@/hooks/useWholesale";
import { Input } from "@/components/ui/input";
import { SmartImage } from "@/components/site/SmartImage";
import { categoryImage } from "@/components/site/CategoryOrbit";
import { RecentlyViewedSection } from "@/components/site/RecentlyViewedSection";

export const Route = createFileRoute("/category/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `قسم ${params.slug} | Bali+` },
      { name: "description", content: "تصفح منتجات هذا القسم في متجر Bali+ بأسعار منافسة وجودة أصلية." },
      { property: "og:title", content: `قسم ${params.slug} | Bali+` },
      { property: "og:description", content: "منتجات مختارة بعناية في متجر Bali+" },
    ],
  }),
  component: CategoryPage,
});

type SortKey = "newest" | "price-desc" | "price-asc";

type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  image_url?: string | null;
};

const DEFAULT_CATEGORIES_MAP: Record<string, { id: string; name: string; icon: string }> = {
  mobiles: { id: "mobiles", name: "موبايلات", icon: "smartphone" },
  headphones: { id: "headphones", name: "سماعات", icon: "headphones" },
  accessories: { id: "accessories", name: "إكسسوارات", icon: "sparkles" },
  "screen-protectors": { id: "screen-protectors", name: "لاصقات شاشة", icon: "shield" },
  "wireless-earbuds": { id: "wireless-earbuds", name: "إيربودز لاسلكية", icon: "ear" },
  chargers: { id: "chargers", name: "شواحن سريعة", icon: "zap" },
  cables: { id: "cables", name: "كيبلات ومحولات", icon: "cable" },
  lenses: { id: "lenses", name: "حماية وعدسات", icon: "camera" },
  "power-banks": { id: "power-banks", name: "باور بنك وشحن", icon: "battery-charging" },
  cases: { id: "cases", name: "كفرات وحماية", icon: "package" },
};

const DEFAULT_CATEGORIES_LIST: CategoryItem[] = Object.entries(DEFAULT_CATEGORIES_MAP).map(
  ([slug, data]) => ({
    id: data.id,
    name: data.name,
    slug,
    icon: data.icon,
  })
);

const BRANDS = ["Apple", "Samsung", "Anker", "Joyroom", "Baseus", "Green Lion", "WiWU", "Hoco", "Oraimo", "Xiaomi"];

function CategoryPage() {
  const { slug } = Route.useParams();
  const [sort, setSort] = useState<SortKey>("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const { isShopOwner, wholesalePriceFor } = useWholesale();

  const { data: allCategories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id,name,slug,icon,image_url")
        .order("sort_order");
      if (error || !data || data.length === 0) return DEFAULT_CATEGORIES_LIST;
      return data as CategoryItem[];
    },
  });

  const categoriesToUse = allCategories.length > 0 ? allCategories : DEFAULT_CATEGORIES_LIST;

  const { data: dbCategory, isLoading: loadingCategory } = useQuery({
    queryKey: ["category-by-slug", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id,name,icon,image_url,slug")
        .eq("slug", slug)
        .maybeSingle();
      if (error) return null;
      return data;
    },
  });

  const category = useMemo(() => {
    if (dbCategory) return dbCategory;
    const fallback = DEFAULT_CATEGORIES_MAP[slug];
    if (fallback) {
      return {
        id: fallback.id,
        name: fallback.name,
        icon: fallback.icon,
        slug,
        image_url: null,
      };
    }
    return {
      id: slug,
      name: slug,
      icon: "package",
      slug,
      image_url: null,
    };
  }, [dbCategory, slug]);

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["products-in-category", dbCategory?.id, slug],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select(PRODUCT_COLUMNS)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (dbCategory?.id) {
        query = query.eq("category_id", dbCategory.id);
      } else if (slug && !DEFAULT_CATEGORIES_MAP[slug]) {
        query = query.eq("category_id", slug);
      }

      const { data, error } = await query;
      if (error) {
        console.error("[products] query error:", error.message);
        return [];
      }
      return (data ?? []) as Product[];
    },
  });

  const isLoading = loadingCategory || loadingProducts;

  const inStockCount = useMemo(() => {
    return products.filter((p) => p.stock > 0).length;
  }, [products]);

  const availableBrands = useMemo(() => {
    return BRANDS.map((brand) => {
      const count = products.filter(
        (p) =>
          p.name.toLowerCase().includes(brand.toLowerCase()) ||
          (p.description && p.description.toLowerCase().includes(brand.toLowerCase())),
      ).length;
      return { brand, count };
    }).filter((b) => b.count > 0);
  }, [products]);

  const filteredAndSorted = useMemo(() => {
    let list = [...products];

    if (onlyInStock) {
      list = list.filter((p) => p.stock > 0);
    }

    if (selectedBrand) {
      const b = selectedBrand.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(b) ||
          (p.description && p.description.toLowerCase().includes(b)),
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)),
      );
    }

    const getPrice = (p: Product) => {
      if (isShopOwner) {
        const wp = wholesalePriceFor(p.id);
        if (wp !== null) return wp;
      }
      return Number(p.price);
    };

    if (sort === "price-desc") list.sort((a, b) => getPrice(b) - getPrice(a));
    if (sort === "price-asc") list.sort((a, b) => getPrice(a) - getPrice(b));
    return list;
  }, [products, sort, searchQuery, selectedBrand, onlyInStock, isShopOwner, wholesalePriceFor]);

  const catImg = categoryImage(slug, category?.image_url);
  const categoryTitle = category?.name || "القسم";
  const searchPlaceholderText = `ابحث في ${categoryTitle}…`;

  const emptyTitleText = useMemo(() => {
    if (searchQuery || selectedBrand) {
      return "لم يتم العثور على منتجات مطابقة لخيارات الفلترة";
    }
    if (onlyInStock) {
      return "لا توجد منتجات متوفرة في المخزن حالياً في هذا القسم";
    }
    return `لا توجد منتجات معروضة حالياً في قسم ${categoryTitle}`;
  }, [searchQuery, selectedBrand, onlyInStock, categoryTitle]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* شريط الأقسام السريع الأفقي */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
        {categoriesToUse.map((c) => {
          const isCurrent = c.slug === slug;
          return (
            <Link
              key={c.slug || c.id}
              to="/category/$slug"
              params={{ slug: c.slug }}
              className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all ${
                isCurrent
                  ? "sea-gradient text-primary-foreground glow-shadow"
                  : "glass-card text-muted-foreground hover:text-foreground"
              }`}
            >
              <CategoryIcon name={c.icon} className="size-4" />
              <span>{c.name}</span>
            </Link>
          );
        })}
      </div>

      {/* مسار الصفحة */}
      <nav className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground flex items-center gap-1">
          الرئيسية
        </Link>
        <span>/</span>
        <span className="text-foreground font-bold">{categoryTitle}</span>
      </nav>

      {/* ترويسة القسم */}
      <header className="mt-4 overflow-hidden rounded-3xl glass-card border border-border/70 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center sm:text-right">
            <div className="relative size-20 sm:size-24 shrink-0 overflow-hidden rounded-2xl ring-2 ring-primary/40 glow-shadow">
              <SmartImage
                src={catImg}
                alt={categoryTitle}
                width={120}
                widths={[96, 120, 160]}
                sizes="96px"
                wrapperClassName="size-full"
                className="size-full object-cover"
              />
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 flex size-6 items-center justify-center rounded-full sea-gradient">
                <CategoryIcon name={category?.icon ?? "package"} className="size-3 text-primary-foreground" />
              </span>
            </div>

            <div>
              <h1 className="font-display text-3xl font-black">{categoryTitle}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span>{products.length} منتج</span>
                <span>•</span>
                <span className="text-emerald-400 font-bold">{inStockCount} متوفر</span>
              </div>
            </div>
          </div>

          {/* بحث داخل القسم */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute right-3 top-3 size-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholderText}
              className="pr-9 h-11 text-xs rounded-2xl bg-card/60"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute left-3 top-3 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>

        {/* تصفية سريعة بالماركة داخل القسم إن وُجدت */}
        {availableBrands.length > 0 && (
          <div className="mt-5 border-t border-border/50 pt-4">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs">
              <span className="text-muted-foreground shrink-0 flex items-center gap-1 font-bold text-[11px]">
                <Tag className="size-3.5 text-primary" />
                الماركة:
              </span>
              <button
                type="button"
                onClick={() => setSelectedBrand(null)}
                className={`shrink-0 rounded-xl px-3 py-1 font-bold transition ${
                  selectedBrand === null
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                الكل ({products.length})
              </button>
              {availableBrands.map(({ brand, count }) => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => setSelectedBrand(selectedBrand === brand ? null : brand)}
                  className={`shrink-0 rounded-xl px-3 py-1 font-bold transition flex items-center gap-1.5 ${
                    selectedBrand === brand
                      ? "sea-gradient text-primary-foreground glow-shadow"
                      : "bg-secondary/35 text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`}
                >
                  <span>{brand}</span>
                  <span className="rounded-full bg-background/50 px-1.5 text-[10px]">{count}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* شريط أدوات الترتيب والفرز */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl glass-card p-3 border border-border/50">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
            <SlidersHorizontal className="size-3.5" />
            ترتيب حسب:
          </span>
          {(
            [
              { key: "newest", label: "الأحدث" },
              { key: "price-desc", label: "السعر: الأعلى" },
              { key: "price-asc", label: "السعر: الأقل" },
            ] as { key: SortKey; label: string }[]
          ).map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => setSort(o.key)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                sort === o.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        {/* زر التبديل للمتوفر فقط */}
        <button
          type="button"
          onClick={() => setOnlyInStock(!onlyInStock)}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition border ${
            onlyInStock
              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
              : "border-border/60 text-muted-foreground hover:text-foreground"
          }`}
        >
          <CheckCircle2 className="size-3.5" />
          <span>المتوفر في المخزن فقط</span>
        </button>
      </div>

      {/* شبكة المنتجات */}
      <div className="mt-8">
        {isLoading ? (
          <p className="text-center py-12 text-sm text-muted-foreground">جاري تحميل المنتجات…</p>
        ) : filteredAndSorted.length === 0 ? (
          <EmptyState
            title={emptyTitleText}
            hint="يمكنك تصفح باقي الأقسام أو العودة للرئيسية."
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {filteredAndSorted.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* قسم المنتجات المشاهدة مؤخراً */}
      <RecentlyViewedSection />
    </div>
  );
}