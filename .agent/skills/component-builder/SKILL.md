---
name: component-builder
description: UI component standards for NaijaExpense using Shadcn/ui, Tailwind CSS v4, and the custom monochrome theme (2px borders, 0px radius, Geist font). Use when building any React component — covers dashboard/page header/stats card/form/skeleton/empty state patterns, mobile-first layout with sidebar + bottom nav, FAB button, Naira formatting utility, and color usage guidelines for tax status indicators.
---

# SKILL: Component Builder (Shadcn + Tailwind + Theme)

## Purpose

Standards for building UI components in NaijaExpense using Shadcn/ui, Tailwind CSS v4, and the custom theme.

## Theme Overrides

The theme in `globals.css` must have these overrides applied on top of the base Shadcn theme:

```css
/* BORDER OVERRIDE: 2px everywhere */
.border {
  border-width: 2px;
}
[class*="border-"] {
  border-width: 2px;
}

/* RADIUS OVERRIDE: 0px everywhere */
:root {
  --radius: 0rem;
}
```

Border radius utilities to use: do NOT use `rounded-*` classes. Everything stays sharp/square.

## Component Anatomy

Every component follows this structure:

```
ComponentName/
├── index.tsx           ← default export, top-level orchestrator
├── ComponentPart.tsx   ← sub-components (if needed)
└── hooks/
    └── use-component-name.ts  ← component-specific state/logic
```

## Shadcn Component Usage

Use these Shadcn components — never roll custom replacements:

| Need              | Shadcn Component                     |
| ----------------- | ------------------------------------ |
| Modals / overlays | `Dialog`, `Sheet`                    |
| Notifications     | `Sonner` (toast)                     |
| Forms             | `Form` + `react-hook-form` + `zod`   |
| Dropdowns         | `DropdownMenu`, `Select`             |
| Date picker       | `Calendar` + `Popover`               |
| Tables            | `Table`                              |
| Navigation        | `Sidebar` (Shadcn sidebar component) |
| Loading           | `Skeleton`                           |
| Badges            | `Badge`                              |
| Progress          | `Progress`                           |
| Tooltips          | `Tooltip`                            |
| Tabs              | `Tabs`                               |

## Mobile-First Layout Pattern

```tsx
// Desktop: sidebar + content
// Mobile: content only + bottom nav

// src/app/(dashboard)/layout.tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      {/* Sidebar — hidden on mobile */}
      <aside className="hidden md:flex w-64 flex-col border-r-2 border-border">
        <Navigation />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">{children}</main>

      {/* Bottom nav — mobile only */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden border-t-2 border-border bg-background">
        <BottomNav />
      </nav>
    </div>
  );
}
```

## Page Header Pattern

```tsx
// src/components/Shared/PageHeader.tsx
interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between border-b-2 border-border px-4 py-4 md:px-6 md:py-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
```

## Stats Card Pattern

```tsx
// Consistent stat card used across Dashboard
interface StatsCardProps {
  label: string;
  value: string;
  change?: string; // e.g., "+12% vs last month"
  changePositive?: boolean;
  icon?: React.ReactNode;
}

export function StatsCard({
  label,
  value,
  change,
  changePositive,
  icon,
}: StatsCardProps) {
  return (
    <Card className="border-2">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
        <p className="mt-2 text-2xl font-bold font-mono">{value}</p>
        {change && (
          <p
            className={`mt-1 text-xs ${changePositive ? "text-green-600" : "text-destructive"}`}
          >
            {change}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

## Form Pattern (react-hook-form + zod)

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const schema = z.object({
  amount_ngn: z.number().positive("Amount must be positive"),
  description: z.string().min(1, "Description is required"),
  // ...
});

type FormValues = z.infer<typeof schema>;

// Always use FormField → FormItem → FormLabel + FormControl + FormMessage
```

## Loading State Pattern

Every component that fetches async data needs a skeleton:

```tsx
// Always export a Skeleton variant
export function ExpensesTableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}
```

## Empty State Pattern

```tsx
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 h-16 w-16 border-2 border-dashed border-border flex items-center justify-center">
        <InboxIcon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-xs">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
```

## Naira Formatting Utility

```typescript
// src/lib/format.ts
export function formatNGN(amount: number, compact = false): string {
  if (compact && amount >= 1_000_000) {
    return `₦${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (compact && amount >= 1_000) {
    return `₦${(amount / 1_000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amount);
}
```

## FAB (Floating Action Button) — Mobile Only

```tsx
// Positioned bottom-right above bottom nav
<Button
  className="fixed bottom-20 right-4 h-14 w-14 shadow-lg md:hidden"
  size="icon"
  onClick={() => setExpenseFormOpen(true)}
>
  <PlusIcon className="h-6 w-6" />
</Button>
```

## Color Usage Guidelines

- Green for positive/exempt/income: `text-green-600` / `dark:text-green-400`
- Red for negative/liability/error: `text-destructive`
- Amber for warnings/approaching threshold: `text-amber-600`
- Always use semantic CSS vars, not hardcoded values, for background/border/text
