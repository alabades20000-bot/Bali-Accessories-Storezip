import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  Sparkles,
  Truck,
  ShieldCheck,
  Headset,
  Store,
  ArrowLeft,
  Flame,
  HelpCircle,
  Star,
  Quote,
  Search,
  TrendingUp,
  Clock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCT_COLUMNS } from "@/lib/products";
import { CategoryOrbit, type OrbitCategory } from "@/components/site/CategoryOrbit";
import { ProductCard, type Product } from "@/components/site/ProductCard";
import { BrandPartners } from "@/components/site/BrandPartners";
import { ProductSearchModal } from "@/components/site/ProductSearchModal";
import { DeviceCompatibilityTool } from "@/components/site/DeviceCompatibilityTool";
import { FlashDealsBanner } from "@/components/site/FlashDealsBanner";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import heroImage from "@/assets/hero-bali.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bali+ | متجر الموبايلات والاكسسوارات الأول" },
      {
        name: "description",
        content:
          "تسوق من Bali+ موبايلات، سماعات، اكسسوارات، لاصقات، شواحن، كيبلات، عدسات، باور بنك وكفرات بأسعار منافسة.",
      },
      { property: "og:title", content: "Bali+ | متجر الموبايلات والاكسسوارات الأول" },
      {
        property: "og:description",
        content: "أقسام متكاملة لكل مستلزمات هاتفك مع عجلة حظ يومية للخصومات وأسعار جملة خاصة للمحلات.",
      },
    ],
  }),
  component: Index,
});

type Category = OrbitCategory & { side?: string; sort_order?: number };

type ProductFilter = "all" | "featured" | "discounts" | "newest";

// الأقسام الافتراضية العشرة للضمان الكامل لظهورها في حال بطء التحميل أو تفريغ الجدول
const DEFAULT_CATEGORIES: Category[] = [
  { id: "mobiles", name: "موبايلات", slug: "mobiles", icon: "smartphone" },
  { id: "headphones", name: "سماعات", slug: "headphones", icon: "headphones" },
  { id: "accessories", name: "إكسسوارات", slug: "accessories", icon: "sparkles" },
  { id: "screen-protectors", name: "لاصقات شاشة", slug: "screen-protectors", icon: "shield" },
  { id: "wireless-earbuds", name: "إيربودز لاسلكية", slug: "wireless-earbuds", icon: "ear" },
  { id: "chargers", name: "شواحن سريعة", slug: "chargers", icon: "zap" },
  { id: "cables", name: "كيبلات ومحولات", slug: "cables", icon: "cable" },
  { id: "lenses", name: "حماية وعدسات", slug: "lenses", icon: "camera" },
  { id: "power-banks", name: "باور بنك وشحن", slug: "power-banks", icon: "battery-charging" },
  { id: "cases", name: "كفرات وحماية", slug: "cases", icon: "package" },
];

const REVIEWS = [
  {
    name: "علي الكرخي",
    city: "بغداد - الكرادة",
    role: "زبون تجزئة",
    rating: 5,
    text: "طلبت شاحن وسماعة لاسلكية ووصلتني خلال أقل من 24 ساعة، البكج أصلي ومفحوص مع ضمان حقيقي. تجربة ممتازة.",
  },
  {
    name: "متجر الفرات للهواتف",
    city: "البصرة - العشار",
    role: "صاحب محل جملة",
    rating: 5,
    text: "أسعار الجملة بعد اعتماد الحساب كانت الأفضل بالسوق، الشحن سريع جداً والتعامل راقي ومحترف. مستمر معهم أسبوعياً.",
  },
  {
    name: "محمد الحلي",
    city: "بابل - الحلة",
    role: "زبون تجزئة",
    rating: 5,
    text: "عجلة الحظ أنطتني كود خصم 15% وتطبق مباشرة بالسلة، التوصيل مع المندوب كان ممتاز والدفع عند الاستلام.",
  },
];

function Index() {
  const [activeFilter, setActiveFilter] = useState<ProductFilter>("all");
  const [searchOpen, setSearchOpen] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id,name,slug,icon,image_url,side,sort_order")
        .order("sort_order");
      if (error || !data || data.length === 0) return DEFAULT_CATEGORIES;
      return data as Category[];
    },
  });

  const displayCategories = categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  const { data: allProducts = [], isLoading } = useQuery({
    queryKey: ["all-home-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_COLUMNS)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  const filteredProducts = useMemo(() => {
    switch (activeFilter) {
      case "featured":
        return allProducts.filter((p) => p.featured);
      case "discounts":
        return allProducts.filter((p) => Number(p.old_price) > Number(p.price));
      case "newest":
        return [...allProducts].sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
      case "all":
      default:
        return allProducts;
    }
  }, [allProducts, activeFilter]);

  const discounted = useMemo(() => {
    return allProducts.filter((p) => Number(p.old_price) > Number(p.price));
  }, [allProducts]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      {/* Hero */}
      <section className="overflow-hidden rounded-4xl glass-card deep-shadow">
        <div className="relative">
          <img
            src={heroImage}
            alt="واجهة متجر Bali+ البحرية للموبايلات والاكسسوارات"
            width={1600}
            height={900}
            fetchPriority="high"
            decoding="async"
            className="h-56 w-full object-cover sm:h-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
        </div>
        <div className="relative z-10 -mt-10 px-6 pb-8 text-center">
          <h1 className="font-display text-4xl font-black tracking-tight sm:text-5xl">
            Bali<span className="text-primary">+</span>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
            وجهتك البحرية لكل ما يخص الموبايل — منتجات أصلية، توصيل سريع، وخصومات يومية عبر عجلة
            الحظ.
          </p>

          {/* شريط البحث المباشر في Hero */}
          <div className="mx-auto mt-6 max-w-lg">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex w-full items-center justify-between rounded-2xl border border-primary/30 bg-secondary/60 px-4 py-3 text-sm text-muted-foreground shadow-inner backdrop-blur hover:border-primary/60 hover:text-foreground transition"
            >
              <span className="flex items-center gap-2">
                <Search className="size-4 text-primary" />
                <span>ابحث عن موبايل، شاحن، سماعة، كفر…</span>
              </span>
              <span className="rounded-lg bg-primary/20 px-2 py-0.5 text-xs font-bold text-primary">
                بحث فوري
              </span>
            </button>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/wheel">
                <Sparkles className="size-4" />
                جرّب عجلة الحظ
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <a href="#featured">تسوق الآن</a>
            </Button>
          </div>
        </div>
      </section>

      {/* شريط العروض الفلاشية والعد التنازلي */}
      <FlashDealsBanner />

      {/* Circular categories */}
      <section className="mt-12" id="categories">
        <h2 className="text-center font-display text-2xl font-extrabold">تسوّق حسب القسم</h2>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          عشرة أقسام مرتبة بشكل دائري متسلسل
        </p>
        <div className="mt-8">
          <CategoryOrbit categories={displayCategories} />
        </div>
      </section>

      {/* قسم العروض والتخفيضات إن وجدت */}
      {discounted.length > 0 && (
        <section className="mt-14 rounded-3xl border border-primary/20 bg-gradient-to-b from-primary/5 via-card/40 to-transparent p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-destructive text-destructive-foreground">
                <Flame className="size-5" />
              </span>
              <div>
                <h2 className="font-display text-2xl font-black text-foreground">
                  تخفيضات وعروض حصرية
                </h2>
                <p className="text-xs text-muted-foreground">
                  أفضل الأسعار المنافسة لفترة محدودة
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveFilter("discounts");
                document.getElementById("featured")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              عرض الكل ({discounted.length})
            </Button>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {discounted.slice(0, 4).map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Perks */}
      <section className="mt-12 grid gap-4 sm:grid-cols-3">
        {[
          { icon: Truck, title: "توصيل لكل المحافظات", text: "خلال 24 إلى 72 ساعة" },
          { icon: ShieldCheck, title: "ضمان أصلي", text: "منتجات مفحوصة ومضمونة" },
          { icon: Headset, title: "دعم مستمر", text: "نجاوبك على مدار اليوم" },
        ].map((p) => (
          <div key={p.title} className="flex items-center gap-3 rounded-2xl glass-card p-4">
            <p.icon className="size-6 text-accent" />
            <div>
              <p className="font-bold">{p.title}</p>
              <p className="text-xs text-muted-foreground">{p.text}</p>
            </div>
          </div>
        ))}
      </section>

      {/* أداة التوافق الذكية للأجهزة والشواحن */}
      <DeviceCompatibilityTool />

      {/* بنر مخصص لأصحاب المحلات وتجار الجملة */}
      <section className="mt-14 overflow-hidden rounded-3xl border border-accent/40 bg-gradient-to-r from-card via-secondary/40 to-card p-6 sm:p-8 glow-shadow">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl sea-gradient glow-shadow">
              <Store className="size-7 text-primary-foreground" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-accent uppercase tracking-wider">
                  قسم تجار الجملة
                </span>
                <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent">
                  أسعار خاصة
                </span>
              </div>
              <h3 className="font-display text-2xl font-black mt-1">
                هل تمتلك محلاً أو متجراً للموبايلات؟
              </h3>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-xl leading-relaxed">
                انضم لشبكة تجار Bali+ المعتمدين لتفعيل أسعار الجملة التنافسية على كافة المنتجات مباشرة من لوحة حسابك مع شحن سريع لمحافظتك.
              </p>
            </div>
          </div>

          <Button asChild size="lg" className="shrink-0 gap-2">
            <Link to="/auth">
              تسجيل حساب صاحب محل
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Brand Partners */}
      <BrandPartners />

      {/* Featured Products مع أزرار الفلترة السريعة */}
      <section id="featured" className="mt-16">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div>
            <h2 className="font-display text-2xl font-black">منتجات Bali+</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              تصفح المنتجات المتوفرة مع إمكانية الفرز حسب الأفضلية
            </p>
          </div>

          {/* أزرار الفلترة السريعة */}
          <div className="flex flex-wrap gap-1.5 bg-secondary/30 p-1.5 rounded-2xl border border-border/50">
            {[
              { key: "all", label: "الكل", icon: Sparkles },
              { key: "featured", label: "الأكثر طلباً", icon: TrendingUp },
              { key: "discounts", label: "تخفيضات", icon: Flame },
              { key: "newest", label: "وصل حديثاً", icon: Clock },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveFilter(key as ProductFilter)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  activeFilter === key
                    ? "sea-gradient text-primary-foreground glow-shadow"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                }`}
              >
                <Icon className="size-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <p className="mt-6 text-center text-sm text-muted-foreground py-10">جاري تحميل المنتجات…</p>
        ) : filteredProducts.length === 0 ? (
          <p className="mt-6 rounded-2xl glass-card p-8 text-center text-sm text-muted-foreground">
            لا توجد منتجات مطابقة لهذا التصنيف حالياً.
          </p>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {filteredProducts.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* قسم آراء الزبائن وأصحاب المحلات */}
      <section className="mt-16">
        <div className="text-center">
          <h2 className="font-display text-2xl font-black">ماذا يقول عملاؤنا؟</h2>
          <p className="text-xs text-muted-foreground mt-1">
            تجارب حقيقية من زبائن وأصحاب محلات يتعاملون معنا يومياً
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {REVIEWS.map((r) => (
            <div key={r.name} className="rounded-3xl glass-card p-6 flex flex-col justify-between border border-border/60">
              <div>
                <div className="flex items-center justify-between text-accent mb-3">
                  <div className="flex gap-1">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="size-4 fill-accent text-accent" />
                    ))}
                  </div>
                  <Quote className="size-5 opacity-40 text-muted-foreground" />
                </div>
                <p className="text-sm leading-relaxed text-foreground">{r.text}</p>
              </div>

              <div className="mt-5 border-t border-border/50 pt-3">
                <p className="font-bold text-sm">{r.name}</p>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-0.5">
                  <span>{r.city}</span>
                  <span className="text-primary font-bold">{r.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* قسم الأسئلة الشائعة */}
      <section className="mt-16 rounded-3xl glass-card p-6 sm:p-10 border border-border/70">
        <div className="flex items-center gap-2.5 mb-6">
          <span className="flex size-10 items-center justify-center rounded-2xl sea-gradient">
            <HelpCircle className="size-5 text-primary-foreground" />
          </span>
          <div>
            <h2 className="font-display text-2xl font-black">الأسئلة الشائعة</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              كل ما تحتاج معرفته عن الطلب والشحن والضمان في Bali+
            </p>
          </div>
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="faq-1">
            <AccordionTrigger className="text-right font-bold text-sm sm:text-base">
              كم تستغرق مدة توصيل الطلبات إلى محافظتي؟
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
              تصل الطلبات داخل بغداد خلال 24 ساعة، وإلى باقي محافظات العراق كافة خلال 48 إلى 72 ساعة كحد أقصى عبر مندوبي التوصيل المعتمدين لدينا.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-2">
            <AccordionTrigger className="text-right font-bold text-sm sm:text-base">
              ما هي طريقة الدفع المتاحة؟
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
              نوفر خدمة الدفع نقداً عند الاستلام مباشرة للمندوب بعد استلام شحنتك وفحصها والتأكد من سلامة البكج.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-3">
            <AccordionTrigger className="text-right font-bold text-sm sm:text-base">
              كيف أستفيد من عجلة الحظ وأكواد الخصم؟
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
              يمكنك الدخول لصفحة عجلة الحظ وتدويرها لربح كود خصم فوري يطبق تلقائياً على سلة مشترياتك قبل إتمام الطلب.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-4">
            <AccordionTrigger className="text-right font-bold text-sm sm:text-base">
              كيف يحصل أصحاب المحلات على أسعار الجملة؟
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
              بإمكانك التسجيل من صفحة "بوابة أصحاب المحلات" وتعبئة اسم المحل وبيانات التواصل. فور اعتماد الحساب من الإدارة ستتحول جميع أسعار المنتجات في المتجر إلى أسعار الجملة مباشرة وبشكل آلي.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <ProductSearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}