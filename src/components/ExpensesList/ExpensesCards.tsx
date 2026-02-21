"use client";

import { TAG_VARIANT } from "./utils";
import { useCurrency } from "@/contexts/CurrencyContext";
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
    return null;
  }

  return (
    <div className="flex flex-col gap-3 md:hidden overflow-hidden">
      {expenses.map((expense) => (
        <SwipeableExpenseCard
          key={expense.id}
          expense={expense}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewDetail={onViewDetail}
        />
      ))}
    </div>
  );
}

// ----------------------------------------------------------------
// Swipeable Expense Card (Mobile Polish)
// ----------------------------------------------------------------

function SwipeableExpenseCard({
  expense,
  onEdit,
  onDelete,
  onViewDetail,
}: {
  expense: ExpenseRecord;
  onEdit: (expense: ExpenseRecord) => void;
  onDelete: (expense: ExpenseRecord) => void;
  onViewDetail: (expense: ExpenseRecord) => void;
}) {
  // Destructure after hooks actually load (to avoid hook rule issues from dynamic imports inside component)
  // We'll use standard React hooks instead.
  return (
    <SwipeableExpenseCardInner
      expense={expense}
      onEdit={onEdit}
      onDelete={onDelete}
      onViewDetail={onViewDetail}
    />
  );
}

import { useState, useRef, useEffect } from "react";

function SwipeableExpenseCardInner({
  expense,
  onEdit,
  onDelete,
  onViewDetail,
}: {
  expense: ExpenseRecord;
  onEdit: (expense: ExpenseRecord) => void;
  onDelete: (expense: ExpenseRecord) => void;
  onViewDetail: (expense: ExpenseRecord) => void;
}) {
  const [offset, setOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const DELETE_THRESHOLD = -80;
  const MAX_SWIPE = -100;
  const { format: formatAmount } = useCurrency();

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0 && e.touches[0]) {
      startXRef.current = e.touches[0].clientX;
      setIsSwiping(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping || e.touches.length === 0 || !e.touches[0]) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startXRef.current;

    // Only allow swiping left
    if (diff < 0) {
      // Add resistance
      const resistance = diff < DELETE_THRESHOLD ? 0.3 : 1;
      let newOffset = diff * resistance;

      // Cap max swipe
      if (newOffset < MAX_SWIPE) newOffset = MAX_SWIPE;

      setOffset(newOffset);
      currentXRef.current = newOffset;
    } else {
      setOffset(0);
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    if (currentXRef.current <= DELETE_THRESHOLD) {
      // Keep it open
      setOffset(DELETE_THRESHOLD);
    } else {
      // Snap back
      setOffset(0);
    }
  };

  useEffect(() => {
    // Reset if a different item is clicked/viewed
    const handleClickOutside = () => setOffset(0);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl bg-destructive"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Background Delete Action */}
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-end px-6 text-white"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(expense);
        }}
      >
        <div className="flex flex-col items-center gap-1">
          <IconTrash className="size-5" />
          <span className="text-[10px] font-medium uppercase tracking-wider">
            Delete
          </span>
        </div>
      </div>

      {/* Foreground Card */}
      <div
        className="relative z-10 w-full bg-background transition-transform"
        style={{
          transform: `translateX(${offset}px)`,
          transitionDuration: isSwiping ? "0ms" : "300ms",
          transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Card
          className="shadow-none pt-3 border-l-0 border-r-0 border-t-0 rounded-none rounded-t-xl rounded-b-xl"
          onClick={() => {
            if (offset === 0) onViewDetail(expense);
            else setOffset(0);
          }}
        >
          <CardContent>
            {/* Top row: info + amount + menu */}
            <div className="flex flex-col items-start gap-2 pointer-events-none">
              {/* Amount — prominent */}
              <div className="flex items-center gap-1.5 shrink-0 w-full pointer-events-auto">
                <p className="font-mono font-bold tabular-nums text-lg leading-none">
                  {formatAmount(expense.amount_ngn)}
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
              <div
                className="flex-1 min-w-0 text-left pointer-events-auto cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetail(expense);
                }}
              >
                <p className="text-sm font-medium truncate leading-snug">
                  {expense.description
                    ? expense.description
                    : ((EXPENSE_CATEGORY_LABELS as Record<string, string>)[
                        expense.category
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
              onClick={(e) => {
                e.stopPropagation();
                onViewDetail(expense);
              }}
            >
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    expense.tag in TAG_VARIANT
                      ? TAG_VARIANT[expense.tag as keyof typeof TAG_VARIANT]
                      : "secondary"
                  }
                  className="text-xs"
                >
                  {expense.tag in EXPENSE_TAG_LABELS
                    ? EXPENSE_TAG_LABELS[
                        expense.tag as keyof typeof EXPENSE_TAG_LABELS
                      ]
                    : expense.tag}
                </Badge>
                <span className="text-xs text-muted-foreground truncate">
                  {expense.category in EXPENSE_CATEGORY_LABELS
                    ? EXPENSE_CATEGORY_LABELS[
                        expense.category as keyof typeof EXPENSE_CATEGORY_LABELS
                      ]
                    : expense.category}
                </span>
                {expense.receipt_url && (
                  <IconReceipt className="ml-auto size-4 text-muted-foreground shrink-0" />
                )}
              </div>
            </button>
          </CardContent>
        </Card>
      </div>
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
