CREATE POLICY "prizes public read" ON public.wheel_prizes
FOR SELECT TO anon, authenticated USING (true);

-- column-level grant: everything except the discount code
GRANT SELECT (id, label, discount_percent, weight, color, is_active, sort_order)
ON public.wheel_prizes TO anon, authenticated;

DROP VIEW IF EXISTS public.wheel_prizes_public;
CREATE VIEW public.wheel_prizes_public
WITH (security_invoker = on) AS
SELECT id, label, discount_percent, weight, color, is_active, sort_order
FROM public.wheel_prizes
WHERE is_active = true;

GRANT SELECT ON public.wheel_prizes_public TO anon, authenticated;