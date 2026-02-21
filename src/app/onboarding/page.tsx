import { Logo } from "@/components/Logo";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { OnboardingClient } from "@/components/Onboarding";
import { LogoutButton } from "@/components/Navigation/LogoutButton";
import { ensureProfileExistsAction } from "@/app/actions/profile-actions";

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
    <div className="min-h-screen bg-background flex flex-col items-center">
      <header className="w-full h-14 border-b flex justify-center items-center sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="container flex justify-between items-center">
          <Logo compact />

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center container">
        <OnboardingClient initialProfile={result.data} />
      </main>
    </div>
  );
}
