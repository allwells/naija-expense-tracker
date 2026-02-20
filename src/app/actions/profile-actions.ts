"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ok, fail } from "@/types/actions";
import type { ActionResult } from "@/types/actions";
import { createServiceClient } from "@/lib/supabase";
import { normaliseSupabaseError } from "@/lib/normalise-error";
import { z } from "zod";
import { AUTH_ERRORS, PROFILE_ERRORS } from "@/types/errors";
import { revalidatePath } from "next/cache";
import type { ProfileRow, ProfileUpdate } from "@/types/database";

// ----------------------------------------------------------------
// getProfileAction
// ----------------------------------------------------------------

export async function getProfileAction(): Promise<ActionResult<ProfileRow>> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return fail(AUTH_ERRORS.UNAUTHENTICATED);

  const supabase = createServiceClient();

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (error) return fail(normaliseSupabaseError(error));
    return ok(data as ProfileRow);
  } catch {
    return fail(PROFILE_ERRORS.SAVE_FAILED);
  }
}

// ----------------------------------------------------------------
// updateProfileAction
// ----------------------------------------------------------------

const updateProfileSchema = z.object({
  full_name: z.string().max(200).optional(),
  business_name: z.string().max(200).optional(),
  annual_turnover_ngn: z
    .number()
    .nonnegative(PROFILE_ERRORS.INVALID_TURNOVER)
    .optional(),
  fixed_assets_ngn: z
    .number()
    .nonnegative(PROFILE_ERRORS.INVALID_ASSETS)
    .optional(),
  monthly_rent_ngn: z.number().nonnegative().optional(),
  pension_rate: z.number().min(0).max(1).optional(),
  nhf_rate: z.number().min(0).max(1).optional(),
  tax_year: z.number().int().min(2020).max(2100).optional(),
  currency_preference: z.string().optional(),
  onboarding_complete: z.boolean().optional(),
});

export async function updateProfileAction(
  input: unknown,
): Promise<ActionResult<ProfileRow>> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return fail(AUTH_ERRORS.UNAUTHENTICATED);

  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      parsed.error.issues[0]?.message ??
        "Invalid input. Please check your form.",
    );
  }

  const supabase = createServiceClient();

  try {
    const update: ProfileUpdate = parsed.data;

    const { data, error } = await supabase
      .from("profiles")
      .upsert({ id: session.user.id, ...update })
      .select()
      .single();

    if (error) return fail(normaliseSupabaseError(error));

    revalidatePath("/dashboard");
    revalidatePath("/settings");
    return ok(data as ProfileRow);
  } catch {
    return fail(PROFILE_ERRORS.SAVE_FAILED);
  }
}

// ----------------------------------------------------------------
// ensureProfileExists — creates a profile row if missing (called post-signup)
// ----------------------------------------------------------------

export async function ensureProfileExistsAction(): Promise<
  ActionResult<ProfileRow>
> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return fail(AUTH_ERRORS.UNAUTHENTICATED);

  const supabase = createServiceClient();

  try {
    // Try to get existing profile first
    const { data: existing } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (existing) return ok(existing as ProfileRow);

    // Create new profile
    const { data, error } = await supabase
      .from("profiles")
      .insert({
        id: session.user.id,
        full_name: session.user.name ?? null,
        onboarding_complete: false,
      })
      .select()
      .single();

    if (error) return fail(normaliseSupabaseError(error));
    return ok(data as ProfileRow);
  } catch {
    return fail(PROFILE_ERRORS.SAVE_FAILED);
  }
}
