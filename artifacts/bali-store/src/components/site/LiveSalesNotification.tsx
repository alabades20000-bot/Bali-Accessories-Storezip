import { useEffect, useState } from "react";
import { ShoppingBag, X } from "lucide-react";
import { formatPrice } from "@/lib/cart";

const MOCK_SALES = [
  { name: "سيف من بغداد - المنصور", product: "شاحن Anker 65W GaN سريع", time: "منذ دقيقتين" },
  { name: "محل النور للهواتف (البصرة)", product: "باكج لاصقات حماية Green Lion (جملة)", time: "منذ 5 دقائق" },
  { name: "كرار من النجف الأشرف", product: "سماعة Joyroom اللاسلكية ANC", time: "منذ 7 دقائق" },
  { name: "مروان من أربيل", product: "كفر مغناطيسي MagSafe أصلي", time: "منذ 11 دقيقة" },
  { name: "مركز بابل للإلكترونيات", product: "شواحن وبطاريات Baseus 20,000mAh", time: "منذ 14 دقيقة" },
  { name: "أحمد من كركوك", product: "كيبل تايب سي سريع 100W", time: "منذ 18 دقيقة" },
];

export function LiveSalesNotification() {
  const [current, setCurrent] = useState<typeof MOCK_SALES[0] | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;

    // First trigger after 4 seconds
    const initialTimer = setTimeout(() => {
      showRandomSale();
    }, 4000);

    const interval = setInterval(() => {
      if (!dismissed) {
        showRandomSale();
      }
    }, 28000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [dismissed]);

  const showRandomSale = () => {
    const randomSale = MOCK_SALES[Math.floor(Math.random() * MOCK_SALES.length)];
    setCurrent(randomSale);
    setVisible(true);

    setTimeout(() => {
      setVisible(false);
    }, 6000);
  };

  if (!visible || !current || dismissed) return null;

  return (
    <div className="fixed bottom-20 left-4 z-40 max-w-sm animate-in slide-in-from-left duration-500 md:bottom-6 md:left-24 no-print">
      <div className="flex items-center gap-3 rounded-2xl glass-card p-3.5 pr-4 border border-primary/40 deep-shadow glow-shadow bg-card/95 backdrop-blur-md">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl sea-gradient text-primary-foreground">
          <ShoppingBag className="size-5" />
        </span>
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center justify-between gap-2">
            <p className="font-bold text-xs text-foreground truncate">{current.name}</p>
            <span className="text-[10px] text-muted-foreground shrink-0">{current.time}</span>
          </div>
          <p className="text-xs text-primary font-medium mt-0.5 truncate">
            طلب: <span className="font-bold">{current.product}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setVisible(false);
            setDismissed(true);
          }}
          className="text-muted-foreground hover:text-foreground p-1 transition-colors"
          aria-label="إغلاق التنبيه"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}