"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui";
import { toast } from "sonner";
import { useOcr } from "./hooks/use-ocr";
import { ExpenseFormFields } from "./ExpenseFormFields";
import { useExpenseForm } from "./hooks/use-expense-form";
import type { ExpenseRecord } from "@/types/expense";
import { useCurrency } from "@/contexts/CurrencyContext";

interface ExpenseFormProps {
  open: boolean;
  onClose: () => void;
  expense?: ExpenseRecord; // if provided → edit mode
}

export function ExpenseForm({ open, onClose, expense }: ExpenseFormProps) {
  const { format: formatAmount } = useCurrency();
  const {
    form,
    isEditing,
    isSubmitting,
    receiptFile,
    receiptPreviewUrl,
    onSelectReceipt,
    clearReceipt,
    handleCurrencyChange,
    onSubmit,
  } = useExpenseForm({
    open,
    onSuccess: onClose,
    expense,
  });

  const {
    status: ocrStatus,
    progress: ocrProgress,
    result: ocrResult,
    processImage,
    reset: resetOcr,
  } = useOcr();

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset();
      clearReceipt();
      resetOcr();
      onClose();
    }
  };

  const handleOcrStart = async (file: File) => {
    toast.loading("Scanning receipt…", {
      id: "ocr-scan",
      description: "Extracting amount and date from your receipt.",
    });

    await processImage(file);
  };

  // Update toast when OCR finishes
  const handleOcrDone = () => {
    if (ocrStatus === "done" && ocrResult) {
      const hasAmount = ocrResult.amount !== null;
      const hasDate = ocrResult.date !== null;

      if (hasAmount && hasDate) {
        toast.success("Receipt scanned", {
          id: "ocr-scan",
          description: `Detected ${formatAmount(ocrResult.amount || 0)} · ${ocrResult.date}. Review and confirm below.`,
        });
      } else if (hasAmount || hasDate) {
        toast.info("Partial scan result", {
          id: "ocr-scan",
          description: hasDate
            ? "We found a date but could not detect the amount. Please enter it manually."
            : "We found an amount but could not detect the date. Please enter it manually.",
        });
      } else {
        toast.warning("Could not read receipt", {
          id: "ocr-scan",
          description:
            "The image quality may be too low. Please enter the details manually.",
        });
      }
    } else if (ocrStatus === "error") {
      toast.warning("Could not read receipt", {
        id: "ocr-scan",
        description:
          "The image quality may be too low. Please enter the details manually.",
      });
    }
  };

  // Trigger OCR done handling when status changes (via a simple ref pattern)
  const prevStatusRef = { current: "idle" as string };
  if (ocrStatus !== "processing" && prevStatusRef.current === "processing") {
    handleOcrDone();
  }
  prevStatusRef.current = ocrStatus;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && handleClose()}>
      <SheetContent className="flex w-full flex-col sm:max-w-md gap-0 overflow-hidden p-0">
        <SheetHeader className="border-b px-4 py-3 shrink-0">
          <SheetTitle className="text-base font-semibold">
            {isEditing ? "Edit Expense" : "Add Expense"}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pt-4">
          <ExpenseFormFields
            form={form}
            isSubmitting={isSubmitting}
            isEditing={isEditing}
            receiptPreviewUrl={receiptPreviewUrl}
            ocrStatus={ocrStatus}
            ocrProgress={ocrProgress}
            ocrResult={ocrResult}
            onFileSelect={onSelectReceipt}
            onOcrStart={handleOcrStart}
            onClearReceipt={() => {
              clearReceipt();
              resetOcr();
            }}
            onCurrencyChange={handleCurrencyChange}
            onSubmit={onSubmit}
            onCancel={handleClose}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
