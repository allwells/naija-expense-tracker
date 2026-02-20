import { createServiceClient } from "@/lib/supabase";
import { normaliseSupabaseError } from "@/lib/normalise-error";
import type { ProfileRow, ProfileInsert } from "@/types/database";

export async function getProfile(userId: string): Promise<ProfileRow | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(normaliseSupabaseError(error));
  }

  return data as ProfileRow;
}

export async function createProfile(input: ProfileInsert): Promise<ProfileRow> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("profiles")
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(normaliseSupabaseError(error));
  return data as ProfileRow;
}

export async function ensureProfile(
  userId: string,
  name?: string | null,
): Promise<ProfileRow> {
  const profile = await getProfile(userId);
  if (profile) return profile;

  // Create default profile if missing
  return createProfile({
    id: userId,
    full_name: name ?? "",
    business_name: "",
    annual_turnover_ngn: 0,
    fixed_assets_ngn: 0,
    // other fields have defaults in DB or schema
    onboarding_complete: false,
  });
}
