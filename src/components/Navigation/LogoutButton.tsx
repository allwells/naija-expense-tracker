"use client";

import { Button } from "@/components/ui/button";
import { IconLogout } from "@tabler/icons-react";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export function LogoutButton({ className }: { className?: string }) {
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
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={handleSignOut}
      className={cn("border border-border shrink-0 py-2 px-2", className)}
      title="Logout"
    >
      <IconLogout className="size-4" />
      <span className="sr-only">Logout</span>
    </Button>
  );
}
