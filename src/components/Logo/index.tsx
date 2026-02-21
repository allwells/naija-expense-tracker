import { cn } from "@/lib/utils";
import { IconCoins } from "@tabler/icons-react";

interface LogoProps {
  compact?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
}

export function Logo({
  compact = false,
  collapsed = false,
  onClick,
}: LogoProps) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        onClick={onClick}
        className={cn(
          "flex h-6.5 w-6.5 items-center justify-center bg-foreground text-background rounded-xs",
          {
            "cursor-pointer": onClick,
          },
        )}
      >
        <IconCoins className="h-5 w-5" />
      </div>

      {!collapsed && (
        <span
          className={cn("uppercase tracking-wider", {
            "flex flex-col text-xs leading-none": compact,
            "text-sm leading-none": !compact,
          })}
        >
          Naija <span className="font-bold">Expense</span>
        </span>
      )}
    </div>
  );
}
