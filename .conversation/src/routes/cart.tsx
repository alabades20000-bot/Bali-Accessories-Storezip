import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import {
  Trash2,
  Minus,
  Plus,
  ImageOff,
  MessageCircle,
  Phone,
  Store,
  Tag,
  Check,
  Loader2,
  CheckCircle2,
  Receipt,
  Truck,
  MapPin,
  Printer,
  ShieldCheck,
  Clock,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, useCart } from "@/lib/cart";
import { useWholesale, useMerchantProfile } from "@/hooks/useWholesale";
import { verifyDiscountCode } from "@/lib/wheel.functions";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/site/ProductCard";
import { SmartImage } from "@/components/site/SmartImage";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { OrderTrackingModal } from "@/components/site/OrderTrackingModal";
import { InvoiceModal, type OrderForInvoice } from "@/components/site/InvoiceModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STORE_WHATSAPP = "9647760623777";
const STORE_PHONE_DISPLAY = "07760623777";
const FREE_SHIPPING_THRESHOLD = 50000;

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

const NOTE_PRESETS = [
  "يرجى الاتصال قبل التوصيل بنصف ساعة",
  "التوصيل في الفترة المسائية",
  "يرجى فحص البكج مع المندوب",
  "عنوان العمل (يرجى التسليم قبل 3 عصراً)",
];

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "سلة التسوق | Bali+" },
      { name: "description", content: "راجع مشترياتك وأكمل الطلب بسهولة من متجر Bali+." },
      { property: "og:title", content: "سلة التسوق | Bali+" },
      { property: "og:description", content: "أكمل طلبك من متجر Bali+ خلال دقيقة." },
    ],
  }),
  component: CartPage,
});

type SuccessOrderInfo = {
  orderNumber: number;
  total: number;
  waUrl: string;
  customerName: string;
  phone: string;
  summaryText: string;
  fullOrder: OrderForInvoice;
};

function CartPage() {
  const { items, setQty, remove, clear, total, syncPrices } = useCart();
  const { isShopOwner, wholesalePriceFor } = useWholesale();
  const { merchant } = useMerchantProfile();
  const navigate = useNavigate();
  const runVerifyDiscount = useServerFn(verifyDiscountCode);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    governorate: "بغداد",
    address: "",
    note: "",
    code: "",
  });
  const [saving, setSaving] = useState(false);
  const [checkingCode, setCheckingCode] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<{ percent: number; label?: string } | null>(null);

  const [successOrder, setSuccessOrder] = useState<SuccessOrderInfo | null>(null);
  const [trackModalOpen, setTrackModalOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  useEffect(() => {
    try {
      const savedCode = sessionStorage.getItem("active_discount_code");
      if (savedCode && !form.code) {
        setForm((prev) => ({ ...prev, code: savedCode }));
        void handleApplyCode(savedCode);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (merchant && isShopOwner) {
      setForm((prev) => ({
        ...prev,
        name: prev.name || merchant.shop_name || merchant.owner_name,
        phone: prev.phone || merchant.phone,
        address: prev.address || merchant.address,
      }));
    }
  }, [merchant, isShopOwner]);

  // مزامنة فورية للأسعار داخل السلة عند تسجيل الدخول أو الخروج كصاحب محل
  useEffect(() => {
    if (items.length === 0) return;
    if (isShopOwner) {
      syncPrices((id) => wholesalePriceFor(id));
    }
  }, [isShopOwner, items.length, syncPrices, wholesalePriceFor]);

  const isFreeDeliveryQualified = total >= FREE_SHIPPING_THRESHOLD && form.governorate !== "استلام مباشر من المتجر";

  const deliveryFee = useMemo(() => {
    if (form.governorate === "استلام مباشر من المتجر") return 0;
    if (isFreeDeliveryQualified) return 0;
    const found = GOVERNORATES.find((g) => g.name === form.governorate);
    return found ? found.fee : 4000;
  }, [form.governorate, isFreeDeliveryQualified]);

  const handleApplyCode = async (codeToVerify?: string) => {
    const code = (codeToVerify ?? form.code).trim();
    if (!code) {
      toast.error("يرجى كتابة كود الخصم أولاً");
      return;
    }
    setCheckingCode(true);
    try {
      const res = await runVerifyDiscount({ data: { code } });
      if (res.valid && res.discountPercent > 0) {
        setAppliedDiscount({ percent: res.discountPercent, label: res.label });
        toast.success(`تم تطبيق خصم ${res.discountPercent}% بنجاح! 🎉`);
      } else {
        setAppliedDiscount(null);
        toast.error("كود الخصم غير صالح أو منتهي الصلاحية");
      }
    } catch {
      toast.error("تعذر التحقق من كود الخصم");
    } finally {
      setCheckingCode(false);
    }
  };

  const discountAmount = useMemo(() => {
    if (!appliedDiscount || appliedDiscount.percent <= 0) return 0;
    return Math.round((total * appliedDiscount.percent) / 100);
  }, [total, appliedDiscount]);

  const finalTotal = Math.max(0, total - discountAmount) + deliveryFee;

  const handleAddNotePreset = (preset: string) => {
    setForm((prev) => ({
      ...prev,
      note: prev.note ? `${prev.note} - ${preset}` : preset,
    }));
  };

  const submit = async () => {
    if (!form.name.trim() || form.phone.trim().length < 7) {
      toast.error("الرجاء إدخال الاسم ورقم هاتف صحيح");
      return;
    }
    if (items.length === 0) return;
    setSaving(true);
    try {
      const fullAddress = `${form.governorate} - ${form.address.trim()}`;
      const noteWithShop = isShopOwner && merchant?.shop_name
        ? `[طلب جملة - محل: ${merchant.shop_name}] ${form.note.trim()}`
        : form.note.trim();

      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          customer_name: form.name.trim().slice(0, 100),
          phone: form.phone.trim().slice(0, 20),
          address: fullAddress.slice(0, 300),
          note: noteWithShop.slice(0, 500) || null,
          discount_code: appliedDiscount ? form.code.trim().toUpperCase().slice(0, 30) : null,
          total: finalTotal,
        })
        .select("id, order_number, created_at")
        .single();
      if (error) throw error;

      const orderItemsPayload = items.map((i) => ({
        order_id: order.id,
        product_id: i.id,
        product_name: i.name,
        unit_price: i.price,
        quantity: i.quantity,
      }));

      const { data: insertedItems, error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItemsPayload)
        .select("id, product_name, quantity, unit_price");

      if (itemsError) throw itemsError;

      const headerTitle = isShopOwner && merchant?.shop_name
        ? `*طلب جملة جديد #${order.order_number} من متجر ${merchant.shop_name}*`
        : `*طلب جديد #${order.order_number} من Bali+*`;

      const deliveryFeeText = deliveryFee > 0
        ? `${formatPrice(deliveryFee)} د.ع`
        : isFreeDeliveryQualified
          ? "مجاناً (عرض الطلبات فوق 50,000 د.ع)"
          : "مجاناً (استلام مباشر)";

      const lines = [
        headerTitle,
        isShopOwner && merchant?.shop_name ? `المحل: ${merchant.shop_name}` : "",
        `الاسم: ${form.name.trim()}`,
        `الهاتف: ${form.phone.trim()}`,
        `المحافظة: ${form.governorate}`,
        form.address.trim() ? `العنوان التفصيلي: ${form.address.trim()}` : "",
        appliedDiscount ? `كود الخصم: ${form.code.trim().toUpperCase()} (خصم ${appliedDiscount.percent}%)` : "",
        form.note.trim() ? `ملاحظات: ${form.note.trim()}` : "",
        "",
        "*المنتجات:*",
        ...items.map((i) => `• ${i.name} × ${i.quantity} = ${formatPrice(i.price * i.quantity)} د.ع`),
        "",
        appliedDiscount ? `المجموع قبل الخصم: ${formatPrice(total)} د.ع` : "",
        appliedDiscount ? `قيمة الخصم: -${formatPrice(discountAmount)} د.ع` : "",
        `أجور التوصيل: ${deliveryFeeText}`,
        `*الإجمالي النهائي المطلوب: ${formatPrice(finalTotal)} د.ع*`,
      ].filter(Boolean);

      const summaryText = lines.join("\n");
      const waUrl = `https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(summaryText)}`;
      window.open(waUrl, "_blank", "noopener,noreferrer");

      const fullOrderObj: OrderForInvoice = {
        id: order.id,
        order_number: order.order_number,
        customer_name: form.name.trim(),
        phone: form.phone.trim(),
        address: fullAddress,
        status: "pending",
        total: finalTotal,
        discount_code: appliedDiscount ? form.code.trim().toUpperCase() : null,
        note: noteWithShop || null,
        created_at: order.created_at,
        order_items: (insertedItems ?? []).map((it) => ({
          id: it.id,
          product_name: it.product_name,
          quantity: it.quantity,
          unit_price: Number(it.unit_price),
        })),
      };

      clear();
      try {
        sessionStorage.removeItem("active_discount_code");
      } catch {
        /* ignore */
      }

      setSuccessOrder({
        orderNumber: order.order_number,
        total: finalTotal,
        waUrl,
        customerName: form.name.trim(),
        phone: form.phone.trim(),
        summaryText,
        fullOrder: fullOrderObj,
      });
      toast.success("تم تسجيل طلبك بنجاح!");
    } catch (e) {
      console.error(e);
      toast.error("تعذر إرسال الطلب، حاول مرة أخرى");
    } finally {
      setSaving(false);
    }
  };

  if (items.length === 0 && !successOrder) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState title="سلتك فارغة" hint="أضف بعض المنتجات ثم عد لإتمام الطلب." />
      </div>
    );
  }

  const freeShippingProgress = Math.min(100, Math.round((total / FREE_SHIPPING_THRESHOLD) * 100));
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - total);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-black">سلة التسوق</h1>
        {isShopOwner && (
          <Badge variant="outline" className="border-accent bg-accent/15 text-accent flex items-center gap-1.5 py-1 px-3 font-bold">
            <Store className="size-4" />
            طلب بأسعار الجملة
          </Badge>
        )}
      </div>

      {/* شريط الشحن المجاني التفاعلي */}
      <div className="mt-6 rounded-3xl border border-primary/30 bg-secondary/30 p-4 glow-shadow">
        <div className="flex items-center justify-between text-xs font-bold mb-2">
          <span className="flex items-center gap-1.5 text-foreground">
            <Truck className="size-4 text-primary" />
            {isFreeDeliveryQualified ? (
              <span className="text-emerald-400">🎉 مبروك! حصلت على توصيل مجاني لطلبك</span>
            ) : (
              <span>
                أضف منتجات بقيمة <span className="text-primary font-black">{formatPrice(remainingForFreeShipping)} د.ع</span> إضافية للحصول على توصيل مجاني!
              </span>
            )}
          </span>
          <span className="text-primary">{freeShippingProgress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary/80">
          <div
            className="h-full rounded-full sea-gradient transition-all duration-500"
            style={{ width: `${freeShippingProgress}%` }}
          />
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-4">
          {items.map((i) => (
            <div key={i.id} className="flex items-center gap-4 rounded-2xl glass-card p-3">
              <div className="size-20 overflow-hidden rounded-xl bg-secondary/40">
                {i.image_url ? (
                  <SmartImage
                    src={i.image_url}
                    alt={i.name}
                    width={80}
                    widths={[80, 160]}
                    sizes="80px"
                    eager
                    wrapperClassName="size-full"
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-muted-foreground">
                    <ImageOff className="size-6" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="font-bold">{i.name}</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-primary font-bold">{formatPrice(i.price)} د.ع</p>
                  {isShopOwner && (
                    <span className="text-[10px] text-accent font-bold bg-accent/15 px-1.5 py-0.5 rounded">
                      جملة
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="secondary" onClick={() => setQty(i.id, i.quantity - 1)}>
                  <Minus className="size-4" />
                </Button>
                <span className="w-8 text-center font-bold">{i.quantity}</span>
                <Button size="icon" variant="secondary" onClick={() => setQty(i.id, i.quantity + 1)}>
                  <Plus className="size-4" />
                </Button>
              </div>
              <Button size="icon" variant="ghost" onClick={() => remove(i.id)}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          ))}
          {items.length > 0 && (
            <Button variant="ghost" className="self-start" onClick={clear}>
              إفراغ السلة
            </Button>
          )}

          {/* شريط الضمانات والتأكيد في السلة */}
          <div className="mt-2 grid grid-cols-3 gap-3 rounded-2xl bg-secondary/20 p-4 border border-border/50 text-center">
            <div className="flex flex-col items-center gap-1">
              <ShieldCheck className="size-5 text-accent" />
              <span className="text-xs font-bold text-foreground">فحص وضمان أصلي</span>
              <span className="text-[10px] text-muted-foreground">فحص كامل قبل التسليم</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Truck className="size-5 text-primary" />
              <span className="text-xs font-bold text-foreground">توصيل لباب بيتك</span>
              <span className="text-[10px] text-muted-foreground">خلال 24-72 ساعة</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Clock className="size-5 text-emerald-400" />
              <span className="text-xs font-bold text-foreground">دفع عند الاستلام</span>
              <span className="text-[10px] text-muted-foreground">ادفع بعد فحص الطلب</span>
            </div>
          </div>
        </div>

        <div className="h-fit rounded-3xl glass-card p-5">
          <h2 className="font-display text-xl font-bold">معلومات التوصيل</h2>
          <div className="mt-4 flex flex-col gap-3">
            <div>
              <Label htmlFor="name">
                {isShopOwner ? "اسم المحل أو المستلم" : "الاسم الكامل"}
              </Label>
              <Input
                id="name"
                value={form.name}
                maxLength={100}
                placeholder="الاسم الثلاثي"
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="phone">رقم الهاتف (واتساب)</Label>
              <Input
                id="phone"
                inputMode="tel"
                placeholder="07xxxxxxxxx"
                value={form.phone}
                maxLength={20}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="gov" className="flex items-center gap-1">
                <MapPin className="size-3.5 text-primary" />
                المحافظة
              </Label>
              <Select
                value={form.governorate}
                onValueChange={(v) => setForm({ ...form, governorate: v })}
              >
                <SelectTrigger id="gov" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GOVERNORATES.map((g) => (
                    <SelectItem key={g.name} value={g.name}>
                      <div className="flex items-center justify-between gap-4 w-full">
                        <span>{g.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {isFreeDeliveryQualified && g.fee > 0
                            ? "(شحن مجاني 🔥)"
                            : g.fee > 0
                              ? `(${formatPrice(g.fee)} د.ع)`
                              : "(استلام مجاني)"}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="address">العنوان التفصيلي</Label>
              <Input
                id="address"
                placeholder="المنطقة - أقرب نقطة دالة"
                value={form.address}
                maxLength={300}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="code" className="flex items-center gap-1.5">
                <Tag className="size-3.5 text-accent" />
                كود الخصم (من عجلة الحظ)
              </Label>
              <div className="mt-1 flex gap-2">
                <Input
                  id="code"
                  dir="ltr"
                  placeholder="مثال: BALI10"
                  value={form.code}
                  maxLength={30}
                  className="uppercase font-mono font-bold"
                  onChange={(e) => {
                    setForm({ ...form, code: e.target.value });
                    if (appliedDiscount) setAppliedDiscount(null);
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  disabled={checkingCode || !form.code.trim()}
                  onClick={() => handleApplyCode()}
                  className="shrink-0"
                >
                  {checkingCode ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : appliedDiscount ? (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <Check className="size-4" /> تم
                    </span>
                  ) : (
                    "تطبيق"
                  )}
                </Button>
              </div>
              {appliedDiscount && (
                <p className="mt-1 text-xs font-bold text-emerald-400">
                  ✓ تم تطبيق خصم {appliedDiscount.percent}% ({appliedDiscount.label})
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="note">ملاحظات إضافية (اختياري)</Label>
              <Textarea
                id="note"
                rows={2}
                value={form.note}
                maxLength={500}
                placeholder="أي توضيحات أو وقت مفضل للتوصيل…"
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
              {/* عبارات جاهزة بنقرة واحدة */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {NOTE_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleAddNotePreset(preset)}
                    className="rounded-lg border border-border/50 bg-secondary/30 px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 border-t border-border/60 pt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>مجموع المنتجات:</span>
              <span>{formatPrice(total)} د.ع</span>
            </div>

            {appliedDiscount && (
              <div className="flex items-center justify-between text-emerald-400 font-bold">
                <span>خصم الكود ({appliedDiscount.percent}%):</span>
                <span>-{formatPrice(discountAmount)} د.ع</span>
              </div>
            )}

            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-1">
                <Truck className="size-3.5" />
                أجور التوصيل ({form.governorate}):
              </span>
              <span className={`font-bold ${isFreeDeliveryQualified ? "text-emerald-400" : "text-foreground"}`}>
                {isFreeDeliveryQualified
                  ? "مجاناً (عرض التوصيل المجاني)"
                  : deliveryFee > 0
                    ? `${formatPrice(deliveryFee)} د.ع`
                    : "مجاناً"}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-border/60 pt-2">
              <span className="font-bold text-base">المبلغ الإجمالي النهائي:</span>
              <span className="font-display text-2xl font-black text-primary">
                {formatPrice(finalTotal)} د.ع
              </span>
            </div>
          </div>

          <Button className="mt-4 w-full" size="lg" disabled={saving || items.length === 0} onClick={submit}>
            <MessageCircle className="size-5" />
            {saving ? "جاري الإرسال…" : "تأكيد الطلب عبر واتساب"}
          </Button>
          <a
            href={`tel:+964${STORE_PHONE_DISPLAY.slice(1)}`}
            className="mt-3 flex items-center justify-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary"
            dir="ltr"
          >
            <Phone className="size-4" />
            {STORE_PHONE_DISPLAY}
          </a>
          <Button asChild variant="ghost" className="mt-2 w-full">
            <Link to="/">متابعة التسوق</Link>
          </Button>
        </div>
      </div>

      {/* نافذة نجاح الطلب والتأكيد */}
      <Dialog
        open={successOrder !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSuccessOrder(null);
            void navigate({ to: "/" });
          }
        }}
      >
        <DialogContent className="sm:max-w-md text-center p-6 sm:rounded-3xl">
          <DialogHeader className="sr-only">
            <DialogTitle>تم تأكيد الطلب بنجاح</DialogTitle>
          </DialogHeader>

          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 glow-shadow">
            <CheckCircle2 className="size-9" />
          </div>

          <h2 className="font-display text-2xl font-black mt-3">شكراً لطلبك من Bali+</h2>
          <p className="text-sm text-muted-foreground mt-1">
            مرحباً {successOrder?.customerName}، تم تسجيل طلبك بنجاح وسيتواصل معك فريقنا خلال وقت قصير.
          </p>

          <div className="mt-4 rounded-2xl bg-secondary/30 p-4 text-right space-y-2 border border-border/60">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Receipt className="size-4 text-accent" />
                رقم الفاتورة:
              </span>
              <span className="font-display font-black text-foreground">
                #{successOrder?.orderNumber}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">المبلغ الإجمالي مع الشحن:</span>
              <span className="font-display font-black text-primary text-base">
                {formatPrice(successOrder?.total ?? 0)} د.ع
              </span>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2">
            <Button
              className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => {
                if (successOrder?.waUrl) {
                  window.open(successOrder.waUrl, "_blank", "noopener,noreferrer");
                }
              }}
            >
              <MessageCircle className="size-4" />
              إعادة فتح رسالة واتساب
            </Button>

            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => {
                if (successOrder?.summaryText) {
                  navigator.clipboard.writeText(successOrder.summaryText);
                  toast.success("تم نسخ تفاصيل الطلب بنجاح");
                }
              }}
            >
              <Share2 className="size-4 text-accent" />
              نسخ نص ملخص الطلب للمشاركة
            </Button>

            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => setInvoiceModalOpen(true)}
            >
              <Printer className="size-4 text-primary" />
              معاينة وطباعة الفاتورة الرسمية
            </Button>

            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => setTrackModalOpen(true)}
            >
              <Truck className="size-4" />
              تتبع حالة هذا الطلب
            </Button>

            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                setSuccessOrder(null);
                void navigate({ to: "/" });
              }}
            >
              متابعة تصفح المتجر
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* نافذة الفاتورة الرسمية القابلة للطباعة فوراً */}
      {successOrder && (
        <InvoiceModal
          order={successOrder.fullOrder}
          open={invoiceModalOpen}
          onOpenChange={setInvoiceModalOpen}
        />
      )}

      {/* نافذة التتبع الفوري لنفس الطلب */}
      {successOrder && (
        <OrderTrackingModal
          open={trackModalOpen}
          onOpenChange={setTrackModalOpen}
          defaultQuery={successOrder.phone || successOrder.orderNumber.toString()}
        />
      )}
    </div>
  );
}