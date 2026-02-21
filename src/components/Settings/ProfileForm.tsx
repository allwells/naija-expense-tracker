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

import { useCurrency } from "@/contexts/CurrencyContext";

const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  business_name: z.string().optional(),
  annual_turnover_ngn: z.coerce.number().min(0, "Cannot be negative"),
  fixed_assets_ngn: z.coerce.number().min(0, "Cannot be negative"),
});

type ProfileValues = z.infer<typeof profileSchema>;

export function ProfileForm({ profile }: { profile: ProfileRow }) {
  const [isLoading, setIsLoading] = useState(false);
  const { convert, convertToNgn, symbol, format } = useCurrency();

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema) as unknown as Resolver<ProfileValues>,
    defaultValues: {
      full_name: profile.full_name || "",
      business_name: profile.business_name || "",
      annual_turnover_ngn: profile.annual_turnover_ngn
        ? convert(profile.annual_turnover_ngn)
        : 0,
      fixed_assets_ngn: profile.fixed_assets_ngn
        ? convert(profile.fixed_assets_ngn)
        : 0,
    },
  });

  async function onSubmit(data: ProfileValues) {
    setIsLoading(true);
    const updateData = {
      ...data,
      annual_turnover_ngn: data.annual_turnover_ngn
        ? convertToNgn(data.annual_turnover_ngn)
        : 0,
      fixed_assets_ngn: data.fixed_assets_ngn
        ? convertToNgn(data.fixed_assets_ngn)
        : 0,
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
      description: "Your business details have been saved.",
    });
  }

  return (
    <Form {...form}>
      <Card>
        <CardHeader className="px-4">
          <CardTitle>Business Profile</CardTitle>
          <CardDescription>
            Your turnover and fixed assets determine your eligibility for the
            small business CIT exemption under the 2026 Tax Reform Act.
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
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
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
                      <Input placeholder="Doe Enterprises" {...field} />
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
                    <FormLabel>Estimated Annual Turnover ({symbol})</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        className="font-mono"
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Gross income for the tax year. Threshold:{" "}
                      {format(100_000_000, true)}.
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
                    <FormLabel>Estimated Fixed Assets ({symbol})</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        className="font-mono"
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Total value of company equipment/property. Threshold:{" "}
                      {format(250_000_000, true)}.
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
              {isLoading ? "Saving..." : "Save Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Form>
  );
}
