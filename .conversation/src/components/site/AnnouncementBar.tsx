import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Sparkles, Store, Tag, ArrowLeft, X } from "lucide-react";

export function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      const isDismissed = sessionStorage.getItem("bali_announcement_dismissed");
      if (isDismissed) setDismissed(true);
    } catch {
      /* ignore */
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem("bali_announcement_dismissed", "true");
    } catch {
      /* ignore */
    }
  };

  if (dismissed) return null;

  return (
    <aside
      aria-label="الإعلانات والتنبيهات"
      className="relative bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 border-b border-primary/20 py-2 px-4 text-xs font-bold text-foreground no-print"
    >
      <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-2 pr-2 pl-7 sm:px-4">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full sea-gradient text-primary-foreground">
            <Sparkles className="size-3" />
          </span>
          <p className="truncate">
            <span className="text-primary font-black">عروض اليوم:</span> خصومات حتى 25% مع عجلة الحظ + توصيل سريع لكافة المحافظات 🚚
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/wheel"
            className="flex items-center gap-1 text-primary hover:text-accent transition-colors"
          >
            <Tag className="size-3.5" />
            <span>أدر العجلة واربح كود</span>
          </Link>

          <span className="text-muted-foreground">•</span>

          <Link
            to="/auth"
            className="flex items-center gap-1 text-accent hover:text-primary transition-colors"
          >
            <Store className="size-3.5" />
            <span>بوابة أصحاب المحلات (جملة)</span>
            <ArrowLeft className="size-3" />
          </Link>
        </div>
      </div>

      <button
        type="button"
        onClick={handleDismiss}
        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="إغلاق التنبيه"
      >
        <X className="size-3.5" />
      </button>
    </aside>
  );
}