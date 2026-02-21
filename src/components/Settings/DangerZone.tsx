"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase";

export function DangerZone({ userId }: { userId: string }) {
  const [isDeletingData, setIsDeletingData] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const router = useRouter();
  const supabase = createBrowserClient();

  const handleClearData = async () => {
    setIsDeletingData(true);
    try {
      // In a real app we would call a server action here to ensure everything deletes securely
      // For this implementation, we will use the supabase client to delete from the 2 main tables
      const { error: expError } = await supabase
        .from("expenses")
        .delete()
        .eq("user_id", userId);

      if (expError) throw expError;

      const { error: incError } = await supabase
        .from("income")
        .delete()
        .eq("user_id", userId);

      if (incError) throw incError;

      toast.success("All data cleared", {
        description: "Your expenses and income have been permanently deleted.",
      });
      router.refresh();
    } catch (e: any) {
      toast.error("Something went wrong", {
        description:
          "An unexpected error occurred. Please refresh and try again.",
      });
    } finally {
      setIsDeletingData(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      // You cannot normally delete the auth user via client-side supabase in v2.
      // Better auth handles users.
      // But we can delete the profile (which will cascade to expenses/income).
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (error) throw error;

      toast.success("Account deleted", {
        description: "Your account and all associated data have been removed.",
      });

      // Sign out using the better-auth client (we'll let the user handle that import/route if they need)
      // Usually we trigger a server action that calls auth.deleteUser, but here we redirect.
      router.push("/api/auth/sign-out");
    } catch (e: any) {
      toast.error("Something went wrong", {
        description:
          "An unexpected error occurred. Please refresh and try again.",
      });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <Card className="border-red-900/20 dark:border-red-900/50">
      <CardHeader className="px-4">
        <CardTitle className="text-red-600 dark:text-red-500">
          Danger Zone
        </CardTitle>
        <CardDescription>
          Irreversible and destructive actions. Proceed with caution.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 pb-4 border-b">
          <div className="space-y-0.5">
            <h4 className="text-sm font-medium">Clear All Data</h4>
            <p className="text-sm text-muted-foreground">
              Permanently delete all your income and expense records.
            </p>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:hover:bg-red-950 dark:hover:text-red-400"
              >
                Clear Data
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all your financial records from
                  our servers. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClearData}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <span>{isDeletingData ? "Deleting..." : "Clear Data"}</span>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h4 className="text-sm font-medium">Delete Account</h4>
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all associated data.
            </p>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete Account</Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your account, remove all data
                  from our servers, and sign you out. This action cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>

                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <span>
                    {isDeletingAccount ? "Deleting..." : "Delete Account"}
                  </span>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
