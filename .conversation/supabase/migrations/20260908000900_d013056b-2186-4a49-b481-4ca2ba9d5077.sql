-- 1) wholesale price column
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS wholesale_price numeric NOT NULL DEFAULT 0;

-- 2) merchant profiles
CREATE TABLE public.merchant_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_name text NOT NULL,
  owner_name text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.merchant_profiles TO authenticated;
GRANT ALL ON public.merchant_profiles TO service_role;

ALTER TABLE public.merchant_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "merchant own read" ON public.merchant_profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "merchant own insert" ON public.merchant_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "merchant own update" ON public.merchant_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "merchant admin read" ON public.merchant_profiles
  FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE POLICY "merchant admin update" ON public.merchant_profiles
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE TRIGGER merchant_profiles_touch BEFORE UPDATE ON public.merchant_profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- validate: only admins may change status; new rows always start pending
CREATE OR REPLACE FUNCTION public.validate_merchant_profile()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE is_admin boolean;
BEGIN
  NEW.shop_name := btrim(NEW.shop_name);
  NEW.owner_name := btrim(NEW.owner_name);
  NEW.phone := btrim(NEW.phone);
  NEW.address := btrim(coalesce(NEW.address, ''));

  IF char_length(NEW.shop_name) < 2 OR char_length(NEW.shop_name) > 120 THEN
    RAISE EXCEPTION 'invalid shop name';
  END IF;
  IF char_length(NEW.owner_name) < 2 OR char_length(NEW.owner_name) > 120 THEN
    RAISE EXCEPTION 'invalid owner name';
  END IF;
  IF NEW.phone !~ '^[0-9+()\-\s]{7,20}$' THEN
    RAISE EXCEPTION 'invalid phone';
  END IF;
  IF char_length(NEW.address) > 300 THEN
    RAISE EXCEPTION 'invalid address';
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin') INTO is_admin;

  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pending';
  ELSE
    IF NEW.status IS DISTINCT FROM OLD.status AND NOT is_admin THEN
      RAISE EXCEPTION 'not allowed to change status';
    END IF;
    IF NEW.status NOT IN ('pending','approved','rejected','suspended') THEN
      RAISE EXCEPTION 'invalid status';
    END IF;
    NEW.user_id := OLD.user_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER merchant_profiles_validate BEFORE INSERT OR UPDATE ON public.merchant_profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_merchant_profile();

-- 3) hide wholesale_price at column level
REVOKE SELECT ON public.products FROM anon, authenticated;
GRANT SELECT (id, category_id, name, description, price, old_price, image_url, open_image_url, stock, featured, is_active, created_at, updated_at)
  ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

-- 4) wholesale price access only for approved merchants + admins
CREATE OR REPLACE FUNCTION public.is_wholesale(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.merchant_profiles mp WHERE mp.user_id = _user_id AND mp.status = 'approved');
$$;

REVOKE ALL ON FUNCTION public.is_wholesale(uuid) FROM PUBLIC, anon, authenticated;

CREATE VIEW public.products_wholesale_prices AS
  SELECT p.id, p.wholesale_price
  FROM public.products p
  WHERE p.is_active
    AND (
      public.is_wholesale(auth.uid())
      OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
    );

REVOKE ALL ON public.products_wholesale_prices FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.products_wholesale_prices TO authenticated;
GRANT ALL ON public.products_wholesale_prices TO service_role;