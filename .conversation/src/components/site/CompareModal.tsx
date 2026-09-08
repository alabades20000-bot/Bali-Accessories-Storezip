import { useQuery } from "@tanstack/react-query";
import { Scale, ShoppingCart, Trash2, ImageOff, CheckCircle, XCircle, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCT_COLUMNS } from "@/lib/products";
import { formatPrice, useCart } from "@/lib/cart";
import { useCompare } from "@/lib/compare";
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

export function CompareModal({ open, onOpenChange }: Props) {
  const { compareIds, removeCompare, clearCompare } = useCompare();
  const { add } = useCart();
  const { isShopOwner, wholesalePriceFor } = useWholesale();

  const { data: compareProducts = [], isLoading } = useQuery({
    queryKey: ["compare-products", compareIds],
    enabled: open && compareIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_COLUMNS)
        .in("id", compareIds);
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
      <DialogContent className="max-w-4xl max-h-[88vh] overflow-y-auto p-0 sm:rounded-3xl">
        <DialogHeader className="p-5 border-b border-border/60 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl sea-gradient text-primary-foreground">
              <Scale className="size-5" />
            </span>
            <div>
              <DialogTitle className="font-display text-lg font-bold">
                مقارنة المنتجات ({compareIds.length}/4)
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                قارن بين الأسعار، المواصفات، والتوفر لاختيار الأنسب لك
              </p>
            </div>
          </div>

          {compareIds.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-destructive"
              onClick={clearCompare}
            >
              إفراغ المقارنة
            </Button>
          )}
        </DialogHeader>

        <div className="p-5">
          {compareIds.length === 0 ? (
            <div className="rounded-2xl border border-border/60 bg-secondary/20 p-8 text-center">
              <Scale className="size-10 text-muted-foreground mx-auto mb-2 opacity-40" />
              <p className="font-bold text-foreground">لا توجد منتجات في المقارنة</p>
              <p className="text-xs text-muted-foreground mt-1">
                اضغط على أيقونة الميزان (المقارنة) على أي منتج لإضافته للمقارنة.
              </p>
            </div>
          ) : isLoading ? (
            <p className="text-center py-10 text-sm text-muted-foreground">جاري تجهيز جدول المقارنة…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="p-3 text-xs text-muted-foreground font-bold w-28">المنتج</th>
                    {compareProducts.map((p) => (
                      <th key={p.id} className="p-3 text-center align-top min-w-[150px]">
                        <div className="relative size-24 mx-auto rounded-xl overflow-hidden bg-secondary/30 mb-2">
                          {p.image_url ? (
                            <SmartImage
                              src={p.image_url}
                              alt={p.name}
                              width={96}
                              wrapperClassName="size-full"
                              className="size-full object-cover"
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center text-muted-foreground">
                              <ImageOff className="size-6" />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => removeCompare(p.id)}
                            className="absolute top-1 left-1 size-6 rounded-full bg-background/80 flex items-center justify-center text-muted-foreground hover:text-destructive backdrop-blur"
                            title="حذف من المقارنة"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                        <p className="font-bold text-xs line-clamp-2">{p.name}</p>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-xs">
                  {/* السعر */}
                  <tr>
                    <td className="p-3 font-bold text-muted-foreground">السعر</td>
                    {compareProducts.map((p) => {
                      const wholesalePrice = wholesalePriceFor(p.id);
                      const effectivePrice =
                        isShopOwner && wholesalePrice !== null ? wholesalePrice : Number(p.price);

                      return (
                        <td key={p.id} className="p-3 text-center">
                          <span className="font-display font-black text-sm text-primary">
                            {formatPrice(effectivePrice)} د.ع
                          </span>
                          {isShopOwner && (
                            <div className="mt-0.5">
                              <Badge variant="outline" className="border-accent text-accent text-[9px]">
                                <Store className="size-2.5 ml-0.5" />
                                جملة
                              </Badge>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* حالة التوفر */}
                  <tr>
                    <td className="p-3 font-bold text-muted-foreground">التوفر</td>
                    {compareProducts.map((p) => (
                      <td key={p.id} className="p-3 text-center">
                        {p.stock > 0 ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                            <CheckCircle className="size-3.5" /> متوفر
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-destructive font-bold">
                            <XCircle className="size-3.5" /> غير متوفر
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* الوصف والمواصفات */}
                  <tr>
                    <td className="p-3 font-bold text-muted-foreground align-top">الوصف والمواصفات</td>
                    {compareProducts.map((p) => (
                      <td key={p.id} className="p-3 text-muted-foreground text-[11px] leading-relaxed align-top">
                        {p.description || "لا توجد تفاصيل إضافية"}
                      </td>
                    ))}
                  </tr>

                  {/* زر الشراء */}
                  <tr>
                    <td className="p-3 font-bold text-muted-foreground">الشراء</td>
                    {compareProducts.map((p) => (
                      <td key={p.id} className="p-3 text-center">
                        <Button
                          size="sm"
                          disabled={p.stock <= 0}
                          onClick={() => handleAddToCart(p)}
                          className="w-full gap-1 text-xs"
                        >
                          <ShoppingCart className="size-3.5" />
                          أضف للسلة
                        </Button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}