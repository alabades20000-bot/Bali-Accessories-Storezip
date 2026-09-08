import { useQuery } from "@tanstack/react-query";
import { History, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCT_COLUMNS } from "@/lib/products";
import { useRecentlyViewed } from "@/lib/recently-viewed";
import { ProductCard, type Product } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/button";

export function RecentlyViewedSection() {
  const { recentIds, clearRecent } = useRecentlyViewed();

  const { data: recentProducts = [] } = useQuery({
    queryKey: ["recently-viewed-products", recentIds],
    enabled: recentIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_COLUMNS)
        .in("id", recentIds)
        .eq("is_active", true);
      if (error) return [];
      
      const map = new Map((data ?? []).map((p) => [p.id, p as Product]));
      return recentIds.map((id) => map.get(id)).filter(Boolean) as Product[];
    },
  });

  if (recentProducts.length === 0) return null;

  return (
    <section className="mt-16 border-t border-border/60 pt-10">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <History className="size-4" />
          </span>
          <div>
            <h3 className="font-display text-xl font-bold">شاهدتها مؤخراً</h3>
            <p className="text-xs text-muted-foreground">المنتجات التي قمت بتصفحها أثناء زيارتك</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground hover:text-destructive"
          onClick={clearRecent}
        >
          <Trash2 className="size-3.5 ml-1" />
          مسح السجل
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {recentProducts.slice(0, 4).map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>
    </section>
  );
}