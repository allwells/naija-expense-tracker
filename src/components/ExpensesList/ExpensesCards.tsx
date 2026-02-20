"use client";

import { TAG_VARIANT } from "./utils";
import { formatNGN } from "@/lib/format";
import { format, parseISO } from "date-fns";
import type { ExpenseRecord } from "@/types/expense";
import {
  IconReceipt,
  IconPencil,
  IconTrash,
  IconDotsVertical,
} from "@tabler/icons-react";
import { EXPENSE_CATEGORY_LABELS, EXPENSE_TAG_LABELS } from "@/types/expense";
import { Card, CardContent, Badge, Skeleton } from "@/components/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface ExpensesCardsProps {
  expenses: ExpenseRecord[];
  onEdit: (expense: ExpenseRecord) => void;
  onDelete: (expense: ExpenseRecord) => void;
  onViewDetail: (expense: ExpenseRecord) => void;
}

export function ExpensesCards({
  expenses,
  onEdit,
  onDelete,
  onViewDetail,
}: ExpensesCardsProps) {
  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center md:hidden">
        <div className="mb-4 flex h-14 w-14 items-center justify-center border border-dashed border-border rounded-md">
          <IconReceipt className="size-6 text-muted-foreground stroke-[1.3]" />
        </div>
        <p className="text-sm font-medium">No expenses found</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Add your first expense using the <br /> + button below.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 md:hidden">
      {expenses.map((expense) => (
        <Card
          key={expense.id}
          className="shadow-none pt-3"
          onClick={() => onViewDetail(expense)}
        >
          <CardContent>
            {/* Top row: info + amount + menu */}
            <div className="flex flex-col items-start gap-2">
              {/* Amount — prominent */}
              <div className="flex items-center gap-1.5 shrink-0 w-full">
                <p className="font-mono font-bold tabular-nums text-lg leading-none">
                  {formatNGN(expense.amount_ngn)}
                </p>

                {/* 3-dot menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0 -mr-2 ml-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <IconDotsVertical className="size-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(expense);
                      }}
                    >
                      <IconPencil className="size-3.5 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(expense);
                      }}
                    >
                      <IconTrash className="size-3.5 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Clickable info area */}
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium truncate leading-snug">
                  {expense.description
                    ? expense.description
                    : (EXPENSE_CATEGORY_LABELS[
                        expense.category as keyof typeof EXPENSE_CATEGORY_LABELS
                      ] ?? expense.category)}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground font-mono">
                  {format(parseISO(expense.date), "do MMMM yyyy")}
                </p>
              </div>
            </div>

            {/* Bottom row: tags + receipt icon */}
            <button
              className="mt-2.5 w-full text-left"
              onClick={() => onViewDetail(expense)}
            >
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    TAG_VARIANT[expense.tag as keyof typeof TAG_VARIANT] ??
                    "secondary"
                  }
                  className="text-xs"
                >
                  {EXPENSE_TAG_LABELS[
                    expense.tag as keyof typeof EXPENSE_TAG_LABELS
                  ] ?? expense.tag}
                </Badge>
                <span className="text-xs text-muted-foreground truncate">
                  {EXPENSE_CATEGORY_LABELS[
                    expense.category as keyof typeof EXPENSE_CATEGORY_LABELS
                  ] ?? expense.category}
                </span>
                {expense.receipt_url && (
                  <IconReceipt className="ml-auto size-4 text-muted-foreground shrink-0" />
                )}
              </div>
            </button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ExpensesCardsSkeleton() {
  return (
    <div className="flex flex-col gap-3 md:hidden">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="shadow-none">
          <CardContent className="px-4 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-3 w-24" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
