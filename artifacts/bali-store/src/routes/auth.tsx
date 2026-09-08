import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, LogIn, LogOut, LayoutDashboard, Store, ShoppingBag } from "lucide-react";
import {
  useAuth,
  SUPER_ADMIN_EMAIL,
  WHOLESALE_EMAIL,
} from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "دخول المدير | Bali+" },
      {
        name: "description",
        content: "تسجيل دخول المدير للتحكم في متجر Bali+ وإدارة المنتجات والأسعار والفواتير.",
      },
      { property: "og:title", content: "دخول المدير | Bali+" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, isAdmin, isMerchant, loginAsAdmin, loginAsMerchant, logout } = useAuth();

  const [mode, setMode] = useState<"wholesale" | "admin">(() =>
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("mode") === "admin"
      ? "admin"
      : "wholesale",
  );
  const [email, setEmail] = useState(WHOLESALE_EMAIL);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const switchMode = (nextMode: "wholesale" | "admin") => {
    setMode(nextMode);
    setPassword("");
    setEmail(nextMode === "wholesale" ? WHOLESALE_EMAIL : SUPER_ADMIN_EMAIL);
  };

  const handleAdminSignIn = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("يرجى إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }

    setBusy(true);
    try {
      const ok = await loginAsAdmin(email, password);
      if (ok) {
        toast.success("تم تسجيل دخول المدير بنجاح!");
        void navigate({ to: "/admin" });
      } else {
        toast.error("بيانات الدخول غير صحيحة");
      }
    } catch (err: any) {
      toast.error(err?.message || "تعذر تسجيل الدخول");
    } finally {
      setBusy(false);
    }
  };

  const handleWholesaleSignIn = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("يرجى إدخال بريد حساب الجملة وكلمة المرور");
      return;
    }

    setBusy(true);
    try {
      const ok = await loginAsMerchant(email, password);
      if (ok) {
        toast.success("تم الدخول بحساب الجملة — تظهر لك أسعار المحلات فقط");
        void navigate({ to: "/" });
      } else {
        toast.error("بيانات حساب الجملة غير صحيحة");
      }
    } finally {
      setBusy(false);
    }
  };

  // في حال كان المدير مسجلاً دخوله مسبقاً
  if (user && isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="rounded-3xl glass-card p-8 border border-border/70 shadow-lg">
          <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl sea-gradient glow-shadow">
            <ShieldCheck className="size-7 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-black">أهلاً بك، المدير العام</h1>
          <p className="mt-1 text-sm text-muted-foreground font-mono">{user.email}</p>

          <div className="mt-4 rounded-2xl bg-secondary/40 p-4 text-right border border-border/50">
            <p className="text-xs text-muted-foreground">
              أنت مسجل حالياً بحساب الإدارة الكامل ولديك صلاحية تعديل المنتجات، الأسعار، الأقسام، والفواتير.
            </p>
          </div>

          <Button asChild className="mt-5 w-full gap-2 font-bold h-11 sea-gradient text-primary-foreground glow-shadow">
            <Link to="/admin">
              <LayoutDashboard className="size-4" />
              الانتقال للوحة التحكم الكاملة
            </Link>
          </Button>

          <Button
            variant="ghost"
            className="mt-2 w-full text-destructive"
            onClick={async () => {
              await logout();
              toast.success("تم تسجيل الخروج");
            }}
          >
            <LogOut className="size-4" />
            تسجيل الخروج
          </Button>
        </div>
      </div>
    );
  }

  // في حال كان صاحب المحل مسجلاً دخوله مسبقاً
  if (user && isMerchant) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="rounded-3xl glass-card p-8 border border-accent/40 shadow-lg">
          <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-accent/20">
            <Store className="size-7 text-accent" />
          </div>
          <h1 className="font-display text-2xl font-black">حساب أصحاب المحلات</h1>
          <p className="mt-1 text-sm text-muted-foreground font-mono">{user.email}</p>

          <div className="mt-4 rounded-2xl bg-accent/10 p-4 text-right border border-accent/30">
            <p className="text-sm font-bold text-accent">أسعار الجملة مفعّلة</p>
            <p className="mt-1 text-xs text-muted-foreground">
              يمكنك تصفح المنتجات وإضافتها إلى السلة والشراء مثل الزبون، بدون أي صلاحية لتعديل
              المنتجات أو الأسعار.
            </p>
          </div>

          <Button asChild className="mt-5 w-full gap-2 font-bold h-11 sea-gradient text-primary-foreground glow-shadow">
            <Link to="/">
              <ShoppingBag className="size-4" />
              تصفح المنتجات بسعر الجملة
            </Link>
          </Button>

          <Button
            variant="ghost"
            className="mt-2 w-full text-destructive"
            onClick={async () => {
              await logout();
              toast.success("تم تسجيل الخروج");
            }}
          >
            <LogOut className="size-4" />
            تسجيل الخروج
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-3xl glass-card p-6 sm:p-8 border border-border/70 shadow-xl">
        <div className="text-center">
          <span className="inline-flex size-12 items-center justify-center rounded-2xl sea-gradient glow-shadow mb-3">
            {mode === "wholesale" ? (
              <Store className="size-6 text-primary-foreground" />
            ) : (
              <ShieldCheck className="size-6 text-primary-foreground" />
            )}
          </span>
          <h1 className="font-display text-2xl font-black">
            {mode === "wholesale" ? "دخول أصحاب المحلات (جملة)" : "دخول المدير"}
          </h1>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {mode === "wholesale"
              ? "سجّل الدخول لرؤية أسعار الجملة والشراء من المتجر"
              : "تسجيل الدخول إلى لوحة إدارة متجر Bali+"}
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-secondary/50 p-1">
          <button
            type="button"
            onClick={() => switchMode("wholesale")}
            className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
              mode === "wholesale" ? "bg-accent text-accent-foreground shadow" : "text-muted-foreground"
            }`}
          >
            أصحاب المحلات
          </button>
          <button
            type="button"
            onClick={() => switchMode("admin")}
            className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
              mode === "admin" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground"
            }`}
          >
            المدير
          </button>
        </div>

        <form
          onSubmit={mode === "wholesale" ? handleWholesaleSignIn : handleAdminSignIn}
          className="mt-5 space-y-4"
        >
          <div className="flex flex-col gap-3">
            <div>
              <Label htmlFor="auth-email">البريد الإلكتروني</Label>
              <Input
                id="auth-email"
                type="email"
                dir="ltr"
                required
                placeholder={mode === "wholesale" ? WHOLESALE_EMAIL : SUPER_ADMIN_EMAIL}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="auth-password">كلمة المرور</Label>
              <Input
                id="auth-password"
                type="password"
                dir="ltr"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <Button
            type="submit"
            className={`w-full gap-2 font-bold h-11 text-primary-foreground mt-2 glow-shadow ${
              mode === "wholesale" ? "bg-accent hover:bg-accent/90" : "sea-gradient"
            }`}
            disabled={busy}
          >
            {mode === "wholesale" ? <Store className="size-4" /> : <LogIn className="size-4" />}
            {busy
              ? "جاري التحقق…"
              : mode === "wholesale"
                ? "دخول أصحاب المحلات"
                : "تسجيل دخول المدير"}
          </Button>

          <Button asChild variant="ghost" className="w-full text-xs text-muted-foreground">
            <Link to="/">العودة إلى الصفحة الرئيسية</Link>
          </Button>
        </form>
      </div>
    </div>
  );
}