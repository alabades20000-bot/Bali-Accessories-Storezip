import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ShoppingCart,
  ImageOff,
  Store,
  CheckCircle,
  XCircle,
  MessageCircle,
  Share2,
  Sparkles,
  Star,
  Send,
  User,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCT_COLUMNS } from "@/lib/products";
import { formatPrice, useCart } from "@/lib/cart";
import { useWholesale } from "@/hooks/useWholesale";
import { useRecentlyViewed } from "@/lib/recently-viewed";
import { SmartImage } from "@/components/site/SmartImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import type { Product } from "@/components/site/ProductCard";

const STORE_WHATSAPP = "9647760623777";

type Props = {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type ProductReview = {
  id: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
};

export function ProductDetailsModal({ product, open, onOpenChange }: Props) {
  const { add } = useCart();
  const { isShopOwner, wholesalePriceFor } = useWholesale();
  const { addRecent } = useRecentlyViewed();
  const [selectedImage, setSelectedImage] = useState<"package" | "open">("package");
  const [qty, setQty] = useState(1);
  const [activeProduct, setActiveProduct] = useState<Product | null>(product);

  const [userRating, setUserRating] = useState(5);
  const [reviewerName, setReviewerName] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [localReviews, setLocalReviews] = useState<Record<string, ProductReview[]>>({});

  const currentProduct = activeProduct ?? product;

  useEffect(() => {
    try {
      const stored = localStorage.getItem("bali-product-reviews");
      if (stored) setLocalReviews(JSON.parse(stored));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (open && currentProduct?.id) {
      addRecent(currentProduct.id);
    }
  }, [open, currentProduct?.id, addRecent]);

  const { data: relatedProducts = [] } = useQuery({
    enabled: Boolean(currentProduct?.category_id && open),
    queryKey: ["related-products", currentProduct?.category_id, currentProduct?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_COLUMNS)
        .eq("category_id", currentProduct!.category_id!)
        .eq("is_active", true)
        .neq("id", currentProduct!.id)
        .limit(4);
      if (error) return [];
      return (data ?? []) as Product[];
    },
  });

  if (!currentProduct) return null;

  // السعر المعروض:
  // - صاحب المحل: يرى سعر الجملة فقط
  // - الزبون العادي: يرى سعر المفرد فقط
  const wholesalePrice = wholesalePriceFor(
    currentProduct.id,
    currentProduct.wholesale_price ? Number(currentProduct.wholesale_price) : null,
  );

  const effectivePrice = isShopOwner
    ? (wholesalePrice !== null && wholesalePrice > 0 ? wholesalePrice : Math.round(Number(currentProduct.price) * 0.85))
    : Number(currentProduct.price);

  const activeImage =
    selectedImage === "open" && currentProduct.open_image_url
      ? currentProduct.open_image_url
      : currentProduct.image_url;

  const productReviews = localReviews[currentProduct.id] ?? [
    {
      id: "seed-1",
      name: "حسين السامرائي",
      rating: 5,
      comment: "منتج أصلي وممتاز جداً، تجربة الشحن والتسليم كانت سريعة ومتقنة.",
      date: "قبل 3 أيام",
    },
  ];

  const avgRating =
    productReviews.length > 0
      ? (productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length).toFixed(1)
      : "5.0";

  const handleAddToCart = (itemToAdd = currentProduct, count = qty) => {
    const itemWholesale = wholesalePriceFor(
      itemToAdd.id,
      itemToAdd.wholesale_price ? Number(itemToAdd.wholesale_price) : null,
    );
    const itemPrice = isShopOwner
      ? (itemWholesale !== null && itemWholesale > 0 ? itemWholesale : Math.round(Number(itemToAdd.price) * 0.85))
      : Number(itemToAdd.price);

    add(
      {
        id: itemToAdd.id,
        name: itemToAdd.name,
        price: itemPrice,
        image_url: itemToAdd.image_url,
      },
      count,
    );
    toast.success("تمت الإضافة إلى السلة بنجاح");
    if (itemToAdd.id === currentProduct.id) {
      onOpenChange(false);
      setQty(1);
    }
  };

  const handleWhatsAppInquiry = () => {
    const text = `مرحباً، أود الاستفسار عن منتج: ${currentProduct.name} (سعره: ${formatPrice(effectivePrice)} د.ع)`;
    window.open(`https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleShareProduct = async () => {
    const shareData = {
      title: `${currentProduct.name} | Bali+`,
      text: `شاهد ${currentProduct.name} في متجر Bali+ بسعر ${formatPrice(effectivePrice)} د.ع`,
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        /* fallback */
      }
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("تم نسخ رابط المنتج للمشاركة بنجاح 📋");
    }
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim() || !reviewComment.trim()) {
      toast.error("يرجى كتابة اسمك وتعليقك حول المنتج");
      return;
    }

    const newRev: ProductReview = {
      id: crypto.randomUUID(),
      name: reviewerName.trim(),
      rating: userRating,
      comment: reviewComment.trim(),
      date: "الآن",
    };

    const updated = {
      ...localReviews,
      [currentProduct.id]: [newRev, ...(localReviews[currentProduct.id] ?? [])],
    };

    setLocalReviews(updated);
    try {
      localStorage.setItem("bali-product-reviews", JSON.stringify(updated));
    } catch {
      /* ignore */
    }

    setReviewerName("");
    setReviewComment("");
    toast.success("شكراً لك! تمت إضافة تقييمك بنجاح ⭐");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) setActiveProduct(null);
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 sm:rounded-3xl">
        <DialogHeader className="sr-only">
          <DialogTitle>{currentProduct.name}</DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* قسم الصور */}
            <div className="flex flex-col gap-3">
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-secondary/30">
                {activeImage ? (
                  <SmartImage
                    src={activeImage}
                    alt={currentProduct.name}
                    width={600}
                    wrapperClassName="size-full"
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-muted-foreground">
                    <ImageOff className="size-12" />
                  </div>
                )}
              </div>

              {currentProduct.image_url && currentProduct.open_image_url && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedImage("package")}
                    className={`rounded-xl border py-2 text-xs font-bold transition ${
                      selectedImage === "package"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/60 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    صورة الغلاف (البكج)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedImage("open")}
                    className={`rounded-xl border py-2 text-xs font-bold transition ${
                      selectedImage === "open"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/60 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    المنتج مفتوح
                  </button>
                </div>
              )}
            </div>

            {/* قسم التفاصيل */}
            <div className="flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-2xl font-black">{currentProduct.name}</h2>
                  {isShopOwner && (
                    <Badge variant="outline" className="border-accent text-accent text-xs font-bold">
                      <Store className="size-3.5 ml-1" />
                      سعر الجملة
                    </Badge>
                  )}
                </div>

                {/* التقييم ومشاركة */}
                <div className="mt-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-accent">
                    <Star className="size-4 fill-accent" />
                    <span className="font-bold text-foreground">{avgRating}</span>
                    <span className="text-muted-foreground">({productReviews.length} تقييم)</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleShareProduct}
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors p-1"
                    title="مشاركة رابط المنتج"
                  >
                    <Share2 className="size-3.5" />
                    <span>مشاركة</span>
                  </button>
                </div>

                {/* حالة التوفر */}
                <div className="mt-2 flex items-center gap-1.5 text-xs">
                  {currentProduct.stock > 0 ? (
                    <>
                      <CheckCircle className="size-4 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">متوفر في المخزن</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="size-4 text-destructive" />
                      <span className="text-destructive font-bold">نفدت الكمية مؤقتاً</span>
                    </>
                  )}
                </div>

                {/* السعر: يظهر سعر الجملة فقط لصاحب المحل وسعر المفرد فقط للزبون */}
                <div className="mt-4 flex items-baseline gap-2">
                  <span className={`font-display text-3xl font-black ${isShopOwner ? "text-accent" : "text-primary"}`}>
                    {formatPrice(effectivePrice)}
                  </span>
                  <span className="text-sm text-muted-foreground">د.ع</span>

                  {!isShopOwner &&
                    currentProduct.old_price &&
                    Number(currentProduct.old_price) > Number(currentProduct.price) && (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatPrice(Number(currentProduct.old_price))} د.ع
                      </span>
                    )}
                </div>

                {/* الوصف */}
                <div className="mt-4 border-t border-border/60 pt-4">
                  <h3 className="text-xs font-bold text-muted-foreground mb-1">
                    تفاصيل ومواصفات المنتج:
                  </h3>
                  <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
                    {currentProduct.description || "لا يوجد وصف إضافي للمنتج."}
                  </p>
                </div>
              </div>

              {/* أزرار الإضافة والكمية والاستفسار */}
              <div className="mt-6 border-t border-border/60 pt-4 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center rounded-xl border border-border/60 bg-secondary/20 p-1">
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="size-8 rounded-lg font-bold hover:bg-secondary flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="w-10 text-center font-bold text-sm">{qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty((q) => q + 1)}
                      className="size-8 rounded-lg font-bold hover:bg-secondary flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>

                  <Button
                    size="lg"
                    className="flex-1 gap-2 font-bold"
                    disabled={currentProduct.stock <= 0}
                    onClick={() => handleAddToCart()}
                  >
                    <ShoppingCart className="size-4" />
                    أضف إلى السلة
                  </Button>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5 text-xs text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                  onClick={handleWhatsAppInquiry}
                >
                  <MessageCircle className="size-3.5" />
                  استفسار فوري عن هذا المنتج عبر واتساب
                </Button>
              </div>
            </div>
          </div>

          {/* قسم التقييمات */}
          <div className="border-t border-border/60 pt-5">
            <h4 className="font-display text-base font-bold flex items-center gap-2 mb-3">
              <Star className="size-4 text-accent fill-accent" />
              آراء وتقييمات العملاء ({productReviews.length})
            </h4>

            <form onSubmit={handleSubmitReview} className="rounded-2xl bg-secondary/25 p-4 border border-border/40 space-y-3 mb-4">
              <p className="text-xs font-bold text-foreground">أضف رأيك وتقييمك حول المنتج:</p>
              
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground ml-2">تقييمك:</span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setUserRating(star)}
                    className="p-0.5 text-accent"
                  >
                    <Star
                      className={`size-5 ${
                        userRating >= star ? "fill-accent text-accent" : "text-muted-foreground/40"
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div className="grid sm:grid-cols-2 gap-2">
                <Input
                  placeholder="اسمك الكامل"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="text-xs bg-background/50"
                  required
                />
                <Input
                  placeholder="رأيك في جودة المنتج والتوصيل…"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="text-xs bg-background/50"
                  required
                />
              </div>

              <Button type="submit" size="sm" className="gap-1 text-xs">
                <Send className="size-3" />
                إرسال التقييم
              </Button>
            </form>

            <div className="space-y-2.5 max-h-48 overflow-y-auto">
              {productReviews.map((rev) => (
                <div key={rev.id} className="rounded-xl bg-secondary/20 p-3 text-xs border border-border/30">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <User className="size-3 text-primary" />
                      {rev.name}
                    </span>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} className="size-3 fill-accent text-accent" />
                      ))}
                    </div>
                  </div>
                  <p className="mt-1.5 text-muted-foreground leading-relaxed">{rev.comment}</p>
                </div>
              ))}
            </div>
          </div>

          {/* منتجات مقترحة */}
          {relatedProducts.length > 0 && (
            <div className="border-t border-border/60 pt-5">
              <h4 className="font-display text-sm font-bold flex items-center gap-1.5 mb-3 text-foreground">
                <Sparkles className="size-4 text-accent" />
                منتجات مقترحة قد تعجبك
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {relatedProducts.map((rel) => {
                  const relWholesale = wholesalePriceFor(
                    rel.id,
                    rel.wholesale_price ? Number(rel.wholesale_price) : null,
                  );
                  const relPrice = isShopOwner
                    ? (relWholesale !== null && relWholesale > 0 ? relWholesale : Math.round(Number(rel.price) * 0.85))
                    : Number(rel.price);

                  return (
                    <div
                      key={rel.id}
                      onClick={() => {
                        setActiveProduct(rel);
                        setSelectedImage("package");
                        setQty(1);
                      }}
                      className="group cursor-pointer rounded-2xl bg-secondary/25 p-2.5 border border-border/40 hover:border-primary/50 transition flex flex-col justify-between"
                    >
                      <div className="aspect-square rounded-xl overflow-hidden bg-secondary/40 mb-2">
                        {rel.image_url ? (
                          <SmartImage
                            src={rel.image_url}
                            alt={rel.name}
                            width={120}
                            wrapperClassName="size-full"
                            className="size-full object-cover group-hover:scale-105 transition"
                          />
                        ) : (
                          <div className="size-full flex items-center justify-center text-muted-foreground">
                            <ImageOff className="size-5" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-bold truncate text-foreground">{rel.name}</p>
                      <div className="mt-1 flex items-baseline justify-between">
                        <span className={`text-xs font-extrabold ${isShopOwner ? "text-accent" : "text-primary"}`}>
                          {formatPrice(relPrice)} د.ع
                        </span>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="size-6 rounded-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(rel, 1);
                          }}
                        >
                          <ShoppingCart className="size-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}