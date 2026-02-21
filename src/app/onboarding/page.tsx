import { OnboardingClient } from "@/components/Onboarding";
import { ensureProfileExistsAction } from "@/app/actions/profile-actions";
import { redirect } from "next/navigation";
import { IconReceiptTax } from "@tabler/icons-react";

export default async function OnboardingPage() {
  const result = await ensureProfileExistsAction();

  if (result.error || !result.data) {
    redirect("/login");
  }

  // If they somehow land here but are already completed, send them home
  if (result.data.onboarding_complete) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-16 border-b flex items-center px-6 sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="flex items-center gap-2 font-semibold">
          <IconReceiptTax className="size-6 text-primary" />
          <span className="tracking-tight">NaijaExpense</span>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center container">
        <OnboardingClient initialProfile={result.data} />
      </main>
    </div>
  );
}
