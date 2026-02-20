"use client";

import { TAG_VARIANT } from "./utils";
import { formatNGN } from "@/lib/format";
import { format, parseISO } from "date-fns";
import type { ExpenseRecord } from "@/types/expense";
import { IconReceipt, IconPencil, IconTrash } from "@tabler/icons-react";
import { EXPENSE_CATEGORY_LABELS, EXPENSE_TAG_LABELS } from "@/types/expense";
import { Card, CardContent, Badge, Button, Skeleton } from "@/components/ui";

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
        <Card key={expense.id} className="border-2 border-border shadow-none">
          <CardContent className="p-4">
            <button
              className="w-full text-left"
              onClick={() => onViewDetail(expense)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {expense.description ??
                      EXPENSE_CATEGORY_LABELS[
                        expense.category as keyof typeof EXPENSE_CATEGORY_LABELS
                      ] ??
                      expense.category}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground font-mono">
                    {format(parseISO(expense.date), "d MMM yyyy")}
                  </p>
                </div>
                <p className="font-mono font-semibold tabular-nums text-sm shrink-0">
                  {formatNGN(expense.amount_ngn)}
                </p>
              </div>
              <div className="mt-2.5 flex items-center gap-2">
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
                <span className="text-xs text-muted-foreground">
                  {EXPENSE_CATEGORY_LABELS[
                    expense.category as keyof typeof EXPENSE_CATEGORY_LABELS
                  ] ?? expense.category}
                </span>
                {expense.receipt_url && (
                  <IconReceipt className="ml-auto size-4 text-muted-foreground" />
                )}
              </div>
            </button>

            <div className="mt-3 flex items-center justify-end gap-1 border-t border-border pt-3">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 text-xs"
                onClick={() => onEdit(expense)}
              >
                <IconPencil className="size-3.5" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 text-xs text-destructive hover:text-destructive"
                onClick={() => onDelete(expense)}
              >
                <IconTrash className="size-3.5" />
                Delete
              </Button>
            </div>
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
        <Card key={i} className="border-2 border-border shadow-none">
          <CardContent className="p-4 space-y-3">
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
