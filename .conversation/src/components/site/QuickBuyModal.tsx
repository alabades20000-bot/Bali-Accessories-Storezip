import { useState, useMemo } from "react";
import {
  Zap,
  MessageCircle,
  Truck,
  MapPin,
  CheckCircle2,
  Printer,
  ShieldCheck,
  Store,
  ImageOff,
  Plus,
  Minus,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/cart";
import { useWholesale, useMerchantProfile } from "@/hooks/useWholesale";
import { SmartImage } from "@/components/site/SmartImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InvoiceModal, type OrderForInvoice } from "@/components/site/InvoiceModal";
import type { Product } from "@/components/site/ProductCard";

const STORE_WHATSAPP = "9647760623777";

const GOVERNORATES = [
  { name: "بغداد", fee: 4000 },
  { name: "البصرة", fee: 5000 },
  { name: "أربيل", fee: 5000 },
  { name: "النجف الأشرف", fee: 5000 },
  { name: "كربلاء المقدسة", fee: 5000 },
  { name: "نينوى (الموصل)", fee: 5000 },
  { name: "كركوك", fee: 5000 },
  { name: "السليمانية", fee: 5000 },
  { name: "دهوك", fee: 5000 },
  { name: "بابل (الحلة)", fee: 5000 },
  { name: "الأنبار", fee: 5000 },
  { name: "ديالى", fee: 5000 },
  { name: "صلاح الدين", fee: 5000 },
  { name: "واسط (الكوت)", fee: 5000 },
  { name: "ميسان (العمارة)", fee: 5000 },
  { name: "ذي قار (الناصرية)", fee: 5000 },
  { name: "المثنى (السماوة)", fee: 5000 },
  { name: "القادسية (الديوانية)", fee: 5000 },
  { name: "استلام مباشر من المتجر", fee: 0 },
];

type Props = {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function QuickBuyModal({ product, open, onOpenChange }: Props) {
  const { isShopOwner, wholesalePriceFor } = useWholesale();
  const { merchant } = useMerchantProfile();

  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState(merchant?.shop_name || merchant?.owner_name || "");
  const [phone, setPhone] = useState(merchant?.phone || "");
  const [governorate, setGovernorate] = useState("بغداد");
  const [address, setAddress] = useState(merchant?.address || "");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const [createdOrder, setCreatedOrder] = useState<OrderForInvoice | null>(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  if (!product) return null;

  const wholesalePrice = wholesalePriceFor(product.id);
  const unitPrice =
    isShopOwner && wholesalePrice !== null ? wholesalePrice : Number(product.price);

  const deliveryFee = useMemo(() => {
    const found = GOVERNORATES.find((g) => g.name === governorate);
    return found ? found.fee : 4000;
  }, [governorate]);

  const itemsTotal = unitPrice * quantity;
  const finalTotal = itemsTotal + deliveryFee;

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || phone.trim().length < 7) {
      toast.error("يرجى إدخال الاسم ورقم هاتف صالح للتواصل");
      return;
    }

    setLoading(true);
    try {
      const fullAddress = `${governorate} - ${address.trim() || "العنوان المسجل"}`;
      const noteWithShop = isShopOwner && merchant?.shop_name
        ? `[شراء فوري جملة - محل: ${merchant.shop_name}] ${note.trim()}`
        : `[شراء فوري] ${note.trim()}`;

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_name: customerName.trim().slice(0, 100),
          phone: phone.trim().slice(0, 20),
          address: fullAddress.slice(0, 300),
          note: noteWithShop.slice(0, 500) || null,
          total: finalTotal,
        })
        .select("id, order_number, created_at")
        .single();

      if (orderError) throw orderError;

      const { data: itemData, error: itemError } = await supabase
        .from("order_items")
        .insert({
          order_id: orderData.id,
          product_id: product.id,
          product_name: product.name,
          quantity: quantity,
          unit_price: unitPrice,
        })
        .select("id, product_name, quantity, unit_price");

      if (itemError) throw itemError;

      const orderForInvoiceObj: OrderForInvoice = {
        id: orderData.id,
        order_number: orderData.order_number,
        customer_name: customerName.trim(),
        phone: phone.trim(),
        address: fullAddress,
        status: "pending",
        total: finalTotal,
        note: noteWithShop,
        created_at: orderData.created_at,
        order_items: (itemData ?? []).map((it) => ({
          id: it.id,
          product_name: it.product_name,
          quantity: it.quantity,
          unit_price: Number(it.unit_price),
        })),
      };

      const deliveryFeeLabel = deliveryFee > 0 ? `${formatPrice(deliveryFee)} د.ع` : "مجاناً (استلام مباشر)";

      const lines = [
        `*طلب شراء فوري #${orderData.order_number} من Bali+*`,
        isShopOwner && merchant?.shop_name ? `المحل: ${merchant.shop_name}` : "",
        `الاسم: ${customerName.trim()}`,
        `الهاتف: ${phone.trim()}`,
        `المحافظة: ${governorate}`,
        address.trim() ? `العنوان: ${address.trim()}` : "",
        note.trim() ? `ملاحظات: ${note.trim()}` : "",
        "",
        `*المنتج:* ${product.name}`,
        `الكمية: ${quantity}`,
        `سعر المفرد: ${formatPrice(unitPrice)} د.ع`,
        `مجموع المواد: ${formatPrice(itemsTotal)} د.ع`,
        `أجور التوصيل: ${deliveryFeeLabel}`,
        `*المبلغ الإجمالي المطلوب: ${formatPrice(finalTotal)} د.ع*`,
      ].filter(Boolean);

      const waUrl = `https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(lines.join("\n"))}`;
      window.open(waUrl, "_blank", "noopener,noreferrer");

      setCreatedOrder(orderForInvoiceObj);
      toast.success("تم تأكيد طلبك السريع بنجاح!");
    } catch (err: any) {
      console.error(err);
      toast.error("تعذر إرسال الطلب السريع، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0 sm:rounded-3xl">
          <DialogHeader className="p-5 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-accent text-accent-foreground glow-shadow">
                <Zap className="size-5 fill-current" />
              </span>
              <div>
                <DialogTitle className="font-display text-lg font-bold">
                  طلب فوري بنقرة واحدة
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  أكمل طلب هذا المنتج مباشرة وادفع عند الاستلام مع المندوب
                </p>
              </div>
            </div>
          </DialogHeader>

          {createdOrder ? (
            <div className="p-6 text-center space-y-4">
              <div className="size-14 mx-auto rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center glow-shadow">
                <CheckCircle2 className="size-8" />
              </div>
              <h3 className="font-display text-xl font-bold">تم تسجيل طلبك بنجاح!</h3>
              <p className="text-xs text-muted-foreground">
                رقم فاتورتك هو{" "}
                <span className="font-bold text-foreground">#{createdOrder.order_number}</span>. سيتواصل
                معك فريق Bali+ لتأكيد التسليم.
              </p>

              <div className="rounded-2xl bg-secondary/30 p-4 text-right space-y-2 text-xs border border-border/60">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المنتج:</span>
                  <span className="font-bold">{product.name} (×{quantity})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الإجمالي مع التوصيل:</span>
                  <span className="font-bold text-primary font-display text-sm">
                    {formatPrice(finalTotal)} د.ع
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => {
                    const lines = [
                      `مرحباً، أود تأكيد الطلب الفوري #${createdOrder.order_number}`,
                      `المنتج: ${product.name} × ${quantity}`,
                      `الإجمالي: ${formatPrice(finalTotal)} د.ع`,
                    ];
                    window.open(
                      `https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(lines.join("\n"))}`,
                      "_blank",
                    );
                  }}
                >
                  <MessageCircle className="size-4" />
                  مراسلة الإدارة عبر واتساب
                </Button>

                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => setInvoiceModalOpen(true)}
                >
                  <Printer className="size-4 text-primary" />
                  معاينة وطباعة الفاتورة
                </Button>

                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => onOpenChange(false)}
                >
                  إغلاق ومتابعة التصفح
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleQuickSubmit} className="p-5 space-y-4">
              {/* ملخص المنتج */}
              <div className="flex items-center gap-3 rounded-2xl bg-secondary/30 p-3 border border-border/50">
                <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-secondary/50">
                  {product.image_url ? (
                    <SmartImage
                      src={product.image_url}
                      alt={product.name}
                      width={64}
                      wrapperClassName="size-full"
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="size-full flex items-center justify-center text-muted-foreground">
                      <ImageOff className="size-6" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-sm truncate">{product.name}</p>
                    {isShopOwner && (
                      <Badge variant="outline" className="border-accent text-accent text-[9px] shrink-0">
                        <Store className="size-2.5 ml-0.5" />
                        جملة
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="font-bold text-primary text-sm">{formatPrice(unitPrice)}</span>
                    <span className="text-[11px] text-muted-foreground">د.ع</span>
                  </div>
                </div>

                {/* التحكم بالكمية */}
                <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-card p-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="size-6 rounded-lg font-bold hover:bg-secondary flex items-center justify-center text-xs"
                  >
                    <Minus className="size-3" />
                  </button>
                  <span className="w-6 text-center font-bold text-xs">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    className="size-6 rounded-lg font-bold hover:bg-secondary flex items-center justify-center text-xs"
                  >
                    <Plus className="size-3" />
                  </button>
                </div>
              </div>

              {/* بيانات المستلم السريعة */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <Label htmlFor="qb-name" className="text-xs">
                      الاسم الكامل
                    </Label>
                    <Input
                      id="qb-name"
                      required
                      placeholder="اسم المستلم"
                      className="mt-1 h-9 text-xs"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="qb-phone" className="text-xs">
                      رقم الهاتف (واتساب)
                    </Label>
                    <Input
                      id="qb-phone"
                      required
                      dir="ltr"
                      placeholder="07xxxxxxxxx"
                      className="mt-1 h-9 text-xs"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <Label htmlFor="qb-gov" className="text-xs flex items-center gap-1">
                      <MapPin className="size-3 text-primary" />
                      المحافظة
                    </Label>
                    <Select value={governorate} onValueChange={setGovernorate}>
                      <SelectTrigger id="qb-gov" className="mt-1 h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GOVERNORATES.map((g) => (
                          <SelectItem key={g.name} value={g.name} className="text-xs">
                            {g.name} ({g.fee > 0 ? `${formatPrice(g.fee)} د.ع` : "مجاناً"})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="qb-addr" className="text-xs">
                      المنطقة / العنوان
                    </Label>
                    <Input
                      id="qb-addr"
                      placeholder="المنطقة أو أقرب نقطة دالة"
                      className="mt-1 h-9 text-xs"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="qb-note" className="text-xs">
                    ملاحظة إضافية (اختياري)
                  </Label>
                  <Input
                    id="qb-note"
                    placeholder="مثال: التوصيل مساءً، الاتصال مسبقاً…"
                    className="mt-1 h-9 text-xs"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              </div>

              {/* تفاصيل الحساب المالي */}
              <div className="rounded-2xl bg-secondary/20 p-3 space-y-1.5 text-xs border border-border/50">
                <div className="flex justify-between text-muted-foreground">
                  <span>سعر المواد ({quantity} قطعة):</span>
                  <span>{formatPrice(itemsTotal)} د.ع</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Truck className="size-3" />
                    أجور التوصيل إلى {governorate}:
                  </span>
                  <span>{deliveryFee > 0 ? `${formatPrice(deliveryFee)} د.ع` : "مجاناً"}</span>
                </div>
                <div className="flex justify-between border-t border-border/50 pt-2 font-bold text-sm text-foreground">
                  <span>المبلغ الكلي المطلوب:</span>
                  <span className="font-display text-primary text-base">
                    {formatPrice(finalTotal)} د.ع
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || product.stock <= 0}
                className="w-full gap-2 font-bold sea-gradient text-primary-foreground h-11"
              >
                <Zap className="size-4 fill-current" />
                {loading ? "جاري تجهيز الطلب…" : "تأكيد الطلب الفوري الآن"}
              </Button>

              <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                <ShieldCheck className="size-3.5 text-accent" />
                <span>الدفع نقداً عند الاستلام بعد فحص الشحنة</span>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {createdOrder && (
        <InvoiceModal
          order={createdOrder}
          open={invoiceModalOpen}
          onOpenChange={setInvoiceModalOpen}
        />
      )}
    </>
  );
}