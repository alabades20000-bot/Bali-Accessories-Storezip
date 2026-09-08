import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

type CompareContextValue = {
  compareIds: string[];
  isComparing: (id: string) => boolean;
  toggleCompare: (id: string, name?: string) => void;
  removeCompare: (id: string) => void;
  clearCompare: () => void;
  count: number;
};

const CompareContext = createContext<CompareContextValue | null>(null);
const STORAGE_KEY = "bali-plus-compare";
const MAX_COMPARE_ITEMS = 4;

export function CompareProvider({ children }: { children: ReactNode }) {
  const [compareIds, setCompareIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCompareIds(JSON.parse(raw) as string[]);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(compareIds));
    } catch {
      /* ignore */
    }
  }, [compareIds]);

  const value = useMemo<CompareContextValue>(() => {
    const isComp = (id: string) => compareIds.includes(id);

    return {
      compareIds,
      isComparing: isComp,
      toggleCompare: (id: string, name?: string) => {
        setCompareIds((prev) => {
          if (prev.includes(id)) {
            toast.info(name ? `تمت إزالة "${name}" من المقارنة` : "تمت الإزالة من المقارنة");
            return prev.filter((item) => item !== id);
          } else {
            if (prev.length >= MAX_COMPARE_ITEMS) {
              toast.error(`الحد الأقصى للمقارنة هو ${MAX_COMPARE_ITEMS} منتجات`);
              return prev;
            }
            toast.success(name ? `تمت إضافة "${name}" للمقارنة ⚖️` : "تمت الإضافة للمقارنة ⚖️");
            return [...prev, id];
          }
        });
      },
      removeCompare: (id: string) => {
        setCompareIds((prev) => prev.filter((item) => item !== id));
      },
      clearCompare: () => {
        setCompareIds([]);
        toast.info("تم إفراغ قائمة المقارنة");
      },
      count: compareIds.length,
    };
  }, [compareIds]);

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used inside CompareProvider");
  return ctx;
}