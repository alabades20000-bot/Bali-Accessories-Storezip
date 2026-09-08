import { createServerFn } from "@tanstack/react-start";

export type WholesaleAccess = {
  isWholesale: boolean;
  isAdmin: boolean;
  prices: Record<string, number>;
};

/**
 * أسعار الجملة للمستخدم المسجل: يتم جلبها لأصحاب المحلات المعتمدين وللإدارة
 */
export const getWholesalePrices = createServerFn({ method: "POST" }).handler(
  async (): Promise<WholesaleAccess> => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data, error } = await supabaseAdmin
        .from("products")
        .select("id,wholesale_price,price")
        .eq("is_active", true);

      if (error || !data) {
        return { isWholesale: true, isAdmin: false, prices: {} };
      }

      const prices: Record<string, number> = {};
      for (const row of data) {
        const wp = Number((row as any).wholesale_price);
        const regularPrice = Number((row as any).price || 0);
        prices[row.id] = wp > 0 ? wp : Math.round(regularPrice * 0.85);
      }

      return { isWholesale: true, isAdmin: false, prices };
    } catch (e) {
      console.error("[wholesale] failed to load prices", e);
      return { isWholesale: true, isAdmin: false, prices: {} };
    }
  },
);

/** للأدمن: جلب جميع المنتجات في المتجر مع تفاصيلها الكاملة وسعري المفرد والجملة */
export const getAdminProductsPrices = createServerFn({ method: "POST" }).handler(
  async () => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data, error } = await supabaseAdmin
        .from("products")
        .select("id,name,description,price,wholesale_price,old_price,stock,image_url,open_image_url,category_id,featured,is_active,created_at")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[admin] error loading products:", error.message);
        return [];
      }
      return (data ?? []) as any[];
    } catch (e) {
      console.error("[admin] error in getAdminProductsPrices:", e);
      return [];
    }
  },
);

/** للأدمن: تعديل سعر المفرد أو سعر الجملة أو المخزون لمنتج */
export const updateProductPrices = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { productId: string; price?: number; wholesalePrice?: number; stock?: number }) => {
      if (!input?.productId || typeof input.productId !== "string") {
        throw new Error("معرّف المنتج غير صالح");
      }
      return {
        productId: input.productId.trim(),
        price: input.price !== undefined ? Math.max(0, Number(input.price)) : undefined,
        wholesalePrice:
          input.wholesalePrice !== undefined ? Math.max(0, Number(input.wholesalePrice)) : undefined,
        stock: input.stock !== undefined ? Math.max(0, Number(input.stock)) : undefined,
      };
    },
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const updateData: { price?: number; wholesale_price?: number; stock?: number; updated_at?: string } = {
      updated_at: new Date().toISOString(),
    };
    if (data.price !== undefined) {
      updateData.price = data.price;
    }
    if (data.wholesalePrice !== undefined) {
      updateData.wholesale_price = data.wholesalePrice;
    }
    if (data.stock !== undefined) {
      updateData.stock = data.stock;
    }

    const { error } = await supabaseAdmin
      .from("products")
      .update(updateData)
      .eq("id", data.productId);

    if (error) {
      console.error("[wholesale] update error", error);
      throw new Error("تعذر حفظ السعر: " + error.message);
    }
    return { ok: true };
  });

/** للأدمن: حفظ وتحديث مجموعة أسعار ومخزون دفعة واحدة */
export const updateBatchProductPrices = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      updates: Array<{ productId: string; price?: number; wholesalePrice?: number; stock?: number }>;
    }) => {
      if (!Array.isArray(input?.updates)) throw new Error("بيانات غير صالحة");
      return input;
    },
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    for (const item of data.updates) {
      const updateData: { price?: number; wholesale_price?: number; stock?: number; updated_at?: string } = {
        updated_at: new Date().toISOString(),
      };
      if (item.price !== undefined && item.price >= 0) {
        updateData.price = Number(item.price);
      }
      if (item.wholesalePrice !== undefined && item.wholesalePrice >= 0) {
        updateData.wholesale_price = Number(item.wholesalePrice);
      }
      if (item.stock !== undefined && item.stock >= 0) {
        updateData.stock = Number(item.stock);
      }
      if (Object.keys(updateData).length > 1) {
        await supabaseAdmin
          .from("products")
          .update(updateData)
          .eq("id", item.productId);
      }
    }

    return { ok: true };
  });

/** للأدمن: إنشاء أو تعديل منتج كامل مع كافة تفاصيله وصوره وسعري المفرد والجملة */
export const upsertAdminProduct = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      id?: string;
      name: string;
      description: string;
      price: number;
      wholesale_price: number;
      old_price: number | null;
      stock: number;
      image_url: string | null;
      open_image_url: string | null;
      category_id: string | null;
      featured: boolean;
      is_active: boolean;
    }) => {
      if (!input?.name?.trim()) throw new Error("اسم المنتج مطلوب");
      return input;
    },
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const payload = {
      name: data.name.trim().slice(0, 150),
      description: data.description ? data.description.trim().slice(0, 2000) : "",
      price: Math.max(0, Number(data.price) || 0),
      wholesale_price: Math.max(0, Number(data.wholesale_price) || 0),
      old_price: data.old_price !== null && data.old_price !== undefined ? Math.max(0, Number(data.old_price)) : null,
      stock: Math.max(0, Number(data.stock) || 0),
      image_url: data.image_url || null,
      open_image_url: data.open_image_url || null,
      category_id: data.category_id || null,
      featured: Boolean(data.featured),
      is_active: Boolean(data.is_active),
      updated_at: new Date().toISOString(),
    };

    if (data.id && data.id.trim()) {
      const { error } = await supabaseAdmin
        .from("products")
        .update(payload)
        .eq("id", data.id);
      if (error) throw new Error("تعذر تحديث المنتج: " + error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("products")
        .insert(payload);
      if (error) throw new Error("تعذر إضافة المنتج: " + error.message);
    }

    return { ok: true };
  });

/** للأدمن: حذف منتج من المتجر */
export const deleteAdminProduct = createServerFn({ method: "POST" })
  .inputValidator((input: { productId: string }) => {
    if (!input?.productId) throw new Error("معرّف المنتج غير صالح");
    return input;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("products")
      .delete()
      .eq("id", data.productId);

    if (error) throw new Error("تعذر حذف المنتج: " + error.message);
    return { ok: true };
  });

/** للأدمن: إضافة أو تعديل قسم كامل في المتجر */
export const upsertAdminCategory = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      id?: string;
      name: string;
      slug: string;
      icon: string;
      image_url: string | null;
      sort_order?: number;
    }) => {
      if (!input?.name?.trim()) throw new Error("اسم القسم مطلوب");
      if (!input?.slug?.trim()) throw new Error("الرابط اللطيف (slug) مطلوب");
      return input;
    },
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const payload = {
      name: data.name.trim(),
      slug: data.slug.trim().toLowerCase().replace(/\s+/g, "-"),
      icon: data.icon || "package",
      image_url: data.image_url || null,
      sort_order: Number(data.sort_order) || 0,
      updated_at: new Date().toISOString(),
    };

    if (data.id && data.id.trim()) {
      const { error } = await supabaseAdmin
        .from("categories")
        .update(payload)
        .eq("id", data.id);
      if (error) throw new Error("تعذر تحديث القسم: " + error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("categories")
        .insert(payload);
      if (error) throw new Error("تعذر إضافة القسم: " + error.message);
    }

    return { ok: true };
  });

/** للأدمن: حذف قسم من المتجر */
export const deleteAdminCategory = createServerFn({ method: "POST" })
  .inputValidator((input: { categoryId: string }) => {
    if (!input?.categoryId) throw new Error("معرّف القسم غير صالح");
    return input;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("categories")
      .delete()
      .eq("id", data.categoryId);

    if (error) throw new Error("تعذر حذف القسم: " + error.message);
    return { ok: true };
  });

/** للأدمن: جلب قائمة حسابات أصحاب المحلات */
export const getMerchantsListAdmin = createServerFn({ method: "POST" }).handler(
  async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("merchant_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error("تعذر جلب حسابات التجار");
    return data ?? [];
  },
);

/** للأدمن: تغيير حالة حساب صاحب المحل (معتمد / مرفوض / معلق / موقوف) */
export const setMerchantStatusAdmin = createServerFn({ method: "POST" })
  .inputValidator((input: { merchantId: string; status: string }) => {
    if (!input?.merchantId || !input?.status) throw new Error("بيانات غير كاملة");
    return { merchantId: input.merchantId, status: input.status };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("merchant_profiles")
      .update({ status: data.status })
      .eq("id", data.merchantId);

    if (error) throw new Error("تعذر تغيير حالة الحساب");
    return { ok: true };
  });

/** للأدمن: إنشاء حساب صاحب محل جديد مباشرة واعتماده */
export const createMerchantAccountAdmin = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      email: string;
      password: string;
      shop_name: string;
      owner_name: string;
      phone: string;
      address: string;
    }) => {
      if (!input?.email || !input?.password || !input?.shop_name) {
        throw new Error("بيانات الحساب غير مكتملة");
      }
      return input;
    },
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: userAuth, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email.trim(),
      password: data.password,
      email_confirm: true,
    });

    if (authError || !userAuth?.user) {
      throw new Error(authError?.message || "تعذر إنشاء المستخدم");
    }

    const { error: profileError } = await supabaseAdmin.from("merchant_profiles").insert({
      user_id: userAuth.user.id,
      shop_name: data.shop_name.trim(),
      owner_name: data.owner_name.trim(),
      phone: data.phone.trim(),
      address: data.address.trim(),
      status: "approved",
    });

    if (profileError) {
      throw new Error("تعذر إنشاء ملف صاحب المحل");
    }

    return { ok: true, userId: userAuth.user.id };
  });