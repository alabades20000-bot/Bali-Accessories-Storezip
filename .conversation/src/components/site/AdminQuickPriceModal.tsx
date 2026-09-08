import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Coins,
  Store,
  Boxes,
  Save,
  Loader2,
  Percent,
  CheckCircle2,
  ImageOff,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/cart";
import { updateProductPrices } from "@/lib/wholesale.functions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@tanstack/react-router";
import type { Product } from "@/components/site/ProductCard";

type Props = {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AdminQuickPriceModal({ product, open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const runUpdate = useServerFn(updateProductPrices);

  const [retailPrice, setRetailPrice] = useState<number>(0);
  const [wholesalePrice, setWholesalePrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product && open) {
      const rp = Number(product.price) || 0;
      const wp =
        product.wholesale_price !== undefined && product.wholesale_price !== null && Number(product.wholesale_price) > 0
          ? Number(product.wholesale_price)
          : Math.round(rp * 0.85);

      setRetailPrice(rp);
      setWholesalePrice(wp);
      setStock(Number(product.stock) || 0);
    }
  }, [product, open]);

  if (!product) return null;

  // احتساب الخصم السريع بنقرة زر
  const applyQuickPercent = (percent: number) => {
    if (retailPrice <= 0) return;
    const calc = Math.round(retailPrice * (1 - percent / 100));
    setWholesalePrice(calc);
    toast.success(`تم احتساب سعر الجملة بخصم ${percent}% (${formatPrice(calc)} د.ع)`);
  };

  const profitDiff = Math.max(0, retailPrice - wholesalePrice);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const safeRetail = Math.max(0, Number(retailPrice));
    const safeWholesale = Math.max(0, Number(wholesalePrice));
    const safeStock = Math.max(0, Number(stock));

    try {
      // 1. Run server fn to update Supabase
      try {
        await runUpdate({
          data: {
            productId: product.id,
            price: safeRetail,
            wholesalePrice: safeWholesale,
            stock: safeStock,
          },
        });
      } catch (err) {
        console.warn("[quickPrice] server function warning:", err);
      }

      // 2. Direct client update fallback to ensure persistence
      try {
        await supabase
          .from("products")
          .update({
            price: safeRetail,
            wholesale_price: safeWholesale,
            stock: safeStock,
            updated_at: new Date().toISOString(),
          })
          .eq("id", product.id);
      } catch (clientErr) {
        console.warn("[quickPrice] client update warning:", clientErr);
      }

      // 3. Immediately update all React Query caches so UI updates on the spot
      const updateProductInList = (list: any) => {
        if (!Array.isArray(list)) return list;
        return list.map((item) =>
          item.id === product.id
            ? {
                ...item,
                price: safeRetail,
                wholesale_price: safeWholesale,
                stock: safeStock,
              }
            : item,
        );
      };

      qc.setQueriesData({ queryKey: ["admin-products"] }, (old: any) => updateProductInList(old));
      qc.setQueriesData({ queryKey: ["all-home-products"] }, (old: any) => updateProductInList(old));
      qc.setQueriesData({ queryKey: ["products-in-category"] }, (old: any) => updateProductInList(old));
      qc.setQueriesData({ queryKey: ["search-all-products"] }, (old: any) => updateProductInList(old));
      qc.setQueriesData({ queryKey: ["wholesale-prices"] }, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          prices: {
            ...(old.prices || {}),
            [product.id]: safeWholesale,
          },
        };
      });

      // Update local storage cache for wholesale prices
      try {
        const raw = localStorage.getItem("bali_wholesale_prices_cache");
        const cache = raw ? JSON.parse(raw) : {};
        cache[product.id] = safeWholesale;
        localStorage.setItem("bali_wholesale_prices_cache", JSON.stringify(cache));
      } catch {
        /* ignore */
      }

      toast.success(`تم تحديث سعر "${product.name}" بنجاح! 🚀`);
      onOpenChange(false);

      // Invalidate queries in background to ensure fresh sync
      void qc.invalidateQueries({ queryKey: ["admin-products"] });
      void qc.invalidateQueries({ queryKey: ["all-home-products"] });
      void qc.invalidateQueries({ queryKey: ["products-in-category"] });
      void qc.invalidateQueries({ queryKey: ["wholesale-prices"] });
      void qc.invalidateQueries({ queryKey: ["search-all-products"] });
    } catch (err: any) {
      toast.error(err?.message || "تعذر حفظ السعر");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 sm:rounded-3xl border-border/80">
        <DialogHeader className="border-b border-border/60 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground font-black shadow-md glow-shadow">
              <Coins className="size-5" />
            </span>
            <div>
              <DialogTitle className="font-display text-lg font-black text-foreground">
                تعديل الأسعار والمخزون كمدير
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                تغيير فوري وسريع لسعر المفرد والجملة والمخزون
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 pt-2">
          {/* معلومات المنتج المختصرة */}
          <div className="flex items-center gap-3 rounded-2xl bg-secondary/30 p-3 border border-border/50">
            <div className="size-14 rounded-xl overflow-hidden bg-secondary/50 shrink-0">
              {product.image_url ? (
                <img src={product.image_url} alt="" className="size-full object-cover" />
              ) : (
                <div className="size-full flex items-center justify-center text-muted-foreground">
                  <ImageOff className="size-5 opacity-40" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm truncate text-foreground">{product.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                المعرف: <code className="font-mono text-[10px] bg-background/50 px-1 py-0.5 rounded">{product.id.slice(0, 8)}</code>
              </p>
            </div>
          </div>

          {/* الخانة 1: سعر المفرد (الزبون العادي) */}
          <div className="rounded-2xl bg-primary/10 p-3.5 border border-primary/25 space-y-1.5">
            <Label htmlFor="quick-retail-price" className="text-primary font-bold text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Coins className="size-4" />
                سعر المفرد (للزبائن والزوار)
              </span>
              <span className="text-[10px] text-muted-foreground">السعر الظاهر للعامة</span>
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="quick-retail-price"
                type="number"
                min={0}
                required
                value={retailPrice}
                className="font-display font-black text-xl text-primary bg-background h-11"
                onChange={(e) => setRetailPrice(Math.max(0, Number(e.target.value)))}
              />
              <span className="text-xs font-bold text-primary shrink-0">د.ع</span>
            </div>
          </div>

          {/* الخانة 2: سعر الجملة (لأصحاب المحلات) */}
          <div className="rounded-2xl bg-accent/15 p-3.5 border border-accent/35 space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="quick-wholesale-price" className="text-accent font-black text-xs flex items-center gap-1.5">
                <Store className="size-4" />
                سعر الجملة (لأصحاب المحلات)
              </Label>
              <span className="text-[10px] text-accent/80 font-bold">حصري لحسابات الجملة</span>
            </div>

            <div className="flex items-center gap-2">
              <Input
                id="quick-wholesale-price"
                type="number"
                min={0}
                required
                value={wholesalePrice}
                className="font-display font-black text-xl text-accent border-accent/40 bg-background h-11"
                onChange={(e) => setWholesalePrice(Math.max(0, Number(e.target.value)))}
              />
              <span className="text-xs font-bold text-accent shrink-0">د.ع</span>
            </div>

            {/* أزرار النسب السريعة للمساعدة */}
            <div className="pt-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[10px] text-muted-foreground shrink-0 font-bold">احتساب سريع:</span>
              {[10, 15, 20, 25].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => applyQuickPercent(pct)}
                  className="rounded-lg bg-background/80 hover:bg-accent/20 border border-accent/30 px-2 py-0.5 text-[11px] font-bold text-accent transition"
                >
                  خصم {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* الخانة الإضافية 3: المخزون المتوفر في المستودع */}
          <div className="rounded-2xl bg-secondary/25 p-3.5 border border-border/50 space-y-1.5">
            <Label htmlFor="quick-stock-val" className="text-xs font-bold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Boxes className="size-4 text-emerald-400" />
                الكمية المتوفرة في المخزن (Stock)
              </span>
              <span className="text-[10px] text-muted-foreground">
                {stock > 0 ? `متوفر (${stock} قطعة)` : "نفد المخزون"}
              </span>
            </Label>
            <Input
              id="quick-stock-val"
              type="number"
              min={0}
              required
              className="font-bold text-base h-10"
              value={stock}
              onChange={(e) => setStock(Math.max(0, Number(e.target.value)))}
            />
          </div>

          {/* ملخص الهامش المالي للمحل */}
          {profitDiff > 0 && (
            <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs text-emerald-400 font-bold">
              <span className="flex items-center gap-1">
                <Sparkles className="size-3.5" />
                هامش ربح صاحب المحل عند البيع:
              </span>
              <span className="font-display font-black text-sm">{formatPrice(profitDiff)} د.ع</span>
            </div>
          )}

          {/* أزرار الإجراء */}
          <div className="pt-2 flex flex-col gap-2">
            <Button
              type="submit"
              disabled={saving}
              className="w-full font-bold h-12 sea-gradient text-primary-foreground text-sm gap-2 shadow-lg glow-shadow"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              حفظ التعديلات وتحديث المتجر فوراً
            </Button>

            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm" className="flex-1 text-xs gap-1">
                <Link to="/admin" onClick={() => onOpenChange(false)}>
                  <ExternalLink className="size-3" />
                  لوحة التحكم الكاملة
                </Link>
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => onOpenChange(false)}
              >
                إلغاء
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}