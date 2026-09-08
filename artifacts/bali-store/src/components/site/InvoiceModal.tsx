import { Printer, X, Download, Share2, ShieldCheck, CheckCircle2 } from "lucide-react";
import { formatPrice } from "@/lib/cart";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export type OrderForInvoice = {
  id: string;
  order_number: number;
  customer_name: string;
  phone: string;
  address: string;
  status: string;
  total: number;
  discount_code?: string | null;
  note?: string | null;
  created_at: string;
  order_items: {
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
  }[];
};

type Props = {
  order: OrderForInvoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function InvoiceModal({ order, open, onOpenChange }: Props) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsAppInvoice = () => {
    const subtotal = order.order_items.reduce(
      (acc, it) => acc + Number(it.unit_price) * it.quantity,
      0,
    );
    const text = [
      `*فاتورة شراء رسمية #${order.order_number} - Bali+*`,
      `العميل: ${order.customer_name}`,
      `الهاتف: ${order.phone}`,
      `العنوان: ${order.address}`,
      `التاريخ: ${new Date(order.created_at).toLocaleDateString("ar-IQ")}`,
      "",
      "*المواد المطلوبة:*",
      ...order.order_items.map((it) => `• ${it.product_name} × ${it.quantity} = ${formatPrice(it.unit_price * it.quantity)} د.ع`),
      "",
      `المبلغ الإجمالي: *${formatPrice(Number(order.total))} د.ع*`,
      "شكراً لتسوقكم مع متجر Bali+",
    ].join("\n");

    let cleanPhone = order.phone.replace(/[^\d+]/g, "");
    if (cleanPhone.startsWith("07")) cleanPhone = `964${cleanPhone.slice(1)}`;
    else if (cleanPhone.startsWith("+964")) cleanPhone = cleanPhone.slice(1);

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, "_blank");
    toast.success("تم فتح رسالة الفاتورة عبر واتساب");
  };

  const subtotal = order.order_items.reduce(
    (acc, it) => acc + Number(it.unit_price) * it.quantity,
    0,
  );
  const discountVal = Math.max(0, subtotal - Number(order.total));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 sm:rounded-3xl border-border/80">
        <DialogHeader className="p-4 border-b border-border/60 flex flex-row items-center justify-between no-print">
          <DialogTitle className="font-display text-lg font-bold">
            معاينة وطباعة الفاتورة #{order.order_number}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleShareWhatsAppInvoice}
              className="gap-1.5 text-xs text-emerald-400 border-emerald-500/40"
            >
              <Share2 className="size-3.5" />
              إرسال لواتساب
            </Button>
            <Button size="sm" onClick={handlePrint} className="gap-1.5 font-bold text-xs">
              <Printer className="size-4" />
              طباعة الفاتورة
            </Button>
          </div>
        </DialogHeader>

        {/* جسم الفاتورة الرسمي القابل للطباعة */}
        <div
          id="printable-invoice"
          className="p-8 bg-card text-card-foreground print:bg-white print:text-black print:p-6"
        >
          {/* ترويسة الفاتورة */}
          <div className="flex items-start justify-between border-b-2 border-primary/30 pb-6 print:border-black">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-3xl font-black text-primary print:text-black">
                  Bali<span className="text-accent print:text-black">+</span>
                </span>
              </div>
              <p className="text-xs text-muted-foreground print:text-gray-600 mt-1">
                متجر الموبايلات والاكسسوارات والوكالات المعتمدة
              </p>
              <p className="text-xs font-mono text-muted-foreground print:text-gray-700 mt-0.5">
                هاتف المتجر: 07760623777
              </p>
            </div>

            <div className="text-left" dir="ltr">
              <div className="inline-block rounded-xl bg-primary/10 border border-primary/30 px-3 py-1 print:border-black">
                <span className="font-mono text-lg font-bold text-primary print:text-black">
                  INVOICE #{order.order_number}
                </span>
              </div>
              <p className="text-xs text-muted-foreground print:text-gray-600 mt-1">
                {new Date(order.created_at).toLocaleString("ar-IQ", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
          </div>

          {/* بيانات الزبون والتوصيل */}
          <div className="mt-6 grid grid-cols-2 gap-4 rounded-2xl bg-secondary/30 p-4 print:bg-gray-100 print:text-black border border-border/50 print:border-gray-300 text-sm">
            <div>
              <p className="text-xs text-muted-foreground print:text-gray-600">اسم العميل / المحل:</p>
              <p className="font-bold text-base mt-0.5">{order.customer_name}</p>
              <p className="text-xs text-muted-foreground print:text-gray-600 mt-2">رقم الهاتف:</p>
              <p className="font-mono font-bold mt-0.5" dir="ltr">
                {order.phone}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground print:text-gray-600">عنوان التوصيل:</p>
              <p className="font-bold mt-0.5 leading-snug">{order.address || "استلام مباشر"}</p>
              <p className="text-xs text-muted-foreground print:text-gray-600 mt-2">طريقة الدفع:</p>
              <p className="font-bold text-emerald-400 print:text-black mt-0.5">الدفع عند الاستلام</p>
            </div>
          </div>

          {/* جدول المواد */}
          <div className="mt-6 overflow-hidden rounded-xl border border-border/60 print:border-black">
            <table className="w-full text-right text-sm">
              <thead className="bg-secondary/40 print:bg-gray-200 print:text-black text-xs font-bold border-b border-border/60 print:border-black">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">اسم المنتج</th>
                  <th className="py-2.5 px-3 text-center">الكمية</th>
                  <th className="py-2.5 px-3">سعر المفرد</th>
                  <th className="py-2.5 px-3 text-left">الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 print:divide-gray-300">
                {order.order_items.map((item, idx) => (
                  <tr key={item.id} className="text-xs sm:text-sm">
                    <td className="py-2.5 px-3 text-muted-foreground print:text-black">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-bold">{item.product_name}</td>
                    <td className="py-2.5 px-3 text-center font-bold">{item.quantity}</td>
                    <td className="py-2.5 px-3">{formatPrice(item.unit_price)} د.ع</td>
                    <td className="py-2.5 px-3 text-left font-bold" dir="ltr">
                      {formatPrice(item.unit_price * item.quantity)} IQD
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* المجموع والتفاصيل المالية */}
          <div className="mt-6 flex flex-col items-end gap-1.5 text-sm">
            <div className="flex justify-between w-64 border-b border-border/40 print:border-gray-300 py-1">
              <span className="text-muted-foreground print:text-gray-700">المجموع الفرعي:</span>
              <span className="font-bold">{formatPrice(subtotal)} د.ع</span>
            </div>

            {discountVal > 0 && (
              <div className="flex justify-between w-64 border-b border-border/40 print:border-gray-300 py-1 text-emerald-400 print:text-black">
                <span>خصم (كود {order.discount_code}):</span>
                <span className="font-bold">-{formatPrice(discountVal)} د.ع</span>
              </div>
            )}

            <div className="flex justify-between w-64 pt-2 text-base font-black text-primary print:text-black">
              <span>المجموع الكلي:</span>
              <span className="font-display text-lg">{formatPrice(Number(order.total))} د.ع</span>
            </div>
          </div>

          {/* ملاحظات الفاتورة وتوقيع الاستلام */}
          {order.note && (
            <div className="mt-4 rounded-xl bg-secondary/20 p-3 text-xs border border-border/40 print:border-gray-300">
              <span className="font-bold">ملاحظة: </span>
              <span>{order.note}</span>
            </div>
          )}

          {/* ختم وتوقيع رسمي */}
          <div className="mt-8 pt-6 border-t border-dashed border-border/60 print:border-black flex justify-between items-end text-xs text-muted-foreground print:text-black">
            <div>
              <div className="flex items-center gap-1.5 text-primary print:text-black font-bold mb-1">
                <ShieldCheck className="size-4" />
                <span>فاتورة رسمية صادرة ومفحوصة - متجر Bali+</span>
              </div>
              <p>يرجى فحص الشحنة عند الاستلام مع المندوب</p>
            </div>
            <div className="text-center">
              <div className="mb-2 inline-block rounded-xl border-2 border-primary/40 px-3 py-1 text-[10px] font-black tracking-widest text-primary print:border-black print:text-black rotate-[-6deg]">
                BALI+ OFFICIAL STORE
              </div>
              <p className="mt-2 border-t border-black/40 px-6 pt-1">توقيع المستلم</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}