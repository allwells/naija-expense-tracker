"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { signOut, useSession } from "@/lib/auth-client";
import {
  IconUser,
  IconLogout,
  IconSun,
  IconMoon,
  IconSettings,
  IconRefresh,
} from "@tabler/icons-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  getCurrencySymbol,
  formatAmount as formatBaseAmount,
} from "@/lib/format";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  Button,
  Skeleton,
} from "@/components/ui";

interface HeaderProps {
  title: string;
  className?: string;
  children?: React.ReactNode;
}

export function Header({ title, className, children }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const {
    currency,
    refreshRates,
    isLoading,
    format: formatAmount,
    convertToNgn,
  } = useCurrency();

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/login";
        },
      },
    });
  };

  return (
    <div
      className={cn(
        "flex md:h-14 h-12 w-full items-center justify-between border-b border-border bg-background sticky top-0 z-50 px-4 md:px-6",
        className,
      )}
    >
      <h1 className="text-base font-semibold tracking-tight md:text-xl">
        {title}
      </h1>

      <div className="flex items-center gap-2 h-fit">
        {children}

        {/* Global Currency Refresh Button (only useful if currency is not NGN or for global refresh context) */}
        {currency !== "NGN" && (
          <div className="flex items-center gap-2">
            {isLoading ? (
              <Skeleton className="h-8 w-16 bg-muted-foreground/10" />
            ) : (
              <span className="text-xs font-mono font-medium text-muted-foreground px-2 bg-muted/50 h-8 flex items-center border border-dashed rounded-sm">
                {getCurrencySymbol(currency)}1 ={" "}
                {formatBaseAmount(convertToNgn(1), "NGN")}
              </span>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                try {
                  await refreshRates(true);
                } catch (error) {
                  toast.error("Refresh Failed", {
                    description:
                      "Could not update exchange rates. Please try again.",
                  });
                }
              }}
              disabled={isLoading}
              title="Refresh live exchange rates"
              className="px-2! text-muted-foreground"
            >
              <IconRefresh
                className={cn("size-4 stroke-[1.3]", {
                  "animate-spin": isLoading,
                })}
              />
              <span className="sr-only lg:not-sr-only">
                {isLoading ? "Refreshing..." : "Refresh Rates"}
              </span>
            </Button>
          </div>
        )}

        {/* Profile Dropdown */}
        <div className="h-fit relative flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="overflow-hidden">
                <IconUser className="size-8.5 -mb-3 stroke-[0.85] text-primary/30" />
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-46">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {session?.user?.name || ""}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session?.user?.email || ""}
                  </p>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <IconSettings className="size-5" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                <div className="relative flex h-fit w-fit shrink-0 items-center justify-center">
                  <IconSun className="size-5 shrink-0 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <IconMoon className="absolute size-5 shrink-0 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                </div>
                <span>Toggle Theme</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-destructive focus:text-destructive"
              >
                <IconLogout className="size-5 text-destructive" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
