"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { toast } from "sonner";
import { useState } from "react";
import type { ProfileRow } from "@/types/database";
import type { Resolver } from "react-hook-form";
import { updateProfileAction } from "@/app/actions/profile-actions";

const taxSettingsSchema = z.object({
  pension_rate: z.coerce.number().min(0).max(100, "Cannot exceed 100%"),
  nhf_rate: z.coerce.number().min(0).max(100, "Cannot exceed 100%"),
  monthly_rent_ngn: z.coerce.number().min(0, "Cannot be negative"),
});

type TaxSettingsValues = z.infer<typeof taxSettingsSchema>;

export function TaxSettingsForm({ profile }: { profile: ProfileRow }) {
  const [isLoading, setIsLoading] = useState(false);

  // DB stores rates as decimals (e.g., 0.08), form displays as percentages (e.g., 8)
  const form = useForm<TaxSettingsValues>({
    resolver: zodResolver(
      taxSettingsSchema,
    ) as unknown as Resolver<TaxSettingsValues>,
    defaultValues: {
      pension_rate: (profile.pension_rate ?? 0.08) * 100,
      nhf_rate: (profile.nhf_rate ?? 0.025) * 100,
      monthly_rent_ngn: profile.monthly_rent_ngn ?? 0,
    },
  });

  async function onSubmit(data: TaxSettingsValues) {
    setIsLoading(true);
    // Convert back to decimal for DB
    const updateData = {
      pension_rate: data.pension_rate / 100,
      nhf_rate: data.nhf_rate / 100,
      monthly_rent_ngn: data.monthly_rent_ngn,
    };

    const result = await updateProfileAction(updateData);
    setIsLoading(false);

    if (result.error) {
      toast.error("Profile not saved", {
        description: result.error,
      });
      return;
    }

    toast.success("Profile updated", {
      description: "Your tax preferences have been saved.",
    });
  }

  return (
    <Form {...form}>
      <Card>
        <CardHeader className="px-4">
          <CardTitle>Tax Preferences</CardTitle>
          <CardDescription>
            Configure your statutory deductions for accurate PIT computation.
          </CardDescription>
        </CardHeader>

        <CardContent className="h-full flex-1">
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4 h-full"
          >
            <div className="grid gap-4 md:grid-cols-2">
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
                  <FormItem className="md:col-span-2">
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
                      Used to calculate Rent Relief (20% of annual rent, capped
                      at ₦500k).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              loading={isLoading}
              className="mt-auto w-fit"
            >
              {isLoading ? "Saving..." : "Save Preferences"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Form>
  );
}
