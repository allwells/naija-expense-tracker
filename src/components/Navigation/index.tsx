"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconReceipt,
  IconReceiptFilled,
  IconCreditCard,
  IconCreditCardFilled,
  IconChartPie,
  IconChartPieFilled,
  IconLogout,
  IconLayoutDashboard,
  IconLayoutDashboardFilled,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import { signOut } from "@/lib/auth-client";
import { Button, Separator } from "@/components/ui";
import { ThemeToggle } from "@/components/ThemeToggle";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: IconLayoutDashboard,
    activeIcon: IconLayoutDashboardFilled,
  },
  {
    href: "/expenses",
    label: "Expenses",
    icon: IconReceipt,
    activeIcon: IconReceiptFilled,
  },
  {
    href: "/income",
    label: "Income",
    icon: IconCreditCard,
    activeIcon: IconCreditCardFilled,
  },
  {
    href: "/reports",
    label: "Reports",
    icon: IconChartPie,
    activeIcon: IconChartPieFilled,
  },
] as const;

export function Navigation() {
  const pathname = usePathname();

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
    <>
      {/* Desktop sidebar — hidden on mobile */}
      <aside className="hidden md:flex w-64 flex-col bg-sidebar border-r border-border/70">
        <div className="flex h-16 items-center px-4 border-b border-border/70">
          <Logo />
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 px-3 py-2.5 text-base transition-all rounded-sm hover:pl-4",
                  isActive
                    ? "bg-sidebar-accent text-primary font-semibold"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground",
                )}
              >
                {/* Active Indicator */}
                <div
                  className={cn(
                    "absolute left-0 h-6 w-1 rounded-r-full bg-primary transition-all duration-300 ease-in-out",
                    isActive
                      ? "opacity-100 scale-y-100"
                      : "opacity-0 scale-y-0",
                  )}
                />

                {isActive ? (
                  <item.activeIcon className="size-5.5 shrink-0 transition-colors text-primary" />
                ) : (
                  <item.icon className="size-5.5 shrink-0 transition-colors group-hover:text-foreground stroke-[1.5]" />
                )}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Separator />

        <div className="flex items-center justify-between px-3 py-3">
          <ThemeToggle />

          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="h-9 w-9 border-2 border-border"
          >
            <IconLogout className="h-4 w-4 shrink-0" />
            <span className="sr-only">Sign out</span>
          </Button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t-2 bg-background/80 backdrop-blur-lg md:hidden">
        <div className="flex items-center justify-around p-2">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex flex-1 flex-col items-center gap-1 px-2 pb-1 pt-2 text-[10px] font-medium transition-all hover:text-primary",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              >
                {/* Active Indicator */}
                <div
                  className={cn(
                    "absolute -top-2 h-1 w-12 rounded-b-full bg-primary shadow-sm shadow-primary/50 transition-all duration-300",
                    isActive ? "opacity-100 scale-100" : "opacity-0 scale-0",
                  )}
                />

                {isActive ? (
                  <item.activeIcon className="h-5 w-5 transition-transform duration-300 scale-110" />
                ) : (
                  <item.icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                )}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
