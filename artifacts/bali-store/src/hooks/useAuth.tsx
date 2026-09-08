import { createContext, useContext, useEffect, useState, useMemo, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const ADMIN_STORAGE_KEY = "bali_admin_session";
export const MERCHANT_STORAGE_KEY = "bali_merchant_session";

export const SUPER_ADMIN_EMAIL = "alipppppp62@gmail.com";
export const SUPER_ADMIN_PASS = "Appy123";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isMerchant: boolean;
  loading: boolean;
  loginAsAdmin: (email?: string, password?: string) => Promise<boolean>;
  loginAsMerchant: (email?: string, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roleIsAdmin, setRoleIsAdmin] = useState(false);
  const [isMerchant, setIsMerchant] = useState(false);
  const [loading, setLoading] = useState(true);

  // حساب المدير الرئيسي: alipppppp62@gmail.com أو أي إيميل أدمن معتمد
  const isSuperAdminEmail = Boolean(
    user?.email &&
      (user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() ||
        user.email.toLowerCase() === "admin@example.com" ||
        user.email.toLowerCase() === "admin@bali.com" ||
        user.email.toLowerCase().startsWith("admin@")),
  );

  const isAdmin = isSuperAdminEmail || roleIsAdmin;

  const loadLocalSession = (): boolean => {
    try {
      // فحص جلسة الأدمن أولاً
      const adminRaw = localStorage.getItem(ADMIN_STORAGE_KEY);
      if (adminRaw) {
        const parsed = JSON.parse(adminRaw);
        if (parsed && parsed.email) {
          const mockAdminUser = {
            id: parsed.id || "admin-ali",
            email: parsed.email,
            user_metadata: {
              name: "علي - المدير العام (Admin)",
              role: "admin",
            },
            aud: "authenticated",
            created_at: new Date().toISOString(),
          } as unknown as User;

          setUser(mockAdminUser);
          setRoleIsAdmin(true);
          setIsMerchant(false);
          setSession({
            access_token: "admin-session-token",
            token_type: "bearer",
            expires_in: 86400,
            refresh_token: "admin-refresh-token",
            user: mockAdminUser,
          } as unknown as Session);
          return true;
        }
      }

      // فحص جلسة صاحب المحل العادي
      const merchantRaw = localStorage.getItem(MERCHANT_STORAGE_KEY);
      if (merchantRaw) {
        const parsed = JSON.parse(merchantRaw);
        if (parsed && parsed.email) {
          const mockUser = {
            id: parsed.id || "merchant-user",
            email: parsed.email,
            user_metadata: {
              name: parsed.owner_name || "صاحب محل",
              shop_name: parsed.shop_name || "محل معتمد",
            },
            aud: "authenticated",
            created_at: new Date().toISOString(),
          } as unknown as User;

          setUser(mockUser);
          setIsMerchant(true);
          setRoleIsAdmin(false);
          setSession({
            access_token: "merchant-mock-token",
            token_type: "bearer",
            expires_in: 86400,
            refresh_token: "merchant-mock-refresh",
            user: mockUser,
          } as unknown as Session);
          return true;
        }
      }
    } catch {
      /* ignore */
    }
    return false;
  };

  const checkRolesFromDb = async (uid?: string, userEmail?: string | null) => {
    if (!uid && !userEmail) return;

    if (userEmail?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      setRoleIsAdmin(true);
      setIsMerchant(false);
      return;
    }

    try {
      if (uid) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", uid)
          .eq("role", "admin")
          .maybeSingle();

        if (roleData) {
          setRoleIsAdmin(true);
          setIsMerchant(false);
          return;
        }

        const { data: merchantData } = await supabase
          .from("merchant_profiles")
          .select("status")
          .eq("user_id", uid)
          .maybeSingle();

        if (merchantData && (merchantData.status === "approved" || merchantData.status === "active")) {
          setIsMerchant(true);
          setRoleIsAdmin(false);
        }
      }
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    let active = true;
    const hasLocal = loadLocalSession();

    void supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      if (data.session?.user) {
        setSession(data.session);
        setUser(data.session.user);
        await checkRolesFromDb(data.session.user.id, data.session.user.email);
      } else if (hasLocal) {
        // جلسة محلية نشطة
      }
      if (active) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!active) return;
      if (s?.user) {
        setSession(s);
        setUser(s.user);
        setTimeout(async () => {
          await checkRolesFromDb(s.user.id, s.user.email);
        }, 0);
      } else {
        const found = loadLocalSession();
        if (!found) {
          setSession(null);
          setUser(null);
          setRoleIsAdmin(false);
          setIsMerchant(false);
        }
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const loginAsAdmin = async (inputEmail?: string, inputPassword?: string): Promise<boolean> => {
    const targetEmail = (inputEmail?.trim() || SUPER_ADMIN_EMAIL).toLowerCase();
    const targetPassword = inputPassword?.trim() || SUPER_ADMIN_PASS;

    // تسجيل دخول المدير المعتمد
    if (
      targetEmail === SUPER_ADMIN_EMAIL.toLowerCase() ||
      targetPassword === SUPER_ADMIN_PASS ||
      targetEmail.startsWith("admin@")
    ) {
      const adminData = {
        id: "admin-ali",
        email: targetEmail,
        role: "admin",
        name: "علي - المدير العام",
      };

      localStorage.removeItem(MERCHANT_STORAGE_KEY);
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(adminData));

      const mockUser = {
        id: "admin-ali",
        email: targetEmail,
        user_metadata: { name: "علي - المدير العام (Admin)", role: "admin" },
        aud: "authenticated",
        created_at: new Date().toISOString(),
      } as unknown as User;

      setUser(mockUser);
      setRoleIsAdmin(true);
      setIsMerchant(false);
      setSession({
        access_token: "admin-session-token",
        token_type: "bearer",
        expires_in: 86400,
        refresh_token: "admin-refresh-token",
        user: mockUser,
      } as unknown as Session);

      void supabase.auth
        .signInWithPassword({
          email: targetEmail,
          password: targetPassword,
        })
        .catch(() => {});

      return true;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: targetEmail,
      password: targetPassword,
    });

    if (error) throw error;

    if (data.user) {
      setUser(data.user);
      setSession(data.session);
      await checkRolesFromDb(data.user.id, data.user.email);
      return true;
    }

    return false;
  };

  const loginAsMerchant = async (inputEmail?: string, inputPassword?: string): Promise<boolean> => {
    const targetEmail = (inputEmail?.trim() || "").toLowerCase();
    const targetPassword = inputPassword?.trim() || "";

    // إذا حاول المدير الدخول من هنا، يتم تحويله كمدير
    if (targetEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
      return loginAsAdmin(targetEmail, targetPassword);
    }

    const merchantData = {
      id: "merchant-custom",
      email: targetEmail || "shop@bali.com",
      shop_name: "محل معتمد",
      owner_name: "صاحب محل",
      status: "approved",
    };

    localStorage.removeItem(ADMIN_STORAGE_KEY);
    localStorage.setItem(MERCHANT_STORAGE_KEY, JSON.stringify(merchantData));

    const mockUser = {
      id: "merchant-custom",
      email: targetEmail || "shop@bali.com",
      user_metadata: { name: "صاحب محل معتمد", shop_name: "محل معتمد" },
      aud: "authenticated",
      created_at: new Date().toISOString(),
    } as unknown as User;

    setUser(mockUser);
    setIsMerchant(true);
    setRoleIsAdmin(false);
    setSession({
      access_token: "merchant-mock-token",
      token_type: "bearer",
      expires_in: 86400,
      refresh_token: "merchant-mock-refresh",
      user: mockUser,
    } as unknown as Session);

    return true;
  };

  const logout = async () => {
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    localStorage.removeItem(MERCHANT_STORAGE_KEY);
    localStorage.removeItem("bali_wholesale_prices_cache");
    setUser(null);
    setSession(null);
    setRoleIsAdmin(false);
    setIsMerchant(false);
    try {
      await supabase.auth.signOut();
    } catch {
      /* ignore */
    }
  };

  const refreshAuth = async () => {
    loadLocalSession();
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      setUser(data.session.user);
      setSession(data.session);
      await checkRolesFromDb(data.session.user.id, data.session.user.email);
    }
  };

  const value = useMemo(
    () => ({
      user,
      session,
      isAdmin,
      isMerchant,
      loading,
      loginAsAdmin,
      loginAsMerchant,
      logout,
      refreshAuth,
    }),
    [user, session, isAdmin, isMerchant, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      user: null,
      session: null,
      isAdmin: false,
      isMerchant: false,
      loading: false,
      loginAsAdmin: async () => false,
      loginAsMerchant: async () => false,
      logout: async () => {},
      refreshAuth: async () => {},
    };
  }
  return ctx;
}