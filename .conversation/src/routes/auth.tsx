import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, LogIn, LogOut, LayoutDashboard } from "lucide-react";
import { useAuth, SUPER_ADMIN_EMAIL } from "@/hooks/useAuth";
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
  const { user, isAdmin, loginAsAdmin, logout } = useAuth();

  const [email, setEmail] = useState(SUPER_ADMIN_EMAIL);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

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

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-3xl glass-card p-6 sm:p-8 border border-border/70 shadow-xl">
        <div className="text-center">
          <span className="inline-flex size-12 items-center justify-center rounded-2xl sea-gradient glow-shadow mb-3">
            <ShieldCheck className="size-6 text-primary-foreground" />
          </span>
          <h1 className="font-display text-2xl font-black">
            دخول المدير
          </h1>
          <p className="mt-1.5 text-xs text-muted-foreground">
            تسجيل الدخول إلى لوحة إدارة متجر Bali+
          </p>
        </div>

        <form onSubmit={handleAdminSignIn} className="mt-6 space-y-4">
          <div className="flex flex-col gap-3">
            <div>
              <Label htmlFor="admin-email">البريد الإلكتروني</Label>
              <Input
                id="admin-email"
                type="email"
                dir="ltr"
                required
                placeholder="alipppppp62@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="admin-password">كلمة المرور</Label>
              <Input
                id="admin-password"
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
            className="w-full gap-2 font-bold h-11 sea-gradient text-primary-foreground mt-2 glow-shadow"
            disabled={busy}
          >
            <LogIn className="size-4" />
            {busy ? "جاري التحقق…" : "تسجيل دخول المدير"}
          </Button>

          <Button asChild variant="ghost" className="w-full text-xs text-muted-foreground">
            <Link to="/">العودة إلى الصفحة الرئيسية</Link>
          </Button>
        </form>
      </div>
    </div>
  );
}