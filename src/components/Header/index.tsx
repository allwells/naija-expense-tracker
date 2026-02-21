"use client";

import { useTheme } from "next-themes";
import Link from "next/link";
import { signOut, useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import {
  IconUserFilled,
  IconLogout,
  IconSun,
  IconMoon,
  IconSettings,
  IconRefresh,
} from "@tabler/icons-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  className?: string;
  children?: React.ReactNode;
}

export function Header({ title, className, children }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const { currency, refreshRates, isLoading } = useCurrency();

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
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 focus-visible:ring-0 focus-visible:ring-offset-0 px-2 lg:px-3 text-muted-foreground hidden sm:flex"
            onClick={() => refreshRates()}
            disabled={isLoading}
            title="Refresh live exchange rates"
          >
            <IconRefresh
              className={cn("size-3.5", isLoading && "animate-spin")}
            />
            <span className="sr-only lg:not-sr-only">Refresh Rates</span>
          </Button>
        )}

        {/* Profile Dropdown */}
        <div className="h-fit relative flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="overflow-hidden">
                <IconUserFilled className="size-6.5 -mb-2 stroke-[1.2] text-primary/30" />
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
                <Link href="/settings" className="cursor-pointer">
                  <IconSettings className="size-5" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>

              {currency !== "NGN" && (
                <DropdownMenuItem
                  onClick={() => refreshRates()}
                  disabled={isLoading}
                  className="sm:hidden cursor-pointer"
                >
                  <IconRefresh
                    className={cn("size-5", isLoading && "animate-spin")}
                  />
                  <span>Refresh Rates</span>
                </DropdownMenuItem>
              )}

              {/* Mobile Only Items */}
              <div className="md:hidden">
                {/* <DropdownMenuSeparator /> */}
                <DropdownMenuItem
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  <div className="relative flex h-fit w-fit shrink-0 items-center justify-center">
                    <IconSun className="size-5 shrink-0 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <IconMoon className="absolute size-5 shrink-0 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  </div>
                  <span>Toggle Theme</span>
                </DropdownMenuItem>
                {/* <DropdownMenuSeparator /> */}
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-destructive focus:text-destructive"
                >
                  <IconLogout className="size-5 text-destructive" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
