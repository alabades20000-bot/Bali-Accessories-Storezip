DROP POLICY IF EXISTS "product images admin all" ON storage.objects;
CREATE POLICY "product images admin all" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'product-images' AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::public.app_role))
  WITH CHECK (bucket_id = 'product-images' AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::public.app_role));