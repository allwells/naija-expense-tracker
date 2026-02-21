"use client";

import { DangerZone } from "./DangerZone";
import { ProfileForm } from "./ProfileForm";
import { TaxSettingsForm } from "./TaxSettingsForm";
import { CurrencySettings } from "./CurrencySettings";
import type { ProfileRow } from "@/types/database";

export function SettingsClient({ profile }: { profile: ProfileRow }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 pb-8">
      <ProfileForm profile={profile} />
      <TaxSettingsForm profile={profile} />
      <CurrencySettings profile={profile} />
      <DangerZone userId={profile.id} />
    </div>
  );
}
