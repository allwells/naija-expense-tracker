"use client";

import { useState } from "react";
import { StepBusinessProfile, type Step1Values } from "./StepBusinessProfile";
import { StepTaxPreferences, type Step2Values } from "./StepTaxPreferences";
import { StepImportData } from "./StepImportData";
import { updateProfileAction } from "@/app/actions/profile-actions";
import { toast } from "sonner";
import type { ProfileRow } from "@/types/database";

interface OnboardingClientProps {
  initialProfile: ProfileRow;
}

export function OnboardingClient({ initialProfile }: OnboardingClientProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<ProfileRow>>(initialProfile);

  const handleNextStep1 = async (data: Step1Values) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep(2);
  };

  const handleNextStep2 = async (data: Step2Values) => {
    // We convert percentages to decimals for the DB
    const updateData = {
      pension_rate: data.pension_rate / 100,
      nhf_rate: data.nhf_rate / 100,
      monthly_rent_ngn: data.monthly_rent_ngn,
    };
    setFormData((prev) => ({ ...prev, ...updateData }));
    setStep(3);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      const finalData = { ...formData, onboarding_complete: true };
      const result = await updateProfileAction(finalData);

      if (result.error) {
        throw new Error(result.error);
      }
      // On success, the StepImportData component will redirect to /dashboard
    } catch (e: any) {
      toast.error("Setup failed", {
        description:
          e.message || "Could not finalize your profile. Please try again.",
      });
      throw e;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-12 px-4 sm:px-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Step {step} of 3</span>
          <span className="text-sm text-muted-foreground">
            {step === 1 && "Business Profile"}
            {step === 2 && "Tax Preferences"}
            {step === 3 && "Finalize"}
          </span>
        </div>
        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 ease-in-out"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-card border-2 p-6 sm:p-8 rounded-none shadow-sm min-h-[400px]">
        {step === 1 && (
          <StepBusinessProfile
            initialData={formData}
            onNext={handleNextStep1}
            isSubmitting={isSubmitting}
          />
        )}
        {step === 2 && (
          <StepTaxPreferences
            initialData={formData}
            onNext={handleNextStep2}
            onBack={() => setStep(1)}
            isSubmitting={isSubmitting}
          />
        )}
        {step === 3 && (
          <StepImportData
            onBack={() => setStep(2)}
            onSubmit={handleFinalSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}
