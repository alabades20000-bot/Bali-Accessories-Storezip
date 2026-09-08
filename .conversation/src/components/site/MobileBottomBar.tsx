import { Link, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import { Home, LayoutGrid, Ticket, Heart, ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CategoryIcon } from "@/components/site/CategoryIcon";
import { WishlistModal } from "@/components/site/WishlistModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const DEFAULT_CATEGORIES = [
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

export function MobileBottomBar() {
  const { count } = useCart();
  const { count: favCount } = useWishlist();
  const location = useLocation();
  const pathname = location.pathname;

  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id,name,slug,icon")
        .order("sort_order");
      if (error || !data || data.length === 0) return DEFAULT_CATEGORIES;
      return data;
    },
  });

  const categoriesList = categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 block border-t border-border/60 bg-background/85 backdrop-blur-xl md:hidden no-print">
        <div className="mx-auto flex h-16 max-w-md items-center justify-around px-2">
          {/* الرئيسية */}
          <Link
            to="/"
            className={`flex flex-col items-center gap-1 py-1 text-[11px] font-bold transition-colors ${
              pathname === "/" ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Home className="size-5" />
            <span>الرئيسية</span>
          </Link>

          {/* الأقسام */}
          <button
            type="button"
            onClick={() => setCategoriesOpen(true)}
            className={`flex flex-col items-center gap-1 py-1 text-[11px] font-bold transition-colors ${
              pathname.startsWith("/category")
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid className="size-5" />
            <span>الأقسام</span>
          </button>

          {/* عجلة الحظ */}
          <Link
            to="/wheel"
            className={`flex flex-col items-center gap-1 py-1 text-[11px] font-bold transition-colors ${
              pathname === "/wheel"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Ticket className="size-5" />
            <span>عجلة الحظ</span>
          </Link>

          {/* المفضلة */}
          <button
            type="button"
            onClick={() => setWishlistOpen(true)}
            className="relative flex flex-col items-center gap-1 py-1 text-[11px] font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <div className="relative">
              <Heart className={`size-5 ${favCount > 0 ? "text-destructive fill-destructive" : ""}`} />
              {favCount > 0 && (
                <span className="absolute -top-1.5 -right-2 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-black text-destructive-foreground">
                  {favCount}
                </span>
              )}
            </div>
            <span>المفضلة</span>
          </button>

          {/* السلة */}
          <Link
            to="/cart"
            className={`relative flex flex-col items-center gap-1 py-1 text-[11px] font-bold transition-colors ${
              pathname === "/cart" ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="relative">
              <ShoppingCart className="size-5" />
              {count > 0 && (
                <span className="absolute -top-1.5 -right-2.5 flex size-4 items-center justify-center rounded-full bg-accent text-[10px] font-black text-accent-foreground">
                  {count}
                </span>
              )}
            </div>
            <span>السلة</span>
          </Link>
        </div>
      </nav>

      {/* نافذة استعراض كافة الأقسام سريعا للهواتف */}
      <Dialog open={categoriesOpen} onOpenChange={setCategoriesOpen}>
        <DialogContent className="max-w-sm p-5 sm:rounded-3xl">
          <DialogHeader className="pb-3 border-b border-border/60">
            <DialogTitle className="font-display text-lg font-bold">أقسام المتجر</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2.5 pt-3 max-h-[60vh] overflow-y-auto">
            {categoriesList.map((c) => (
              <Link
                key={c.slug || c.id}
                to="/category/$slug"
                params={{ slug: c.slug }}
                onClick={() => setCategoriesOpen(false)}
                className="flex items-center gap-2.5 rounded-2xl border border-border/60 bg-secondary/30 p-3 text-xs font-bold hover:bg-secondary/60 transition"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl sea-gradient">
                  <CategoryIcon name={c.icon} className="size-4 text-primary-foreground" />
                </span>
                <span className="truncate">{c.name}</span>
              </Link>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* نافذة المفضلة */}
      <WishlistModal open={wishlistOpen} onOpenChange={setWishlistOpen} />
    </>
  );
}