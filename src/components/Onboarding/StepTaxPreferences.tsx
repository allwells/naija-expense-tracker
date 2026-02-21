"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Button,
} from "@/components/ui";
import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import type { ProfileUpdate } from "@/types/database";
import type { Resolver } from "react-hook-form";

const step2Schema = z.object({
  pension_rate: z.coerce.number().min(0).max(100, "Cannot exceed 100%"),
  nhf_rate: z.coerce.number().min(0).max(100, "Cannot exceed 100%"),
  monthly_rent_ngn: z.coerce.number().min(0, "Cannot be negative"),
});

export type Step2Values = z.infer<typeof step2Schema>;

interface StepTaxPreferencesProps {
  initialData: Partial<ProfileUpdate>;
  onNext: (data: Step2Values) => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

export function StepTaxPreferences({
  initialData,
  onNext,
  onBack,
  isSubmitting,
}: StepTaxPreferencesProps) {
  // DB stores decimals (e.g., 0.08), form displays percentage (e.g., 8)
  const form = useForm<Step2Values>({
    resolver: zodResolver(step2Schema) as unknown as Resolver<Step2Values>,
    defaultValues: {
      pension_rate: (initialData.pension_rate ?? 0.08) * 100,
      nhf_rate: (initialData.nhf_rate ?? 0.025) * 100,
      monthly_rent_ngn: initialData.monthly_rent_ngn || 0,
    },
  });

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-2 mb-8">
        <h2 className="text-2xl font-semibold tracking-tight">
          Tax Preferences
        </h2>
        <p className="text-muted-foreground">
          Configure your standard statutory deductions. These are used to
          calculate your formal Personal Income Tax (PIT) liability.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onNext)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="pension_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pension Contribution (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      {...field}
                      className="font-mono"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Standard rate is 8%.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nhf_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NHF Contribution (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      {...field}
                      className="font-mono"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Standard rate is 2.5%.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="monthly_rent_ngn"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Monthly Rent Paid (₦)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      className="font-mono"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    We use this to calculate up to ₦500k Rent Relief.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="pt-4 flex flex-col-reverse sm:flex-row justify-between gap-4 mt-auto">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={isSubmitting}
            >
              <IconArrowLeft className="size-4" />
              Back
            </Button>

            <Button type="submit" disabled={isSubmitting}>
              Next Step
              <IconArrowRight className="size-4" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
