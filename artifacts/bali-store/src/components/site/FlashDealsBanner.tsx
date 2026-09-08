import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Timer, Flame, ArrowLeft, Tag, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function FlashDealsBanner() {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [copied, setCopied] = useState(false);
  const flashCode = "BALI20";

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const diff = endOfDay.getTime() - now.getTime();

      if (diff > 0) {
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft({ hours, minutes, seconds });
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(flashCode);
    setCopied(true);
    try {
      sessionStorage.setItem("active_discount_code", flashCode);
      sessionStorage.setItem("active_discount_percent", "20");
    } catch {
      /* ignore */
    }
    toast.success("تم نسخ كود الخصم! سيتم تطبيقه تلقائياً في السلة");
    setTimeout(() => setCopied(false), 3000);
  };

  const formatDigit = (num: number) => num.toString().padStart(2, "0");

  return (
    <div className="relative mt-8 overflow-hidden rounded-3xl border border-destructive/30 bg-gradient-to-r from-destructive/15 via-card/60 to-primary/10 p-5 sm:p-6 glow-shadow">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 text-center sm:text-right">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-destructive text-destructive-foreground animate-pulse">
            <Flame className="size-6 fill-current" />
          </span>
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-xs font-black uppercase text-destructive tracking-wide">
                عروض الفلاش اليومية
              </span>
              <span className="rounded-full bg-destructive/20 text-destructive text-[10px] font-bold px-2 py-0.5">
                خصم 20%
              </span>
            </div>
            <h3 className="font-display text-lg sm:text-xl font-black mt-0.5">
              ينتهي عرض اليوم الخاص خلال:
            </h3>
          </div>
        </div>

        {/* مؤقت العد التنازلي */}
        <div className="flex items-center gap-2" dir="ltr">
          <div className="flex flex-col items-center">
            <span className="flex size-11 items-center justify-center rounded-xl bg-card border border-border/80 font-mono font-black text-lg text-foreground shadow-inner">
              {formatDigit(timeLeft.hours)}
            </span>
            <span className="text-[10px] text-muted-foreground mt-1 font-bold">ساعة</span>
          </div>
          <span className="font-bold text-lg text-destructive mb-4">:</span>
          <div className="flex flex-col items-center">
            <span className="flex size-11 items-center justify-center rounded-xl bg-card border border-border/80 font-mono font-black text-lg text-foreground shadow-inner">
              {formatDigit(timeLeft.minutes)}
            </span>
            <span className="text-[10px] text-muted-foreground mt-1 font-bold">دقيقة</span>
          </div>
          <span className="font-bold text-lg text-destructive mb-4">:</span>
          <div className="flex flex-col items-center">
            <span className="flex size-11 items-center justify-center rounded-xl bg-card border border-border/80 font-mono font-black text-lg text-destructive shadow-inner">
              {formatDigit(timeLeft.seconds)}
            </span>
            <span className="text-[10px] text-muted-foreground mt-1 font-bold">ثانية</span>
          </div>
        </div>

        {/* زر نسخ الكود واستخدامه */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyCode}
            className="flex-1 sm:flex-none gap-1.5 text-xs font-bold border-destructive/40 hover:bg-destructive/10 text-destructive"
          >
            {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
            {copied ? "تم النسخ والحفظ" : `كود: ${flashCode}`}
          </Button>

          <Button asChild size="sm" className="flex-1 sm:flex-none gap-1 text-xs font-bold bg-destructive hover:bg-destructive/90 text-destructive-foreground">
            <Link to="/cart">
              استخدم الخصم
              <ArrowLeft className="size-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}