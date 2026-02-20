"use client";

import {
  Badge,
  Separator,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
} from "@/components/ui";
import { IconPencil, IconTrash } from "@tabler/icons-react";
import { formatNGN } from "@/lib/format";
import { format, parseISO } from "date-fns";
import { INCOME_TYPE_LABELS, type IncomeRecord } from "@/types/income";
import { INCOME_TYPE_VARIANT } from "./utils";

interface IncomeDetailModalProps {
  income: IncomeRecord | null;
  open: boolean;
  onClose: () => void;
  onEdit: (income: IncomeRecord) => void;
  onDelete: (income: IncomeRecord) => void;
}

export function IncomeDetailModal({
  income,
  open,
  onClose,
  onEdit,
  onDelete,
}: IncomeDetailModalProps) {
  if (!income) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="md:max-w-sm pt-3 pb-4 px-4">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold mr-auto">
            Income Detail
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm mt-4">
          {/* Amount */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Amount (NGN)</span>
            <span className="font-mono font-bold tabular-nums text-lg md:text-xl leading-none">
              {formatNGN(income.amount_ngn)}
            </span>
          </div>

          {income.original_currency !== "NGN" && income.original_amount && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Original</span>
              <span className="font-mono">
                {income.original_currency}{" "}
                {income.original_amount.toLocaleString()} @ ₦
                {income.exchange_rate?.toLocaleString()}
              </span>
            </div>
          )}

          <Separator />

          {/* Date */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Date</span>
            <span className="font-mono">
              {format(parseISO(income.date), "do MMMM yyyy")}
            </span>
          </div>

          {/* Source */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Source</span>
            <span className="font-medium">{income.source}</span>
          </div>

          {/* Type */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Type</span>
            <Badge
              variant={
                INCOME_TYPE_VARIANT[
                  income.income_type as keyof typeof INCOME_TYPE_VARIANT
                ] ?? "outline"
              }
            >
              {INCOME_TYPE_LABELS[income.income_type] ?? income.income_type}
            </Badge>
          </div>

          {/* Export Income */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Export Income</span>
            {income.is_export_income ? (
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                Yes — CGT Exempt
              </Badge>
            ) : (
              <span className="text-muted-foreground text-xs">No</span>
            )}
          </div>

          {/* Description */}
          {income.description && (
            <>
              <Separator />
              <div>
                <p className="text-muted-foreground">Description</p>
                <p className="mt-1">{income.description}</p>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="mt-6">
          <div className="w-full grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                onEdit(income);
              }}
            >
              <IconPencil className="size-4" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:bg-destructive/10 border-destructive/20"
              onClick={() => onDelete(income)}
            >
              <IconTrash className="size-4" />
              Delete
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
