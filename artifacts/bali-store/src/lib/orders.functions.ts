import { createServerFn } from "@tanstack/react-start";

export type TrackedOrder = {
  id: string;
  order_number: number;
  customer_name: string;
  phone: string;
  address: string;
  status: string;
  total: number;
  created_at: string;
  order_items: {
    id: string;
    product_id?: string | null;
    product_name: string;
    quantity: number;
    unit_price: number;
  }[];
};

/**
 * دالة خادم تتيح للزبون البحث عن فواتيره وتتبع حالتها
 * برقم الهاتف أو رقم الفاتورة
 */
export const trackCustomerOrder = createServerFn({ method: "POST" })
  .inputValidator((input: { query: string }) => {
    if (!input?.query || typeof input.query !== "string") {
      throw new Error("يرجى إدخال رقم الهاتف أو رقم الفاتورة");
    }
    return { query: input.query.trim() };
  })
  .handler(async ({ data }): Promise<TrackedOrder[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const q = data.query;

    const isNumeric = /^\d+$/.test(q);
    let builder = supabaseAdmin
      .from("orders")
      .select("id,order_number,customer_name,phone,address,status,total,created_at,order_items(id,product_name,quantity,unit_price)")
      .order("created_at", { ascending: false })
      .limit(5);

    if (isNumeric && q.length < 7) {
      // رقم فاتورة
      builder = builder.eq("order_number", parseInt(q, 10));
    } else {
      // رقم هاتف
      const phoneDigits = q.replace(/[^\d]/g, "");
      builder = builder.ilike("phone", `%${phoneDigits.slice(-8)}%`);
    }

    const { data: results, error } = await builder;

    if (error) {
      console.error("[orders] track error", error);
      throw new Error("تعذر جلب بيانات الطلب");
    }

    return (results ?? []) as TrackedOrder[];
  });