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
import {
  IconPencil,
  IconTrash,
  IconLoader2,
  IconReceipt,
  IconExternalLink,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { TAG_VARIANT } from "./utils";
import { formatNGN } from "@/lib/format";
import { format, parseISO } from "date-fns";
import { useState, useTransition } from "react";
import { deleteExpenseAction } from "@/app/actions/expense-actions";
import type { ExpenseRecord } from "@/types/expense";
import { EXPENSE_CATEGORY_LABELS, EXPENSE_TAG_LABELS } from "@/types/expense";

interface ExpenseDetailModalProps {
  expense: ExpenseRecord | null;
  open: boolean;
  onClose: () => void;
  onEdit: (expense: ExpenseRecord) => void;
  onDelete: (expense: ExpenseRecord) => void;
}

export function ExpenseDetailModal({
  expense,
  open,
  onClose,
  onEdit,
  onDelete,
}: ExpenseDetailModalProps) {
  if (!expense) return null;

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="md:max-w-sm pt-3 pb-4 px-4">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold mr-auto">
            Expense Detail
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm mt-4">
          {/* Amount */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-mono font-bold tabular-nums text-lg md:text-xl leading-none">
              {formatNGN(expense.amount_ngn)}
            </span>
          </div>

          {expense.original_currency !== "NGN" && expense.original_amount && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Original</span>
              <span className="font-mono">
                {expense.original_currency}{" "}
                {expense.original_amount.toLocaleString()} @ ₦
                {expense.exchange_rate?.toLocaleString()}
              </span>
            </div>
          )}

          <Separator />

          {/* Date */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Date</span>
            <span className="font-mono">
              {format(parseISO(expense.date), "do MMMM yyyy")}
            </span>
          </div>

          {/* Category */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Category</span>
            <span>
              {EXPENSE_CATEGORY_LABELS[
                expense.category as keyof typeof EXPENSE_CATEGORY_LABELS
              ] ?? expense.category}
            </span>
          </div>

          {/* Tag */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Tag</span>
            <Badge
              variant={
                TAG_VARIANT[expense.tag as keyof typeof TAG_VARIANT] ??
                "secondary"
              }
            >
              {EXPENSE_TAG_LABELS[
                expense.tag as keyof typeof EXPENSE_TAG_LABELS
              ] ?? expense.tag}
            </Badge>
          </div>

          {/* Description */}
          {expense.description && (
            <>
              <Separator />
              <div>
                <p className="text-muted-foreground">Description</p>
                <p className="mt-1">{expense.description}</p>
              </div>
            </>
          )}

          {/* Notes */}
          {expense.notes && (
            <div>
              <p className="text-muted-foreground">Notes</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {expense.notes}
              </p>
            </div>
          )}

          {/* OCR tag */}
          {expense.ocr_extracted && (
            <p className="text-xs text-muted-foreground italic">
              ✦ Amount and/or date auto-extracted via OCR
            </p>
          )}

          {/* Receipt */}
          {expense.receipt_url && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconReceipt className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Receipt</span>
                </div>
                <a
                  href={expense.receipt_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary underline underline-offset-2 text-xs hover:opacity-80"
                >
                  View <IconExternalLink className="size-3" />
                </a>
              </div>

              {expense.receipt_url.match(/\.(jpg|jpeg|png|webp)$/i) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={expense.receipt_url}
                  alt="Receipt"
                  className="w-full max-h-48 object-contain border-2 border-border"
                />
              )}
            </>
          )}
        </div>

        <DialogFooter className="mt-6">
          <div className="w-full grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                handleClose();
                onEdit(expense);
              }}
            >
              <IconPencil className="size-4" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:bg-destructive/10 border-destructive/20"
              onClick={() => onDelete(expense)}
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
