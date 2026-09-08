import { Scale } from "lucide-react";
import { useCompare } from "@/lib/compare";

export function FloatingCompareButton({ onOpen }: { onOpen: () => void }) {
  const { count } = useCompare();

  if (count === 0) return null;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full sea-gradient text-primary-foreground px-4 py-2.5 shadow-xl glow-shadow animate-in slide-in-from-bottom duration-300 md:bottom-6 md:right-6"
    >
      <Scale className="size-5" />
      <span className="text-xs font-bold font-display">مقارنة المنتجات</span>
      <span className="flex size-5 items-center justify-center rounded-full bg-accent text-[11px] font-black text-accent-foreground">
        {count}
      </span>
    </button>
  );
}