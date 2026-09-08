
CREATE POLICY "product images admin all" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(),'admin'))
WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "product images read" ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'product-images');
