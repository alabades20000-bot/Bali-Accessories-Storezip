import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type WheelPrize = {
  id: string;
  label: string;
  discount_percent: number;
  code: string | null;
  color: string;
  weight?: number;
  is_active?: boolean;
  sort_order?: number;
};

// Server-side weighted wheel spin. Runs with the service role so discount
// codes are never exposed publicly — the code is only returned after a spin.
export const spinWheel = createServerFn({ method: "POST" }).handler(
  async (): Promise<WheelPrize | null> => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const { data, error } = await supabaseAdmin
      .from("wheel_prizes")
      .select("id,label,discount_percent,code,color,weight")
      .eq("is_active", true);

    if (error) {
      console.error("[wheel] failed to load prizes", error.message);
      throw new Error("تعذر تشغيل العجلة، حاول مرة أخرى");
    }

    const prizes = (data ?? []).filter((p) => (p.weight ?? 0) > 0);
    if (prizes.length === 0) return null;

    const totalWeight = prizes.reduce((sum, p) => sum + p.weight, 0);
    let roll = Math.random() * totalWeight;
    for (const prize of prizes) {
      roll -= prize.weight;
      if (roll <= 0) {
        return {
          id: prize.id,
          label: prize.label,
          discount_percent: prize.discount_percent,
          code: prize.code,
          color: prize.color,
        };
      }
    }

    const last = prizes[prizes.length - 1];
    if (!last) return null;
    return {
      id: last.id,
      label: last.label,
      discount_percent: last.discount_percent,
      code: last.code,
      color: last.color,
    };
  },
);

// التحقق من صلاحية كود الخصم وإرجاع نسبة الخصم
export const verifyDiscountCode = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string }) => {
    if (!input?.code || typeof input.code !== "string") {
      throw new Error("يرجى إدخال كود الخصم");
    }
    return { code: input.code.trim().toUpperCase() };
  })
  .handler(
    async ({
      data,
    }): Promise<{ valid: boolean; discountPercent: number; label?: string }> => {
      const { supabaseAdmin } = await import(
        "@/integrations/supabase/client.server"
      );

      const { data: prize, error } = await supabaseAdmin
        .from("wheel_prizes")
        .select("label,discount_percent")
        .ilike("code", data.code)
        .eq("is_active", true)
        .maybeSingle();

      if (error || !prize || (prize.discount_percent ?? 0) <= 0) {
        return { valid: false, discountPercent: 0 };
      }

      return {
        valid: true,
        discountPercent: Number(prize.discount_percent),
        label: prize.label,
      };
    },
  );

// للأدمن فقط: استعراض جميع جوائز العجلة مع الأكواد والأوزان
export const getAdminWheelPrizes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<WheelPrize[]> => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const { data: role } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!role) throw new Error("غير مصرح - للمدير فقط");

    const { data, error } = await supabaseAdmin
      .from("wheel_prizes")
      .select("id,label,discount_percent,code,color,weight,is_active,sort_order")
      .order("sort_order", { ascending: true });

    if (error) throw new Error("تعذر جلب الجوائز");
    return (data ?? []) as WheelPrize[];
  });

// للأدمن فقط: تحديث جائزة في عجلة الحظ
export const updateWheelPrizeAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      id: string;
      label: string;
      discount_percent: number;
      code: string | null;
      color: string;
      weight: number;
      is_active: boolean;
    }) => {
      if (!input?.id) throw new Error("معرّف الجائزة غير صالح");
      return input;
    },
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const { data: role } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!role) throw new Error("غير مصرح");

    const { error } = await supabaseAdmin
      .from("wheel_prizes")
      .update({
        label: data.label.trim(),
        discount_percent: Number(data.discount_percent) || 0,
        code: data.code ? data.code.trim().toUpperCase() : null,
        color: data.color.trim(),
        weight: Math.max(0, Number(data.weight) || 0),
        is_active: data.is_active,
      })
      .eq("id", data.id);

    if (error) throw new Error("تعذر تحديث الجائزة");
    return { ok: true };
  });