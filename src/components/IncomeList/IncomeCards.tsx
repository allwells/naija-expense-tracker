"use client";

import { formatNGN } from "@/lib/format";
import { format, parseISO } from "date-fns";
import type { IncomeRecord } from "@/types/income";
import { INCOME_TYPE_LABELS } from "@/types/income";
import { INCOME_TYPE_VARIANT } from "./utils";
import {
  IconTrendingUp,
  IconPencil,
  IconTrash,
  IconDotsVertical,
} from "@tabler/icons-react";

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

export function IncomeCards({
  income,
  onEdit,
  onDelete,
  onViewDetail,
}: IncomeCardsProps) {
  if (income.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center md:hidden">
        <div className="mb-4 flex h-14 w-14 items-center justify-center border border-dashed border-border rounded-md">
          <IconTrendingUp className="size-6 text-muted-foreground stroke-[1.3]" />
        </div>
        <p className="text-sm font-medium">No income records found</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Add your first income using the <br /> + button below.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 md:hidden">
      {income.map((record) => (
        <Card
          key={record.id}
          className="shadow-none pt-3"
          onClick={() => onViewDetail(record)}
        >
          <CardContent>
            <div className="flex flex-col items-start gap-2">
              {/* Amount + menu */}
              <div className="flex items-center gap-1.5 shrink-0 w-full">
                <p className="font-mono font-bold tabular-nums text-lg leading-none">
                  {formatNGN(record.amount_ngn)}
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
                        onEdit(record);
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
                        onDelete(record);
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
                  {record.source}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground font-mono">
                  {format(parseISO(record.date), "do MMMM yyyy")}
                </p>
              </div>
            </div>

            {/* Bottom: type badge + export */}
            <div className="mt-2.5 flex items-center gap-2">
              <Badge
                variant={
                  INCOME_TYPE_VARIANT[
                    record.income_type as keyof typeof INCOME_TYPE_VARIANT
                  ] ?? "outline"
                }
                className="text-xs"
              >
                {INCOME_TYPE_LABELS[record.income_type] ?? record.income_type}
              </Badge>

              {record.is_export_income && (
                <Badge className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                  Export
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
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
