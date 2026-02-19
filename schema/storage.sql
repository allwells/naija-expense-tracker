-- NaijaExpense Storage Configuration
-- Run AFTER rls.sql

-- ============================================================
-- RECEIPTS BUCKET
-- ============================================================

-- Create the receipts bucket (public read for receipt URLs in exports)
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true);

-- Allow authenticated users to upload to their own folder
CREATE POLICY "receipts_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow public read access (receipts are referenced in CSV exports)
CREATE POLICY "receipts_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'receipts');

-- Allow owner to delete their own receipts
CREATE POLICY "receipts_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
