import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ShoppingCart, ImageOff, Store, X, Eye, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCT_COLUMNS } from "@/lib/products";
import { formatPrice, useCart } from "@/lib/cart";
import { useWholesale } from "@/hooks/useWholesale";
import { SmartImage } from "@/components/site/SmartImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ProductDetailsModal } from "@/components/site/ProductDetailsModal";
import type { Product } from "@/components/site/ProductCard";

const POPULAR_TAGS = [
  "Apple",
  "Samsung",
  "Anker",
  "Joyroom",
  "Baseus",
  "Green Lion",
  "شاحن",
  "سماعة",
  "كفر",
  "لاصقة",
];

export function ProductSearchModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { add } = useCart();
  const { isShopOwner, wholesalePriceFor } = useWholesale();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["search-all-products"],
    enabled: open,
    staleTime: 120_000,
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

  const filtered = useMemo(() => {
    if (!query.trim()) return products.slice(0, 10);
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)),
    );
  }, [products, query]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden sm:rounded-3xl border-border/80">
          <DialogHeader className="p-4 pb-3 border-b border-border/60">
            <DialogTitle className="sr-only">البحث عن المنتجات</DialogTitle>
            <div className="relative flex items-center">
              <Search className="absolute right-3.5 size-5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث عن جهاز، ماركة، شاحن، سماعة، كفر…"
                className="pr-11 pl-10 h-12 text-base border-0 focus-visible:ring-0 bg-transparent"
                autoFocus
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute left-3 text-muted-foreground hover:text-foreground p-1"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            {/* وسوم وماركات سريعة */}
            <div className="mt-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
              <span className="text-muted-foreground shrink-0 flex items-center gap-1 font-bold text-[11px]">
                <Tag className="size-3" />
                شائع:
              </span>
              {POPULAR_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setQuery(tag)}
                  className={`shrink-0 rounded-xl px-2.5 py-1 font-bold transition ${
                    query === tag
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto p-4 divide-y divide-border/40">
            {isLoading ? (
              <p className="text-center py-10 text-sm text-muted-foreground">جاري تحميل المنتجات…</p>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm font-bold text-foreground">لم يتم العثور على نتائج</p>
                <p className="text-xs text-muted-foreground mt-1">
                  جرّب كتابة كلمة بحث أخرى مثل اسم الجهاز أو نوع الإكسسوار.
                </p>
              </div>
            ) : (
              filtered.map((product) => {
                const wholesalePrice = wholesalePriceFor(product.id);
                const effectivePrice =
                  isShopOwner && wholesalePrice !== null ? wholesalePrice : Number(product.price);

                return (
                  <div
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 hover:bg-secondary/20 rounded-xl px-2.5 transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-secondary/40 relative">
                        {product.image_url ? (
                          <SmartImage
                            src={product.image_url}
                            alt={product.name}
                            width={56}
                            widths={[56, 112]}
                            sizes="56px"
                            wrapperClassName="size-full"
                            className="size-full object-cover"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center text-muted-foreground">
                            <ImageOff className="size-5" />
                          </div>
                        )}
                        <span className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Eye className="size-4" />
                        </span>
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm truncate group-hover:text-primary transition-colors">
                            {product.name}
                          </p>
                          {isShopOwner && (
                            <Badge variant="outline" className="border-accent text-accent text-[10px] shrink-0">
                              <Store className="size-3 ml-0.5" />
                              جملة
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="font-bold text-primary text-sm">
                            {formatPrice(effectivePrice)}
                          </span>
                          <span className="text-[11px] text-muted-foreground">د.ع</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      disabled={product.stock <= 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        add({
                          id: product.id,
                          name: product.name,
                          price: effectivePrice,
                          image_url: product.image_url,
                        });
                        toast.success("تمت الإضافة إلى السلة");
                      }}
                      className="shrink-0 gap-1.5 text-xs"
                    >
                      <ShoppingCart className="size-3.5" />
                      أضف
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* نافذة التفاصيل والمواصفات عند النقر على المنتج */}
      <ProductDetailsModal
        product={selectedProduct}
        open={selectedProduct !== null}
        onOpenChange={(openModal) => {
          if (!openModal) setSelectedProduct(null);
        }}
      />
    </>
  );
}