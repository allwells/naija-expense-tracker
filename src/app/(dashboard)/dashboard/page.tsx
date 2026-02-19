import { Header } from "@/components/Header";
import { IconLayoutDashboard } from "@tabler/icons-react";

export default function DashboardPage() {
  return (
    <div className="w-full">
      <Header title="Dashboard" />

      <div className="mt-8 flex flex-col items-center justify-center py-16 px-4 md:px-6 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center border-2 border-dashed border-border">
          <IconLayoutDashboard className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold">Dashboard coming soon</h3>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Charts, tax liability, and financial overview will appear here in
          Phase 6.
        </p>
      </div>
    </div>
  );
}
