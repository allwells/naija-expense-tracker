import { type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: React.ElementType<{ className?: string }>;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  children,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center bg-background border rounded-xl shadow-sm h-[300px] w-full ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4 border border-dashed border-border">
        <Icon className="size-6 text-muted-foreground stroke-[1.5]" />
      </div>
      <h3 className="mb-1 text-lg font-semibold tracking-tight">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-[250px]">
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick} variant="outline" size="sm">
          {action.label}
        </Button>
      )}
      {children}
    </div>
  );
}
