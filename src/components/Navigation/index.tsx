"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
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
import {
  Button,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui";
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("sidebar_collapsed");
    if (saved) setIsCollapsed(saved === "true");
  }, []);

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem("sidebar_collapsed", String(next));
  };

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/login";
        },
      },
    });
  };

  if (!isMounted)
    return (
      <aside
        className={cn(
          "hidden md:flex bg-sidebar border-r",
          isCollapsed ? "w-14" : "w-64",
        )}
      />
    ); // Prevent hydration mismatch

  return (
    <>
      <TooltipProvider delayDuration={0}>
        {/* Desktop sidebar — hidden on mobile */}
        <aside
          className={cn(
            "hidden md:flex flex-col bg-sidebar border-r",
            isCollapsed ? "w-14" : "w-64",
          )}
        >
          <div
            className={cn(
              "flex md:h-14 h-12 items-center border-b border-border",
              isCollapsed ? "justify-center px-0" : "px-4",
            )}
          >
            <Logo collapsed={isCollapsed} onClick={toggleCollapse} />
          </div>

          <nav
            className={cn(
              "flex-1 py-4",
              isCollapsed ? "px-2 space-y-2" : "px-3 space-y-1",
            )}
          >
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);

              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "group relative flex items-center rounded-sm overflow-hidden outline-none h-10",
                        isActive
                          ? isCollapsed
                            ? "bg-primary text-background"
                            : "bg-sidebar-accent text-primary"
                          : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground",
                        isCollapsed
                          ? "w-fit mx-auto justify-center p-1.5 h-fit"
                          : "gap-3 px-3",
                      )}
                    >
                      {/* Active Indicator */}
                      {!isCollapsed && (
                        <div
                          className={cn(
                            "absolute left-0 w-1 rounded-r-sm bg-primary h-6",
                            isActive
                              ? "opacity-100 scale-y-100"
                              : "opacity-0 scale-y-0",
                          )}
                        />
                      )}

                      {isActive ? (
                        <item.activeIcon
                          className={cn(isCollapsed ? "size-6" : "size-5.5")}
                        />
                      ) : (
                        <item.icon className="stroke-[1.3] group-hover:text-foreground size-5.5" />
                      )}

                      <span
                        className={cn(
                          "whitespace-nowrap overflow-hidden",
                          isCollapsed
                            ? "w-0 opacity-0 ml-0"
                            : "w-auto opacity-100 ml-0",
                        )}
                      >
                        {item.label}
                      </span>
                    </Link>
                  </TooltipTrigger>

                  {isCollapsed && (
                    <TooltipContent side="right" sideOffset={16}>
                      {item.label}
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </nav>

          <Separator />

          <div
            className={cn(
              "flex overflow-hidden",
              isCollapsed
                ? "flex-col gap-2 items-center justify-center py-4"
                : "items-center justify-between px-3 py-3",
            )}
          >
            <Tooltip key="theme">
              <TooltipTrigger asChild>
                <div>
                  <ThemeToggle />
                </div>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right" sideOffset={20}>
                  Theme
                </TooltipContent>
              )}
            </Tooltip>

            <Tooltip key="logout">
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleSignOut}
                  className="border border-border shrink-0"
                >
                  <IconLogout className="size-4" />
                  <span className="sr-only">Logout</span>
                </Button>
              </TooltipTrigger>

              {isCollapsed && (
                <TooltipContent side="right" sideOffset={20}>
                  Logout
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        </aside>
      </TooltipProvider>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/80 backdrop-blur-lg md:hidden">
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
                    "absolute -top-2 h-1 w-12 rounded-b-sm bg-primary transition-all duration-300",
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
