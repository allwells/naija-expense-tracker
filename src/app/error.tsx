"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui";
import { IconAlertTriangle } from "@tabler/icons-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <IconAlertTriangle className="size-8 text-destructive stroke-[1.5]" />
      </div>
      <h2 className="mb-2 text-2xl font-bold tracking-tight">
        Something went wrong!
      </h2>
      <p className="mb-6 max-w-md text-muted-foreground text-sm">
        We encountered an unexpected error. Please try again or contact support
        if the problem persists.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => window.location.reload()} variant="outline">
          Refresh page
        </Button>
        <Button onClick={() => reset()}>Try again</Button>
      </div>
    </div>
  );
}
