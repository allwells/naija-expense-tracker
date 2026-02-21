import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { SettingsClient } from "@/components/Settings";
import { createServiceClient } from "@/lib/supabase";

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const supabase = createServiceClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (error || !profile) {
    // If the profile is completely missing, redirect to onboarding
    // where ensureProfile is fully handled
    redirect("/onboarding");
  }

  return (
    <div className="w-full">
      <Header title="Settings" />
      <main className="mt-8 px-4 md:px-6">
        <div className="max-w-12xl mx-auto">
          <SettingsClient profile={profile} />
        </div>
      </main>
    </div>
  );
}
