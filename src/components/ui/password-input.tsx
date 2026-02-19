import * as React from "react";
import { cn } from "@/lib/utils";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import { Input, Button } from "@/components/ui";

const PasswordInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, ...props }, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <div className="relative flex items-center">
      <Input
        type={showPassword ? "text" : "password"}
        className={cn("pr-10", className)}
        ref={ref}
        {...props}
      />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setShowPassword((prev) => !prev)}
        disabled={props.disabled}
        className="absolute right-1.5 rounded-sm border-none! h-fit w-fit p-2 hover:bg-transparent text-muted-foreground"
      >
        {showPassword ? (
          <IconEyeOff className="h-4 w-4 shrink-0" aria-hidden="true" />
        ) : (
          <IconEye className="h-4 w-4 shrink-0" aria-hidden="true" />
        )}
        <span className="sr-only">
          {showPassword ? "Hide password" : "Show password"}
        </span>
      </Button>
    </div>
  );
});
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
