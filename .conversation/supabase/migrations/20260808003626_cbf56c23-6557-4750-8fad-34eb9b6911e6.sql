
-- 1) Replace admin policies to avoid needing EXECUTE on the SECURITY DEFINER helper
DROP POLICY IF EXISTS "categories admin write" ON public.categories;
CREATE POLICY "categories admin write" ON public.categories FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::public.app_role))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::public.app_role));

DROP POLICY IF EXISTS "products admin write" ON public.products;
CREATE POLICY "products admin write" ON public.products FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::public.app_role))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::public.app_role));

DROP POLICY IF EXISTS "prizes admin write" ON public.wheel_prizes;
CREATE POLICY "prizes admin write" ON public.wheel_prizes FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::public.app_role))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::public.app_role));

DROP POLICY IF EXISTS "orders admin read" ON public.orders;
CREATE POLICY "orders admin read" ON public.orders FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::public.app_role));

DROP POLICY IF EXISTS "orders admin update" ON public.orders;
CREATE POLICY "orders admin update" ON public.orders FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::public.app_role))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::public.app_role));

DROP POLICY IF EXISTS "orders admin delete" ON public.orders;
CREATE POLICY "orders admin delete" ON public.orders FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::public.app_role));

DROP POLICY IF EXISTS "order items admin read" ON public.order_items;
CREATE POLICY "order items admin read" ON public.order_items FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::public.app_role));

DROP POLICY IF EXISTS "order items admin write" ON public.order_items;
CREATE POLICY "order items admin write" ON public.order_items FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::public.app_role))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::public.app_role));

DROP POLICY IF EXISTS "order items admin delete" ON public.order_items;
CREATE POLICY "order items admin delete" ON public.order_items FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::public.app_role));

-- 2) Remove direct callability of the SECURITY DEFINER helper by API roles
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 3) Server-side validation for public order submissions
CREATE OR REPLACE FUNCTION public.validate_order()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.customer_name := btrim(NEW.customer_name);
  NEW.phone := btrim(NEW.phone);
  NEW.address := btrim(coalesce(NEW.address, ''));

  IF char_length(NEW.customer_name) < 2 OR char_length(NEW.customer_name) > 100 THEN
    RAISE EXCEPTION 'invalid customer name';
  END IF;
  IF NEW.phone !~ '^[0-9+()\-\s]{7,20}$' THEN
    RAISE EXCEPTION 'invalid phone';
  END IF;
  IF char_length(NEW.address) > 300 THEN
    RAISE EXCEPTION 'invalid address';
  END IF;
  IF NEW.note IS NOT NULL AND char_length(NEW.note) > 500 THEN
    RAISE EXCEPTION 'invalid note';
  END IF;
  IF NEW.discount_code IS NOT NULL AND char_length(NEW.discount_code) > 30 THEN
    RAISE EXCEPTION 'invalid discount code';
  END IF;
  IF NEW.total < 0 OR NEW.total > 100000000 THEN
    RAISE EXCEPTION 'invalid total';
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pending';
  ELSIF NEW.status NOT IN ('pending','confirmed','shipped','delivered','cancelled') THEN
    RAISE EXCEPTION 'invalid status';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_validate ON public.orders;
CREATE TRIGGER orders_validate BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.validate_order();

CREATE OR REPLACE FUNCTION public.validate_order_item()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.product_name := btrim(NEW.product_name);
  IF char_length(NEW.product_name) < 1 OR char_length(NEW.product_name) > 200 THEN
    RAISE EXCEPTION 'invalid product name';
  END IF;
  IF NEW.quantity < 1 OR NEW.quantity > 1000 THEN
    RAISE EXCEPTION 'invalid quantity';
  END IF;
  IF NEW.unit_price < 0 OR NEW.unit_price > 100000000 THEN
    RAISE EXCEPTION 'invalid unit price';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS order_items_validate ON public.order_items;
CREATE TRIGGER order_items_validate BEFORE INSERT OR UPDATE ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.validate_order_item();

REVOKE ALL ON FUNCTION public.validate_order() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_order_item() FROM PUBLIC, anon, authenticated;
