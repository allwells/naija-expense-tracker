import { cn } from "@/lib/utils";
import { IconCoins } from "@tabler/icons-react";

interface LogoProps {
  type?: "compact" | "normal";
  collapsed?: boolean;
  onClick?: () => void;
}

export function Logo({
  type = "normal",
  collapsed = false,
  onClick,
}: LogoProps) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        onClick={onClick}
        className={cn(
          "flex h-6.5 w-6.5 items-center justify-center bg-foreground text-background rounded",
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
            "flex flex-col text-xs leading-none": type === "compact",
            "text-sm leading-none": type === "normal",
          })}
        >
          Naija <span className="font-bold">Expense</span>
        </span>
      )}
    </div>
  );
}
