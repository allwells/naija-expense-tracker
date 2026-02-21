import { Navigation } from "@/components/Navigation";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { createServiceClient } from "@/lib/supabase";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServiceClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userCurrency = "NGN";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("currency_preference")
      .eq("id", user.id)
      .single();
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
