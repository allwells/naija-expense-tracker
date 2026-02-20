"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui";
import { IncomeFormFields } from "./IncomeFormFields";
import { useIncomeForm } from "./hooks/use-income-form";
import type { IncomeRecord } from "@/types/income";

interface IncomeFormProps {
  open: boolean;
  onClose: () => void;
  income?: IncomeRecord; // if provided → edit mode
}

export function IncomeForm({ open, onClose, income }: IncomeFormProps) {
  const { form, isEditing, isSubmitting, handleCurrencyChange, onSubmit } =
    useIncomeForm({
      onSuccess: onClose,
      income,
    });

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset();
      onClose();
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && handleClose()}>
      <SheetContent className="flex w-full flex-col sm:max-w-md gap-0 overflow-hidden p-0">
        <SheetHeader className="border-b px-4 py-3 shrink-0">
          <SheetTitle className="text-base font-semibold">
            {isEditing ? "Edit Income" : "Add Income"}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pt-4">
          <IncomeFormFields
            form={form}
            isSubmitting={isSubmitting}
            isEditing={isEditing}
            onCurrencyChange={handleCurrencyChange}
            onSubmit={onSubmit}
            onCancel={handleClose}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
