import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/lib/cart";
import { WishlistProvider } from "@/lib/wishlist";
import { CompareProvider } from "@/lib/compare";
import { RecentlyViewedProvider } from "@/lib/recently-viewed";
import { Header, Footer } from "@/components/site/Header";
import { MobileBottomBar } from "@/components/site/MobileBottomBar";
import { WhatsAppFloatingButton } from "@/components/site/WhatsAppFloatingButton";
import { FloatingCompareButton } from "@/components/site/FloatingCompareButton";
import { CompareModal } from "@/components/site/CompareModal";
import { LiveSalesNotification } from "@/components/site/LiveSalesNotification";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">الصفحة غير موجودة</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          الرابط الذي تبحث عنه غير متوفر أو تم نقله.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            العودة للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          حدثت مشكلة في تحميل الصفحة
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">حاول التحديث أو العودة للصفحة الرئيسية.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            إعادة المحاولة
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            الرئيسية
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Bali+ | متجر الموبايلات والاكسسوارات" },
      {
        name: "description",
        content: "Bali+ متجر إلكتروني بحري الطابع للموبايلات والسماعات والاكسسوارات والشواحن.",
      },
      { property: "og:title", content: "Bali+ | متجر الموبايلات والاكسسوارات" },
      {
        property: "og:description",
        content: "تسوق الموبايلات والسماعات والاكسسوارات وجرّب عجلة الحظ للحصول على خصومات.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Tajawal:wght@500;700;900&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WishlistProvider>
          <CompareProvider>
            <RecentlyViewedProvider>
              <CartProvider>
                <div className="flex min-h-screen flex-col pb-16 md:pb-0">
                  <Header />
                  <main className="flex-1">
                    <Outlet />
                  </main>
                  <Footer />
                  <MobileBottomBar />
                  <WhatsAppFloatingButton />
                  <FloatingCompareButton onOpen={() => setCompareModalOpen(true)} />
                  <CompareModal open={compareModalOpen} onOpenChange={setCompareModalOpen} />
                  <LiveSalesNotification />
                </div>
                <Toaster position="top-center" richColors />
              </CartProvider>
            </RecentlyViewedProvider>
          </CompareProvider>
        </WishlistProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}