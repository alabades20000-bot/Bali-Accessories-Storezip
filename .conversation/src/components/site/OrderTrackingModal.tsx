import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  PackageCheck,
  Search,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  Receipt,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { trackCustomerOrder, type TrackedOrder } from "@/lib/orders.functions";
import { formatPrice, useCart } from "@/lib/cart";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultQuery?: string;
};

const STATUS_STEPS = [
  { key: "pending", label: "قيد المراجعة", icon: Clock },
  { key: "confirmed", label: "تم التأكيد", icon: CheckCircle2 },
  { key: "shipped", label: "مع المندوب للتوصيل", icon: Truck },
  { key: "delivered", label: "تم التسليم", icon: PackageCheck },
];

export function OrderTrackingModal({ open, onOpenChange, defaultQuery = "" }: Props) {
  const [query, setQuery] = useState(defaultQuery);
  const [searching, setSearching] = useState(false);
  const [orders, setOrders] = useState<TrackedOrder[] | null>(null);
  const runTrack = useServerFn(trackCustomerOrder);
  const { add } = useCart();

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) {
      toast.error("يرجى إدخال رقم الهاتف أو رقم الفاتورة");
      return;
    }

    setSearching(true);
    try {
      const res = await runTrack({ data: { query: query.trim() } });
      setOrders(res);
      if (res.length === 0) {
        toast.info("لم نتمكن من العثور على طلبات مطابقة لهذا الرقم");
      }
    } catch {
      toast.error("حدث خطأ أثناء البحث، حاول مجدداً");
    } finally {
      setSearching(false);
    }
  };

  const getStepIndex = (status: string) => {
    switch (status) {
      case "pending":
        return 0;
      case "confirmed":
        return 1;
      case "shipped":
        return 2;
      case "delivered":
        return 3;
      default:
        return -1;
    }
  };

  const handleReorder = (order: TrackedOrder) => {
    let count = 0;
    for (const item of order.order_items) {
      if (item.product_id) {
        add(
          {
            id: item.product_id,
            name: item.product_name,
            price: Number(item.unit_price),
            image_url: null,
          },
          item.quantity,
        );
        count += item.quantity;
      }
    }
    toast.success(`تمت إعادة إضافة ${count} منتجات إلى سلة المشتريات 🛒`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto p-0 sm:rounded-3xl">
        <DialogHeader className="p-6 pb-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl sea-gradient glow-shadow">
              <Truck className="size-5 text-primary-foreground" />
            </span>
            <div>
              <DialogTitle className="font-display text-xl font-bold">
                تتبع حالة الطلب والفواتير
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                أدخل رقم هاتفك أو رقم الفاتورة لمعرفة أين وصل طلبك وإمكانية تكرار الطلب
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-3 size-4 text-muted-foreground" />
              <Input
                placeholder="رقم الهاتف (07xxxxxxxxx) أو رقم الفاتورة"
                className="pr-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={searching} className="gap-1.5 shrink-0">
              {searching ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <Search className="size-4" />
                  بحث
                </>
              )}
            </Button>
          </form>

          {orders && orders.length === 0 && (
            <div className="rounded-2xl border border-border/60 bg-secondary/20 p-8 text-center">
              <PackageCheck className="size-10 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="font-bold text-foreground">لا توجد نتائج</p>
              <p className="text-xs text-muted-foreground mt-1">
                تأكد من كتابة رقم الهاتف المسجل في الفاتورة أو رقم الفاتورة بدقة.
              </p>
            </div>
          )}

          {orders && orders.length > 0 && (
            <div className="space-y-6">
              {orders.map((order) => {
                const stepIdx = getStepIndex(order.status);
                const isCancelled = order.status === "cancelled";

                return (
                  <div
                    key={order.id}
                    className="rounded-3xl glass-card border border-border/70 p-5 space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Receipt className="size-4 text-accent" />
                          <span className="font-display font-black text-lg">
                            فاتورة #{order.order_number}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          تاريخ الطلب: {new Date(order.created_at).toLocaleDateString("ar-IQ")}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            isCancelled
                              ? "destructive"
                              : order.status === "delivered"
                                ? "default"
                                : "secondary"
                          }
                          className="text-xs py-1"
                        >
                          {isCancelled
                            ? "تم إلغاء الطلب"
                            : STATUS_STEPS.find((s) => s.key === order.status)?.label ??
                              order.status}
                        </Badge>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReorder(order)}
                          className="gap-1 text-xs h-7 px-2.5"
                          title="إعادة طلب منتجات هذه الفاتورة"
                        >
                          <RotateCcw className="size-3" />
                          إعادة طلب
                        </Button>
                      </div>
                    </div>

                    {/* الشريط الزمني لمراحل التوصيل */}
                    {!isCancelled ? (
                      <div className="py-2">
                        <p className="text-xs font-bold text-muted-foreground mb-3">
                          مراحل تجهيز وتوصيل الشحنة:
                        </p>
                        <div className="grid grid-cols-4 gap-1 relative text-center">
                          {STATUS_STEPS.map((step, idx) => {
                            const isDone = stepIdx >= idx;
                            const isCurrent = stepIdx === idx;
                            const Icon = step.icon;

                            return (
                              <div key={step.key} className="flex flex-col items-center">
                                <div
                                  className={`size-9 rounded-full flex items-center justify-center transition-colors ${
                                    isCurrent
                                      ? "sea-gradient text-primary-foreground glow-shadow ring-2 ring-accent"
                                      : isDone
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-secondary text-muted-foreground"
                                  }`}
                                >
                                  <Icon className="size-4" />
                                </div>
                                <span
                                  className={`text-[10px] mt-2 font-bold leading-tight ${
                                    isDone ? "text-foreground" : "text-muted-foreground"
                                  }`}
                                >
                                  {step.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded-2xl text-xs">
                        <XCircle className="size-4 shrink-0" />
                        <span>تم إلغاء هذه الفاتورة. لمزيد من الاستفسار تواصل مع خدمة العملاء.</span>
                      </div>
                    )}

                    {/* محتويات الطلب */}
                    <div className="rounded-2xl bg-secondary/25 p-3 space-y-1.5 text-xs">
                      <div className="flex justify-between text-muted-foreground border-b border-border/50 pb-1.5">
                        <span>المنتجات المطلوبة:</span>
                        <span>{order.order_items.length} منتج</span>
                      </div>
                      {order.order_items.map((item) => (
                        <div key={item.id} className="flex justify-between py-0.5">
                          <span className="text-foreground">
                            {item.product_name} × {item.quantity}
                          </span>
                          <span className="font-bold">
                            {formatPrice(item.unit_price * item.quantity)} د.ع
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between border-t border-border/50 pt-2 font-bold text-sm">
                        <span>المبلغ الإجمالي</span>
                        <span className="text-primary font-display">
                          {formatPrice(order.total)} د.ع
                        </span>
                      </div>
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