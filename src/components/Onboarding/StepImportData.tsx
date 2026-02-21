"use client";

import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { IconArrowLeft, IconCheck } from "@tabler/icons-react";

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
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-2 mb-8 text-center sm:text-left">
        <h2 className="text-2xl font-semibold tracking-tight">
          You're All Set!
        </h2>
        <p className="text-muted-foreground">
          Your tax engine is configured. You can now start logging income and
          expenses. (CSV importing functionality will be available in a future
          update).
        </p>
      </div>

      <div className="pt-4 flex flex-col-reverse sm:flex-row justify-between gap-4">
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
