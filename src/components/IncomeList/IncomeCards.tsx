"use client";

import { useCurrency } from "@/contexts/CurrencyContext";
import { format, parseISO } from "date-fns";
import type { IncomeRecord } from "@/types/income";
import { INCOME_TYPE_LABELS } from "@/types/income";
import { INCOME_TYPE_VARIANT } from "./utils";
import { IconPencil, IconTrash, IconDotsVertical } from "@tabler/icons-react";

import { Card, CardContent, Badge, Skeleton } from "@/components/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface IncomeCardsProps {
  income: IncomeRecord[];
  onEdit: (income: IncomeRecord) => void;
  onDelete: (income: IncomeRecord) => void;
  onViewDetail: (income: IncomeRecord) => void;
}

import { useState, useRef, useEffect } from "react";

function SwipeableIncomeCard({
  income,
  onEdit,
  onDelete,
  onViewDetail,
}: {
  income: IncomeRecord;
  onEdit: (income: IncomeRecord) => void;
  onDelete: (income: IncomeRecord) => void;
  onViewDetail: (income: IncomeRecord) => void;
}) {
  return (
    <SwipeableIncomeCardInner
      income={income}
      onEdit={onEdit}
      onDelete={onDelete}
      onViewDetail={onViewDetail}
    />
  );
}

function SwipeableIncomeCardInner({
  income,
  onEdit,
  onDelete,
  onViewDetail,
}: {
  income: IncomeRecord;
  onEdit: (income: IncomeRecord) => void;
  onDelete: (income: IncomeRecord) => void;
  onViewDetail: (income: IncomeRecord) => void;
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
          onDelete(income);
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
          className="shadow-none pt-3 border-x-0 border-y-0 md:border-y-2 md:border-x-2"
          onClick={() => onViewDetail(income)}
        >
          <CardContent>
            <div className="flex flex-col items-start gap-2">
              {/* Amount + menu */}
              <div className="flex items-center gap-1.5 shrink-0 w-full">
                <p className="font-mono font-bold tabular-nums text-lg leading-none">
                  {formatAmount(income.amount_ngn)}
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
                        onEdit(income);
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
                        onDelete(income);
                      }}
                    >
                      <IconTrash className="size-3.5 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Source + date */}
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium truncate leading-snug">
                  {income.source}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground font-mono">
                  {format(parseISO(income.date), "do MMMM yyyy")}
                </p>
              </div>
            </div>

            {/* Bottom: type badge + export */}
            <div className="mt-2.5 flex items-center gap-2">
              <Badge
                variant={
                  income.income_type in INCOME_TYPE_VARIANT
                    ? INCOME_TYPE_VARIANT[
                        income.income_type as keyof typeof INCOME_TYPE_VARIANT
                      ]
                    : "outline"
                }
                className="text-xs"
              >
                {income.income_type in INCOME_TYPE_LABELS
                  ? INCOME_TYPE_LABELS[
                      income.income_type as keyof typeof INCOME_TYPE_LABELS
                    ]
                  : income.income_type}
              </Badge>

              {income.is_export_income && (
                <Badge className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                  Export
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function IncomeCards({
  income,
  onEdit,
  onDelete,
  onViewDetail,
}: IncomeCardsProps) {
  if (income.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 md:hidden">
      {income.map((record) => (
        <SwipeableIncomeCard
          key={record.id}
          income={record}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewDetail={onViewDetail}
        />
      ))}
    </div>
  );
}

export function IncomeCardsSkeleton() {
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
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-14" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
