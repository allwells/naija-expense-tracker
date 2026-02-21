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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { IconArrowRight } from "@tabler/icons-react";
import type { ProfileUpdate } from "@/types/database";
import type { Resolver } from "react-hook-form";

const step1Schema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  business_name: z.string().optional(),
  annual_turnover_ngn: z.coerce.number().min(0, "Cannot be negative"),
  fixed_assets_ngn: z.coerce.number().min(0, "Cannot be negative"),
});

export type Step1Values = z.infer<typeof step1Schema>;

interface StepBusinessProfileProps {
  initialData: Partial<ProfileUpdate>;
  onNext: (data: Step1Values) => void;
  isSubmitting?: boolean;
}

export function StepBusinessProfile({
  initialData,
  onNext,
  isSubmitting,
}: StepBusinessProfileProps) {
  const form = useForm<Step1Values>({
    resolver: zodResolver(step1Schema) as unknown as Resolver<Step1Values>,
    defaultValues: {
      full_name: initialData.full_name || "",
      business_name: initialData.business_name || "",
      annual_turnover_ngn: initialData.annual_turnover_ngn || 0,
      fixed_assets_ngn: initialData.fixed_assets_ngn || 0,
    },
  });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2 mb-8">
        <h2 className="text-2xl font-semibold tracking-tight">
          Business Profile
        </h2>
        <p className="text-muted-foreground">
          Let's setup your profile. Your turnover and assets determine your
          qualification for the CIT exemption under the 2026 Tax Reform Act.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onNext)} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="John Doe"
                      {...field}
                      className="text-[16px] md:text-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="business_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Doe Enterprises"
                      {...field}
                      className="text-[16px] md:text-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="annual_turnover_ngn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Est. Annual Turnover (₦)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      className="text-[16px] md:text-sm font-mono"
                    />
                  </FormControl>
                  <FormDescription>
                    Gross income (CIT threshold: ₦100M).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fixed_assets_ngn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Est. Fixed Assets (₦)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      className="text-[16px] md:text-sm font-mono"
                    />
                  </FormControl>
                  <FormDescription>
                    Company property (CIT threshold: ₦250M).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="pt-4 flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto gap-2"
            >
              Next Step
              <IconArrowRight className="size-4" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
