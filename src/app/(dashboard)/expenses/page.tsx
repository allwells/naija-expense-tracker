import { IconReceipt } from "@tabler/icons-react";
import { Header } from "@/components/Header";

export default function ExpensesPage() {
  return (
    <div className="w-full">
      <Header title="Expenses" />

      <div className="mt-8 flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center border-2 border-dashed border-border_muted rounded-full bg-muted/20">
          <IconReceipt className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold">No expenses yet</h3>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Expense logging with OCR receipt scanning will be available in Phase
          3.
        </p>
      </div>
    </div>
  );
}
