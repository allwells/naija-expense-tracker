import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getExpenses } from "@/lib/expense-service";
import { Header } from "@/components/Header";
import { ExpensesList } from "@/components/ExpensesList";
import { ExpensesTableSkeleton } from "@/components/ExpensesList/ExpensesTable";
import { ExpensesCardsSkeleton } from "@/components/ExpensesList/ExpensesCards";
import type {
  ExpenseFilters as ExpenseFiltersType,
  PaginatedExpenses,
} from "@/types/expense";
import type { ExpenseCategory, ExpenseTag } from "@/types/database";
import { ExpenseFilters } from "@/components/ExpensesList/ExpenseFilters";

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
  const filters: ExpenseFiltersType = {
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
      <Header title="Expenses" />

      <div className="p-4 md:p-6">
        <div className="max-w-12xl mx-auto">
          <div className="flex items-center justify-end mb-4">
            <ExpenseFilters />
          </div>

          <Suspense
            key={JSON.stringify(resolvedParams)}
            fallback={
              <div className="relative flex flex-col gap-4">
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
    </div>
  );
}
