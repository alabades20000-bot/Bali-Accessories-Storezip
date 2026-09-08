import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

type WishlistContextValue = {
  favorites: string[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string, name?: string) => void;
  removeFavorite: (id: string) => void;
  clearFavorites: () => void;
  count: number;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);
const STORAGE_KEY = "bali-plus-wishlist";

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setFavorites(JSON.parse(raw) as string[]);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      /* ignore */
    }
  }, [favorites]);

  const value = useMemo<WishlistContextValue>(() => {
    const isFav = (id: string) => favorites.includes(id);

    return {
      favorites,
      isFavorite: isFav,
      toggleFavorite: (id: string, name?: string) => {
        setFavorites((prev) => {
          if (prev.includes(id)) {
            toast.info(name ? `تمت إزالة "${name}" من المفضلة` : "تمت الإزالة من المفضلة");
            return prev.filter((item) => item !== id);
          } else {
            toast.success(name ? `تمت إضافة "${name}" إلى المفضلة ❤️` : "تمت الإضافة للمفضلة ❤️");
            return [...prev, id];
          }
        });
      },
      removeFavorite: (id: string) => {
        setFavorites((prev) => prev.filter((item) => item !== id));
      },
      clearFavorites: () => {
        setFavorites([]);
        toast.info("تم إفراغ قائمة المفضلة");
      },
      count: favorites.length,
    };
  }, [favorites]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
  return ctx;
}