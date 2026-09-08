-- Remove public read on the base table; the wheel_prizes_public view (no code column) serves the listing
DROP POLICY IF EXISTS "prizes public read" ON public.wheel_prizes;
REVOKE SELECT ON public.wheel_prizes FROM anon;
-- Ensure view grants stay read-only for public roles
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.wheel_prizes_public FROM anon, authenticated;
GRANT SELECT ON public.wheel_prizes_public TO anon, authenticated;
-- Remove the publicly executable SECURITY DEFINER spin function (logic moves server-side)
DROP FUNCTION IF EXISTS public.spin_wheel();