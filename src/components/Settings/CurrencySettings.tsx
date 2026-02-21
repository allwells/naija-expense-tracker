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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
import { updateProfileAction } from "@/app/actions/profile-actions";

const currencySettingsSchema = z.object({
  currency_preference: z.string().min(1, "Please select a currency"),
});

type CurrencySettingsValues = z.infer<typeof currencySettingsSchema>;

export function CurrencySettings({ profile }: { profile: ProfileRow }) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CurrencySettingsValues>({
    resolver: zodResolver(currencySettingsSchema),
    defaultValues: {
      currency_preference: profile.currency_preference || "NGN",
    },
  });

  async function onSubmit(data: CurrencySettingsValues) {
    setIsLoading(true);
    const result = await updateProfileAction(data);
    setIsLoading(false);

    if (result.error) {
      toast.error("Profile not saved", {
        description: result.error,
      });
      return;
    }

    toast.success("Profile updated", {
      description: "Your currency preferences have been saved.",
    });
  }

  return (
    <Card>
      <CardHeader className="px-4">
        <CardTitle>Currency & Locale</CardTitle>
        <CardDescription>
          Set your primary operating currency. All tax computations will still
          be converted to and performed in NGN (Naira).
        </CardDescription>
      </CardHeader>

      <CardContent className="h-full flex-1">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4 h-full"
          >
            <FormField
              control={form.control}
              name="currency_preference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Currency</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="NGN">NGN - Nigerian Naira</SelectItem>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs">
                    Used as the default when logging new expenses and income.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={isLoading}
              loading={isLoading}
              className="mt-auto w-fit"
            >
              {isLoading ? "Saving..." : "Save Preferences"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
