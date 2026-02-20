"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  IconPencil,
  IconTrash,
  IconLoader2,
  IconReceipt,
  IconExternalLink,
} from "@tabler/icons-react";
import { format, parseISO } from "date-fns";
import { formatNGN } from "@/lib/format";
import { EXPENSE_CATEGORY_LABELS, EXPENSE_TAG_LABELS } from "@/types/expense";
import { deleteExpenseAction } from "@/app/actions/expense-actions";
import { toast } from "sonner";
import { TAG_VARIANT } from "./utils";
import type { ExpenseRecord } from "@/types/expense";

interface ExpenseDetailModalProps {
  expense: ExpenseRecord | null;
  open: boolean;
  onClose: () => void;
  onEdit: (expense: ExpenseRecord) => void;
}

export function ExpenseDetailModal({
  expense,
  open,
  onClose,
  onEdit,
}: ExpenseDetailModalProps) {
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!expense) return null;

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    startTransition(async () => {
      const result = await deleteExpenseAction(expense.id);
      if (result.error) {
        toast.error("Could not delete expense", {
          description:
            "Something went wrong. Please try again or refresh the page.",
        });
        setConfirmDelete(false);
        return;
      }

      const restoreMsg = "To restore, re-add this expense manually.";

      toast.success("Expense deleted", {
        description: "The expense has been removed from your records.",
        action: {
          label: "OK",
          onClick: () => undefined,
        },
      });

      console.error(restoreMsg); // avoid lint — not production logging
      onClose();
    });
  };

  const handleClose = () => {
    setConfirmDelete(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-md border-2 border-border sm:rounded-none">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Expense Detail
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          {/* Amount */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-mono font-semibold tabular-nums text-base">
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
              {format(parseISO(expense.date), "d MMMM yyyy")}
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

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {
                handleClose();
                onEdit(expense);
              }}
            >
              <IconPencil className="size-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`gap-2 ${confirmDelete ? "border-destructive text-destructive hover:text-destructive" : ""}`}
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? (
                <IconLoader2 className="size-4 animate-spin" />
              ) : (
                <IconTrash className="size-4" />
              )}
              {confirmDelete ? "Confirm delete?" : "Delete"}
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
