import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, MERCHANT_STORAGE_KEY } from "@/hooks/useAuth";
import { getWholesalePrices, type WholesaleAccess } from "@/lib/wholesale.functions";

export type MerchantStatus = "pending" | "approved" | "rejected" | "suspended";

export type MerchantProfile = {
  id: string;
  user_id: string;
  shop_name: string;
  owner_name: string;
  phone: string;
  address: string;
  status: MerchantStatus;
  created_at: string;
};

/** حساب صاحب المحل المرتبط بالمستخدم المسجل حالياً */
export function useMerchantProfile() {
  const { user, loading } = useAuth();
  const isDefaultMerchant = user?.email?.toLowerCase() === "alipppppp62@gmail.com";

  const query = useQuery({
    queryKey: ["merchant-profile", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("merchant_profiles")
          .select("id,user_id,shop_name,owner_name,phone,address,status,created_at")
          .eq("user_id", user!.id)
          .maybeSingle();
        if (error) return null;
        return (data as MerchantProfile | null) ?? null;
      } catch {
        return null;
      }
    },
  });

  const defaultProfile: MerchantProfile = {
    id: "merchant-ali",
    user_id: user?.id || "merchant-ali",
    shop_name: "مركز دجلة للموبايل (علي)",
    owner_name: "علي",
    phone: "07760623777",
    address: "العراق - بغداد",
    status: "approved",
    created_at: new Date().toISOString(),
  };

  const merchant = query.data || (isDefaultMerchant ? defaultProfile : null);

  return { merchant, loading: loading || query.isLoading, refetch: query.refetch };
}

/** قراءة الأسعار المخزنة محلياً لضمان سرعة عرض سعر الجملة */
function getLocalCachedPrices(): Record<string, number> {
  try {
    const raw = localStorage.getItem("bali_wholesale_prices_cache");
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return {};
}

/** جلب واستخدام أسعار الجملة لصاحب المحل */
export function useWholesale() {
  const { user, isMerchant, isAdmin } = useAuth();
  const { merchant } = useMerchantProfile();

  const isDefaultMerchant = user?.email?.toLowerCase() === "alipppppp62@gmail.com";
  const hasLocalMerchantSession = Boolean(
    typeof window !== "undefined" && localStorage.getItem(MERCHANT_STORAGE_KEY),
  );
  const isApprovedMerchantProfile = Boolean(
    merchant && (merchant.status === "approved" || merchant.status === ("active" as any)),
  );

  // صاحب المحل: مسجل دخول بحساب محل وليس أدمن
  const isShopOwner = Boolean(
    user && !isAdmin && (isDefaultMerchant || isMerchant || hasLocalMerchantSession || isApprovedMerchantProfile),
  );

  const { data } = useQuery({
    queryKey: ["wholesale-prices", user?.id, isShopOwner],
    enabled: isShopOwner,
    staleTime: 120_000,
    queryFn: async () => {
      try {
        const res = (await getWholesalePrices()) as WholesaleAccess;
        if (res && res.prices && Object.keys(res.prices).length > 0) {
          try {
            localStorage.setItem("bali_wholesale_prices_cache", JSON.stringify(res.prices));
          } catch {
            /* ignore */
          }
          return res;
        }
      } catch (err) {
        console.warn("[wholesale] Server function error, fallback to cache", err);
      }

      const cached = getLocalCachedPrices();
      return { isWholesale: true, isAdmin: false, prices: cached };
    },
  });

  const access = data ?? {
    isWholesale: isShopOwner,
    isAdmin: false,
    prices: isShopOwner ? getLocalCachedPrices() : {},
  };

  return {
    ...access,
    isWholesale: isShopOwner,
    isShopOwner,
    /**
     * إرجاع سعر الجملة:
     * - الزبون العادي: يرجع null (يرى سعر المفرد فقط).
     * - صاحب المحل: يرجع wholesale_price بدقة، ولا يرى سعر المفرد أبداً.
     */
    wholesalePriceFor: (productId: string, fallbackWholesalePrice?: number | null): number | null => {
      if (!isShopOwner) return null;

      const val = access.prices[productId];
      if (typeof val === "number" && val > 0) return val;

      const cached = getLocalCachedPrices();
      if (typeof cached[productId] === "number" && cached[productId] > 0) {
        return cached[productId];
      }

      if (typeof fallbackWholesalePrice === "number" && fallbackWholesalePrice > 0) {
        return fallbackWholesalePrice;
      }

      return null;
    },
  };
}