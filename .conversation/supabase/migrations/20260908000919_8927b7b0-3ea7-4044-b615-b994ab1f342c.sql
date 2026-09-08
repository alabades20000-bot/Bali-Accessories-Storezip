DROP VIEW IF EXISTS public.products_wholesale_prices;

CREATE OR REPLACE FUNCTION public.get_wholesale_prices()
RETURNS TABLE (id uuid, wholesale_price numeric)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  IF NOT (
    public.is_wholesale(auth.uid())
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY SELECT p.id, p.wholesale_price FROM public.products p WHERE p.is_active;
END;
$$;

REVOKE ALL ON FUNCTION public.get_wholesale_prices() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_wholesale_prices() TO authenticated;