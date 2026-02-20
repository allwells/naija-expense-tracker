import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getExpenses } from "@/lib/expense-service";
import { Header } from "@/components/Header";
import { ExpensesList } from "@/components/ExpensesList";
import { ExpensesTableSkeleton } from "@/components/ExpensesList/ExpensesTable";
import { ExpensesCardsSkeleton } from "@/components/ExpensesList/ExpensesCards";
import type { ExpenseFilters, PaginatedExpenses } from "@/types/expense";
import type { ExpenseCategory, ExpenseTag } from "@/types/database";
import { Skeleton } from "@/components/ui";

interface ExpensesPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

async function ExpensesPageContent({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10));
  const filters: ExpenseFilters = {
    startDate: searchParams.from,
    endDate: searchParams.to,
    category: searchParams.category as ExpenseCategory | undefined,
    tag: searchParams.tag as ExpenseTag | undefined,
  };

  let paginatedExpenses: PaginatedExpenses;
  try {
    paginatedExpenses = await getExpenses(session.user.id, filters, page);
  } catch {
    paginatedExpenses = {
      expenses: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
    };
  }

  return <ExpensesList paginatedExpenses={paginatedExpenses} />;
}

export default async function ExpensesPage({
  searchParams,
}: ExpensesPageProps) {
  const resolvedParams = await searchParams;

  return (
    <div className="w-full">
      <Header title="Expenses">
        {/* Desktop quick-add in header — also surfaced inside ExpensesList */}
        <span className="sr-only">Add expense action is inside the list</span>
      </Header>

      <div className="p-4 md:p-6">
        <Suspense
          fallback={
            <div className="relative flex flex-col gap-4">
              {/* Header row skeleton */}
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-24" />

                <div className="w-fit flex justify-center items-center gap-4">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="hidden md:block h-8 w-32" />
                </div>
              </div>

              {/* Lists skeletons */}
              <ExpensesTableSkeleton />
              <ExpensesCardsSkeleton />
            </div>
          }
        >
          <ExpensesPageContent searchParams={resolvedParams} />
        </Suspense>
      </div>
    </div>
  );
}
