import { Navigation } from "@/components/Navigation";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { createServiceClient } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServiceClient();
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;

  let userCurrency = "NGN";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("currency_preference, onboarding_complete")
      .eq("id", user.id)
      .single();

    if (!profile?.onboarding_complete) {
      redirect("/onboarding");
    }

    if (profile?.currency_preference) {
      userCurrency = profile.currency_preference;
    }
  }

  return (
    <div className="flex h-screen">
      <Navigation />
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <CurrencyProvider userCurrency={userCurrency}>
          {children}
        </CurrencyProvider>
      </main>
    </div>
  );
}
