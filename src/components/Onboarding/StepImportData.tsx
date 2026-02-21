"use client";

import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import {
  IconArrowLeft,
  IconCheck,
  IconReceiptTax,
  IconScan,
  IconChartPie,
} from "@tabler/icons-react";

interface StepImportDataProps {
  onBack: () => void;
  onSubmit: () => Promise<void>;
  isSubmitting?: boolean;
}

export function StepImportData({
  onBack,
  onSubmit,
  isSubmitting,
}: StepImportDataProps) {
  const router = useRouter();

  const handleComplete = async () => {
    try {
      await onSubmit();
      toast.success("Setup complete", {
        description: "Your profile is ready. Start logging your expenses.",
      });
      router.push("/dashboard");
    } catch (error) {
      toast.error("Setup failed", {
        description: "Could not finalize your profile. Please try again.",
      });
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500 h-full flex flex-col flex-1">
      <div className="space-y-2 mb-8 text-center sm:text-left">
        <h2 className="text-2xl font-semibold tracking-tight">
          You're All Set!
        </h2>
        <p className="text-muted-foreground">
          Your tax engine is configured. You can now start logging income and
          expenses to take control of your financial future.
        </p>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-6 mb-8 mt-4">
        <div className="flex gap-4 items-start">
          <div className="p-2.5 bg-primary/10 rounded-lg shrink-0 mt-0.5">
            <IconReceiptTax className="size-5 text-primary" />
          </div>
          <div>
            <h4 className="font-medium text-sm">Smart Tax Engine</h4>
            <p className="text-sm text-muted-foreground mt-0.5">
              Live estimations based on your profile inputs and real-world
              deductions.
            </p>
          </div>
        </div>

        <div className="flex gap-4 items-start">
          <div className="p-2.5 bg-primary/10 rounded-lg shrink-0 mt-0.5">
            <IconScan className="size-5 text-primary" />
          </div>
          <div>
            <h4 className="font-medium text-sm">AI Receipt Scanner</h4>
            <p className="text-sm text-muted-foreground mt-0.5">
              Instantly extract amounts and dates using offline OCR processing.
            </p>
          </div>
        </div>

        <div className="flex gap-4 items-start">
          <div className="p-2.5 bg-primary/10 rounded-lg shrink-0 mt-0.5">
            <IconChartPie className="size-5 text-primary" />
          </div>
          <div>
            <h4 className="font-medium text-sm">Rich Visualizations</h4>
            <p className="text-sm text-muted-foreground mt-0.5">
              Track profits, detect trends, and analyze your financial health
              over time.
            </p>
          </div>
        </div>
      </div>

      <div className="pt-4 flex flex-col-reverse sm:flex-row justify-between gap-4 mt-auto">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
          className="gap-2"
        >
          <IconArrowLeft className="size-4" />
          Back
        </Button>
        <Button
          onClick={handleComplete}
          disabled={isSubmitting}
          className="gap-2 bg-green-600 hover:bg-green-700 text-white dark:bg-green-600 dark:hover:bg-green-700 font-medium"
        >
          {isSubmitting ? "Finalizing..." : "Complete Setup"}
          {!isSubmitting && <IconCheck className="size-4" />}
        </Button>
      </div>
    </div>
  );
}
