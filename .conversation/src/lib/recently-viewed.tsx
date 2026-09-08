import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type RecentlyViewedContextValue = {
  recentIds: string[];
  addRecent: (id: string) => void;
  clearRecent: () => void;
};

const RecentlyViewedContext = createContext<RecentlyViewedContextValue | null>(null);
const STORAGE_KEY = "bali-plus-recently-viewed";
const MAX_RECENT = 8;

export function RecentlyViewedProvider({ children }: { children: ReactNode }) {
  const [recentIds, setRecentIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setRecentIds(JSON.parse(raw) as string[]);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recentIds));
    } catch {
      /* ignore */
    }
  }, [recentIds]);

  const value = useMemo<RecentlyViewedContextValue>(() => {
    return {
      recentIds,
      addRecent: (id: string) => {
        setRecentIds((prev) => {
          const next = [id, ...prev.filter((item) => item !== id)].slice(0, MAX_RECENT);
          return next;
        });
      },
      clearRecent: () => {
        setRecentIds([]);
      },
    };
  }, [recentIds]);

  return (
    <RecentlyViewedContext.Provider value={value}>
      {children}
    </RecentlyViewedContext.Provider>
  );
}

export function useRecentlyViewed() {
  const ctx = useContext(RecentlyViewedContext);
  if (!ctx) throw new Error("useRecentlyViewed must be used inside RecentlyViewedProvider");
  return ctx;
}