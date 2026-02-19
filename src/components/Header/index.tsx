"use client";

import { useTheme } from "next-themes";
import Link from "next/link";
import { signOut, useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import {
  IconUserCircle,
  IconLogout,
  IconSun,
  IconMoon,
  IconSettings,
} from "@tabler/icons-react";
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
        "flex h-16 w-full items-center justify-between border-b border-border/70 px-4 md:px-6",
        className,
      )}
    >
      <h1 className="text-lg font-semibold tracking-tight md:text-xl">
        {title}
      </h1>

      <div className="flex items-center gap-2">
        {children}

        {/* Profile Dropdown */}
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <IconUserCircle className="size-6" />
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {session?.user?.name || "Admin User"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session?.user?.email || "admin@example.com"}
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

              {/* Mobile Only Items */}
              <div className="md:hidden">
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  <div className="relative flex h-fit w-fit shrink-0 items-center justify-center">
                    <IconSun className="size-5 shrink-0 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <IconMoon className="absolute size-5 shrink-0 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  </div>
                  <span>{theme === "dark" ? "Light" : "Dark"} Theme</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-destructive focus:text-destructive"
                >
                  <IconLogout className="size-5" />
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
