import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ShoppingCart, ImageOff, Store, Eye, Heart, Scale, AlertTriangle, Zap, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice, useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { useCompare } from "@/lib/compare";
import { SmartImage } from "@/components/site/SmartImage";
import { useWholesale } from "@/hooks/useWholesale";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ProductDetailsModal } from "@/components/site/ProductDetailsModal";
import { QuickBuyModal } from "@/components/site/QuickBuyModal";
import { AdminQuickPriceModal } from "@/components/site/AdminQuickPriceModal";

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  wholesale_price?: number;
  old_price: number | null;
  image_url: string | null;
  open_image_url?: string | null;
  stock: number;
  featured: boolean;
  category_id: string | null;
  created_at?: string;
};

export function ProductCard({ product, index = 99 }: { product: Product; index?: number }) {
  const { add } = useCart();
  const { isAdmin } = useAuth();
  const { isShopOwner, wholesalePriceFor } = useWholesale();
  const { isFavorite, toggleFavorite } = useWishlist();
  const { isComparing, toggleCompare } = useCompare();

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [quickBuyOpen, setQuickBuyOpen] = useState(false);
  const [adminEditOpen, setAdminEditOpen] = useState(false);

  const isFav = isFavorite(product.id);
  const isComp = isComparing(product.id);

  // احتساب السعر:
  // - صاحب المحل: يرى سعر الجملة فقط wholesale_price
  // - الزبون العادي: يرى سعر المفرد فقط price
  const wholesalePrice = wholesalePriceFor(
    product.id,
    product.wholesale_price ? Number(product.wholesale_price) : null,
  );

  const displayPrice = isShopOwner
    ? (wholesalePrice !== null && wholesalePrice > 0 ? wholesalePrice : Math.round(Number(product.price) * 0.85))
    : Number(product.price);

  const [view, setView] = useState<"package" | "open">("package");
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const active = view === "open" ? product.open_image_url : product.image_url;
  const src = active ?? product.image_url;
  const hasBoth = Boolean(product.image_url && product.open_image_url);

  // نسبة الخصم للزبون العادي فقط
  const discountPercent =
    !isShopOwner && product.old_price && Number(product.old_price) > Number(product.price)
      ? Math.round(((Number(product.old_price) - Number(product.price)) / Number(product.old_price)) * 100)
      : null;

  const isLowStock = product.stock > 0 && product.stock <= 3;

  return (
    <>
      <article className="group flex flex-col overflow-hidden rounded-3xl glass-card transition-all duration-300 hover:-translate-y-1 hover:glow-shadow relative">
        {/* زر المدير السريع: يفتح فوراً نافذة تعديل سعري المفرد والجملة والمخزون بنقرة واحدة */}
        {isAdmin && (
          <div className="absolute top-2 right-2 z-20">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setAdminEditOpen(true);
              }}
              aria-label="تعديل الأسعار كمدير"
              className="flex items-center gap-1 rounded-xl bg-accent px-2.5 py-1 text-[11px] font-black text-accent-foreground shadow-lg hover:scale-105 active:scale-95 transition-transform"
            >
              <Pencil className="size-3" />
              <span>تعديل كمدير</span>
            </button>
          </div>
        )}

        <div
          className="relative aspect-square cursor-pointer overflow-hidden bg-secondary/40"
          onClick={() => setDetailsOpen(true)}
        >
          {src && !failed[src] ? (
            <SmartImage
              src={src}
              alt={view === "open" ? `${product.name} — المنتج مفتوح` : `${product.name} — البكج`}
              width={400}
              widths={[200, 300, 400, 600]}
              sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 300px"
              eager={index < 4}
              wrapperClassName="size-full"
              className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
              onFail={() => setFailed((prev) => ({ ...prev, [src]: true }))}
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <ImageOff className="size-10" />
            </div>
          )}

          {/* أزرار المفضلة والمقارنة والمعاينة */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(product.id, product.name);
              }}
              aria-label="إضافة للمفضلة"
              className={`flex size-8 items-center justify-center rounded-full backdrop-blur shadow-sm transition ${
                isFav
                  ? "bg-destructive/90 text-destructive-foreground"
                  : "bg-background/80 text-foreground hover:bg-background hover:text-destructive"
              }`}
            >
              <Heart className={`size-4 ${isFav ? "fill-current" : ""}`} />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleCompare(product.id, product.name);
              }}
              aria-label="إضافة للمقارنة"
              className={`flex size-8 items-center justify-center rounded-full backdrop-blur shadow-sm transition ${
                isComp
                  ? "bg-primary text-primary-foreground glow-shadow"
                  : "bg-background/80 text-foreground hover:bg-background hover:text-primary"
              }`}
            >
              <Scale className="size-4" />
            </button>

            <span className="flex size-8 items-center justify-center rounded-full bg-background/80 backdrop-blur text-foreground shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
              <Eye className="size-4" />
            </span>
          </div>

          {hasBoth && (
            <div
              className="absolute bottom-2 left-2 right-2 flex gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setView("package")}
                className={`flex-1 rounded-xl px-2 py-1 text-[11px] font-bold backdrop-blur transition ${view === "package" ? "bg-primary text-primary-foreground" : "bg-background/70 text-muted-foreground"}`}
              >
                صورة البكج
              </button>
              <button
                type="button"
                onClick={() => setView("open")}
                className={`flex-1 rounded-xl px-2 py-1 text-[11px] font-bold backdrop-blur transition ${view === "open" ? "bg-primary text-primary-foreground" : "bg-background/70 text-muted-foreground"}`}
              >
                المنتج مفتوح
              </button>
            </div>
          )}

          {/* شارات الخصم ونفاذ الكمية */}
          <div className="absolute top-3 right-3 flex flex-col gap-1 items-end z-10">
            {!isAdmin && discountPercent !== null && (
              <Badge className="bg-destructive text-destructive-foreground font-black text-xs px-2 py-0.5 shadow">
                خصم {discountPercent}%
              </Badge>
            )}
            {isLowStock && (
              <Badge variant="outline" className="bg-amber-500/90 text-amber-950 font-bold text-[10px] px-1.5 py-0.5 border-0 shadow">
                <AlertTriangle className="size-3 ml-0.5" />
                بقي {product.stock} فقط
              </Badge>
            )}
          </div>

          {product.stock <= 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/75 backdrop-blur-xs text-sm font-bold text-destructive">
              نفدت الكمية مؤقتاً
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4">
          <div
            className="flex items-center justify-between gap-2 cursor-pointer"
            onClick={() => setDetailsOpen(true)}
          >
            <h3 className="line-clamp-1 font-display text-lg font-bold hover:text-primary transition-colors">
              {product.name}
            </h3>
            {isShopOwner && (
              <Badge
                variant="outline"
                className="shrink-0 border-accent bg-accent/15 text-accent text-[11px] flex items-center gap-1 font-bold"
              >
                <Store className="size-3" />
                سعر جملة
              </Badge>
            )}
          </div>

          <p
            className="line-clamp-2 text-sm text-muted-foreground cursor-pointer"
            onClick={() => setDetailsOpen(true)}
          >
            {product.description}
          </p>

          <div className="mt-auto flex flex-col gap-2.5 pt-3 border-t border-border/50">
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-1.5">
                <span className={`font-display text-xl font-extrabold ${isShopOwner ? "text-accent" : "text-primary"}`}>
                  {formatPrice(displayPrice)}
                </span>
                <span className="text-xs text-muted-foreground">د.ع</span>

                {/* للزبون العادي فقط: يظهر السعر القديم إن وُجد */}
                {!isShopOwner &&
                  product.old_price &&
                  Number(product.old_price) > Number(product.price) && (
                    <span className="text-xs text-muted-foreground line-through mr-1">
                      {formatPrice(Number(product.old_price))}
                    </span>
                  )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {/* زر الشراء الفوري بنقرة واحدة */}
              <Button
                size="sm"
                variant="secondary"
                disabled={product.stock <= 0}
                onClick={(e) => {
                  e.stopPropagation();
                  setQuickBuyOpen(true);
                }}
                className="gap-1 text-xs font-bold bg-accent/15 hover:bg-accent/25 text-accent border border-accent/30"
              >
                <Zap className="size-3.5 fill-current" />
                طلب فوري
              </Button>

              {/* زر الإضافة إلى السلة */}
              <Button
                size="sm"
                disabled={product.stock <= 0}
                onClick={(e) => {
                  e.stopPropagation();
                  add({
                    id: product.id,
                    name: product.name,
                    price: displayPrice,
                    image_url: product.image_url,
                  });
                  toast.success("تمت الإضافة إلى السلة");
                }}
                className="gap-1 text-xs"
              >
                <ShoppingCart className="size-3.5" />
                أضف للسلة
              </Button>
            </div>
          </div>
        </div>
      </article>

      {/* نافذة تفاصيل المنتج للزبائن */}
      <ProductDetailsModal
        product={product}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />

      {/* نافذة الطلب الفوري بنقرة واحدة */}
      <QuickBuyModal
        product={product}
        open={quickBuyOpen}
        onOpenChange={setQuickBuyOpen}
      />

      {/* نافذة التعديل السريع للمدير لسعري المفرد والجملة والمخزون */}
      <AdminQuickPriceModal
        product={product}
        open={adminEditOpen}
        onOpenChange={setAdminEditOpen}
      />
    </>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-3xl glass-card p-10 text-center">
      <p className="font-display text-lg font-bold">{title}</p>
      {hint && <p className="mt-2 text-sm text-muted-foreground">{hint}</p>}
      <Button asChild variant="secondary" className="mt-5">
        <Link to="/">تصفح الأقسام</Link>
      </Button>
    </div>
  );
}