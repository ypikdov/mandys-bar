-- Supabase Storage policies for Mandy's Bar image buckets.
-- Run with a database role allowed to manage policies on storage.objects.
-- Buckets are public-read; writes are performed only by the backend service role.

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'mandys_public_read_image_buckets'
  ) THEN
    CREATE POLICY mandys_public_read_image_buckets
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id IN ('product-images', 'gallery', 'events', 'users-avatars'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'mandys_service_insert_image_buckets'
  ) THEN
    CREATE POLICY mandys_service_insert_image_buckets
    ON storage.objects
    FOR INSERT
    TO service_role
    WITH CHECK (bucket_id IN ('product-images', 'gallery', 'events', 'users-avatars'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'mandys_service_update_image_buckets'
  ) THEN
    CREATE POLICY mandys_service_update_image_buckets
    ON storage.objects
    FOR UPDATE
    TO service_role
    USING (bucket_id IN ('product-images', 'gallery', 'events', 'users-avatars'))
    WITH CHECK (bucket_id IN ('product-images', 'gallery', 'events', 'users-avatars'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'mandys_service_delete_image_buckets'
  ) THEN
    CREATE POLICY mandys_service_delete_image_buckets
    ON storage.objects
    FOR DELETE
    TO service_role
    USING (bucket_id IN ('product-images', 'gallery', 'events', 'users-avatars'));
  END IF;
END $$;
