import { IconCashBanknote } from "@tabler/icons-react";

interface LogoProps {
  collapsed?: boolean;
}

export function Logo({ collapsed = false }: LogoProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center border-2 border-foreground bg-primary text-primary-foreground rounded">
        <IconCashBanknote className="h-6 w-6" />
      </div>
      {!collapsed && (
        <span className="text-lg font-semibold tracking-tight">
          NaijaExpense
        </span>
      )}
    </div>
  );
}
