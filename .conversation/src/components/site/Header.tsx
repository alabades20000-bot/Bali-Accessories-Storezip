import { Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ShoppingCart,
  Waves,
  LayoutDashboard,
  LogIn,
  Ticket,
  Store,
  LogOut,
  Search,
  Truck,
  Heart,
  Moon,
  Sun,
  ShieldCheck,
} from "lucide-react";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { useAuth } from "@/hooks/useAuth";
import { useWholesale } from "@/hooks/useWholesale";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ProductSearchModal } from "@/components/site/ProductSearchModal";
import { OrderTrackingModal } from "@/components/site/OrderTrackingModal";
import { WishlistModal } from "@/components/site/WishlistModal";
import { AnnouncementBar } from "@/components/site/AnnouncementBar";

export function Header() {
  const { count } = useCart();
  const { count: favCount } = useWishlist();
  const { user, isAdmin, logout } = useAuth();
  const { isShopOwner } = useWholesale();
  const navigate = useNavigate();

  const [searchOpen, setSearchOpen] = useState(false);
  const [trackOpen, setTrackOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const isDarkStored = localStorage.getItem("bali-theme") !== "light";
    setIsDark(isDarkStored);
    if (isDarkStored) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("bali-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("bali-theme", "light");
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success("تم تسجيل الخروج بنجاح");
    void navigate({ to: "/" });
  };

  return (
    <>
      <AnnouncementBar />
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex size-10 items-center justify-center rounded-2xl sea-gradient glow-shadow">
              <Waves className="size-5 text-primary-foreground" />
            </span>
            <span className="font-display text-2xl font-extrabold tracking-tight">
              Bali<span className="text-primary">+</span>
            </span>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* زر البحث السريع */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <Search className="size-4" />
              <span className="hidden sm:inline text-xs">بحث</span>
            </Button>

            {/* زر قائمة المفضلة */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setWishlistOpen(true)}
              className="relative flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <Heart className={`size-4 ${favCount > 0 ? "text-destructive fill-destructive" : ""}`} />
              <span className="hidden sm:inline text-xs">المفضلة</span>
              {favCount > 0 && (
                <span className="flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                  {favCount}
                </span>
              )}
            </Button>

            {/* زر تتبع الطلبات للزبائن */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTrackOpen(true)}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <Truck className="size-4" />
              <span className="hidden sm:inline text-xs">تتبع طلبي</span>
            </Button>

            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/wheel">
                <Ticket className="size-4" />
                عجلة الحظ
              </Link>
            </Button>

            {/* زر تبديل الثيم الداكن والفاتح */}
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-foreground"
              onClick={toggleTheme}
              title={isDark ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الليلي"}
            >
              {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>

            {/* قسم المستخدم المسجل (مدير أو صاحب محل) */}
            {user ? (
              <div className="flex items-center gap-1.5">
                {isAdmin && (
                  <Button asChild variant="secondary" size="sm" className="gap-1 text-xs">
                    <Link to="/admin">
                      <LayoutDashboard className="size-3.5" />
                      <span className="hidden md:inline">لوحة التحكم</span>
                    </Link>
                  </Button>
                )}

                {isShopOwner && !isAdmin && (
                  <span className="hidden lg:inline-flex items-center gap-1 rounded-lg bg-accent/20 px-2.5 py-1 text-xs font-bold text-accent">
                    <Store className="size-3.5" />
                    سعر الجملة
                  </span>
                )}

                {/* زر تسجيل الخروج */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive font-bold"
                  title="تسجيل الخروج من الحساب"
                >
                  <LogOut className="size-3.5" />
                  <span className="hidden sm:inline">تسجيل الخروج</span>
                </Button>
              </div>
            ) : (
              <Button asChild variant="ghost" size="sm" className="gap-1.5 font-bold">
                <Link to="/auth">
                  <ShieldCheck className="size-4 text-primary" />
                  <span>دخول المدير</span>
                </Link>
              </Button>
            )}

            <Button asChild size="sm" className="relative">
              <Link to="/cart">
                <ShoppingCart className="size-4" />
                السلة
                {count > 0 && (
                  <span className="absolute -top-2 -left-2 flex size-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground">
                    {count}
                  </span>
                )}
              </Link>
            </Button>
          </div>
        </div>

        <ProductSearchModal open={searchOpen} onOpenChange={setSearchOpen} />
        <OrderTrackingModal open={trackOpen} onOpenChange={setTrackOpen} />
        <WishlistModal open={wishlistOpen} onOpenChange={setWishlistOpen} />
      </header>
    </>
  );
}

export function Footer() {
  const [trackOpen, setTrackOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);

  return (
    <footer className="mt-20 border-t border-border/60 bg-card/40">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-8 text-center">
        <span className="font-display text-xl font-bold">
          Bali<span className="text-primary">+</span>
        </span>
        <p className="text-sm text-muted-foreground">
          متجرك البحري لكل مستلزمات الموبايل — جودة أصلية وأسعار منافسة للزبائن وأصحاب المحلات.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-muted-foreground">
          <Link to="/" className="hover:text-foreground">الرئيسية</Link>
          <Link to="/wheel" className="hover:text-foreground">عجلة الحظ</Link>
          <button type="button" onClick={() => setWishlistOpen(true)} className="hover:text-foreground">
            المفضلة
          </button>
          <button type="button" onClick={() => setTrackOpen(true)} className="hover:text-foreground">
            تتبع حالة الطلب
          </button>
          <Link to="/auth" className="hover:text-foreground">دخول المدير</Link>
        </div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Bali+ — جميع الحقوق محفوظة
        </p>
      </div>
      <OrderTrackingModal open={trackOpen} onOpenChange={setTrackOpen} />
      <WishlistModal open={wishlistOpen} onOpenChange={setWishlistOpen} />
    </footer>
  );
}