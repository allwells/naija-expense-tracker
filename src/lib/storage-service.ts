import { createServiceClient } from "@/lib/supabase";

const BUCKET = "receipts";

// ----------------------------------------------------------------
// uploadReceipt — server-only (called from server actions)
// Path convention: {userId}/{expenseId}/{filename}
// ----------------------------------------------------------------

export async function uploadReceipt(
  userId: string,
  expenseId: string,
  file: File,
): Promise<{ url: string; storagePath: string; filename: string }> {
  const supabase = createServiceClient();

  const ext = file.name.split(".").pop() ?? "jpg";
  const filename = `${Date.now()}.${ext}`;
  const storagePath = `${userId}/${expenseId}/${filename}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error)
    throw new Error(
      "Receipt upload failed. Check your connection and try again.",
    );

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  return {
    url: data.publicUrl,
    storagePath,
    filename: file.name,
  };
}

// ----------------------------------------------------------------
// deleteReceipt
// ----------------------------------------------------------------

export async function deleteReceipt(storagePath: string): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase.storage.from(BUCKET).remove([storagePath]);

  if (error) throw new Error("Failed to delete receipt. Please try again.");
}

// ----------------------------------------------------------------
// getReceiptUrl — returns a fresh public URL for a stored receipt
// ----------------------------------------------------------------

export function getReceiptUrl(storagePath: string): string {
  const supabase = createServiceClient();
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}
