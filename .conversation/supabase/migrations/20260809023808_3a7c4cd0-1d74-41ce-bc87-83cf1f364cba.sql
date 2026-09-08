-- Remove public read of full wheel_prizes (contains discount codes)
DROP POLICY IF EXISTS "prizes public read" ON public.wheel_prizes;
REVOKE SELECT ON public.wheel_prizes FROM anon;

-- Public-safe view without the code column
CREATE OR REPLACE VIEW public.wheel_prizes_public
WITH (security_invoker = off) AS
SELECT id, label, discount_percent, weight, color, is_active, sort_order
FROM public.wheel_prizes
WHERE is_active = true;

GRANT SELECT ON public.wheel_prizes_public TO anon, authenticated;

-- Server-side weighted spin; only this returns the code
CREATE OR REPLACE FUNCTION public.spin_wheel()
RETURNS TABLE (id uuid, label text, discount_percent integer, code text, color text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_weight bigint;
  roll numeric;
BEGIN
  SELECT COALESCE(SUM(GREATEST(1, w.weight)), 0) INTO total_weight
  FROM public.wheel_prizes w WHERE w.is_active = true;

  IF total_weight = 0 THEN
    RETURN;
  END IF;

  roll := random() * total_weight;

  RETURN QUERY
  WITH ranked AS (
    SELECT w.id, w.label, w.discount_percent, w.code, w.color,
           SUM(GREATEST(1, w.weight)) OVER (ORDER BY w.sort_order, w.id
             ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cum
    FROM public.wheel_prizes w
    WHERE w.is_active = true
  )
  SELECT ranked.id, ranked.label, ranked.discount_percent, ranked.code, ranked.color
  FROM ranked
  WHERE ranked.cum >= roll
  ORDER BY ranked.cum
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.spin_wheel() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.spin_wheel() TO anon, authenticated;