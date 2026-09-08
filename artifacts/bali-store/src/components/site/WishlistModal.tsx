import { useQuery } from "@tanstack/react-query";
import { Heart, ShoppingCart, Trash2, ImageOff, Store, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCT_COLUMNS } from "@/lib/products";
import { formatPrice, useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { useWholesale } from "@/hooks/useWholesale";
import { SmartImage } from "@/components/site/SmartImage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import type { Product } from "@/components/site/ProductCard";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function WishlistModal({ open, onOpenChange }: Props) {
  const { favorites, removeFavorite, clearFavorites } = useWishlist();
  const { add } = useCart();
  const { isShopOwner, wholesalePriceFor } = useWholesale();

  const { data: allProducts = [], isLoading } = useQuery({
    queryKey: ["wishlist-products", favorites],
    enabled: open && favorites.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_COLUMNS)
        .in("id", favorites);
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  const handleAddToCart = (p: Product) => {
    const wholesalePrice = wholesalePriceFor(p.id);
    const effectivePrice =
      isShopOwner && wholesalePrice !== null ? wholesalePrice : Number(p.price);

    add({
      id: p.id,
      name: p.name,
      price: effectivePrice,
      image_url: p.image_url,
    });
    toast.success("تمت الإضافة إلى السلة");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto p-0 sm:rounded-3xl">
        <DialogHeader className="p-5 border-b border-border/60 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-destructive/20 text-destructive">
              <Heart className="size-5 fill-destructive" />
            </span>
            <div>
              <DialogTitle className="font-display text-lg font-bold">
                قائمة المفضلة ({favorites.length})
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                المنتجات التي قمت بحفظها للرجوع إليها لاحقاً
              </p>
            </div>
          </div>

          {favorites.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-destructive"
              onClick={clearFavorites}
            >
              إفراغ الكل
            </Button>
          )}
        </DialogHeader>

        <div className="p-5">
          {favorites.length === 0 ? (
            <div className="rounded-2xl border border-border/60 bg-secondary/20 p-8 text-center">
              <Heart className="size-10 text-muted-foreground mx-auto mb-2 opacity-40" />
              <p className="font-bold text-foreground">قائمة المفضلة فارغة</p>
              <p className="text-xs text-muted-foreground mt-1">
                اضغط على أيقونة القلب على أي منتج لحفظه في هذه القائمة.
              </p>
            </div>
          ) : isLoading ? (
            <p className="text-center py-10 text-sm text-muted-foreground">جاري تحميل المنتجات المفضلة…</p>
          ) : (
            <div className="space-y-3">
              {allProducts.map((product) => {
                const wholesalePrice = wholesalePriceFor(product.id);
                const effectivePrice =
                  isShopOwner && wholesalePrice !== null ? wholesalePrice : Number(product.price);

                return (
                  <div
                    key={product.id}
                    className="flex items-center justify-between gap-3 rounded-2xl glass-card p-3 border border-border/60 hover:border-primary/40 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-secondary/40">
                        {product.image_url ? (
                          <SmartImage
                            src={product.image_url}
                            alt={product.name}
                            width={64}
                            widths={[64, 128]}
                            sizes="64px"
                            wrapperClassName="size-full"
                            className="size-full object-cover"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center text-muted-foreground">
                            <ImageOff className="size-5" />
                          </div>
                        )}
                      </div>

                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm truncate">{product.name}</p>
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

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        disabled={product.stock <= 0}
                        onClick={() => handleAddToCart(product)}
                        className="gap-1 text-xs"
                      >
                        <ShoppingCart className="size-3.5" />
                        أضف للسلة
                      </Button>

                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeFavorite(product.id)}
                        title="إزالة من المفضلة"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}