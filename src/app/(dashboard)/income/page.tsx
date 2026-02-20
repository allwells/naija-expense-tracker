import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getIncome } from "@/lib/income-service";
import { Header } from "@/components/Header";
import { IncomeList } from "@/components/IncomeList";
import { IncomeTableSkeleton } from "@/components/IncomeList/IncomeTable";
import { IncomeCardsSkeleton } from "@/components/IncomeList/IncomeCards";
import type { IncomeFilters, PaginatedIncome } from "@/types/income";
import type { IncomeType } from "@/types/database";
import { Skeleton } from "@/components/ui";

interface IncomePageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

async function IncomePageContent({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10));
  const filters: IncomeFilters = {
    startDate: searchParams.from,
    endDate: searchParams.to,
    incomeType: searchParams.type as IncomeType | undefined,
    isExportIncome:
      searchParams.export === "true"
        ? true
        : searchParams.export === "false"
          ? false
          : undefined,
  };

  let paginatedIncome: PaginatedIncome;
  try {
    paginatedIncome = await getIncome(session.user.id, filters, page);
  } catch {
    paginatedIncome = {
      income: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
    };
  }

  return <IncomeList paginatedIncome={paginatedIncome} />;
}

export default async function IncomePage({ searchParams }: IncomePageProps) {
  const resolvedParams = await searchParams;

  return (
    <div className="w-full">
      <Header title="Income" />

      <div className="p-4 md:p-6">
        <Suspense
          fallback={
            <div className="relative flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-24" />
                <div className="w-fit flex justify-center items-center gap-4">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="hidden md:block h-8 w-32" />
                </div>
              </div>
              <IncomeTableSkeleton />
              <IncomeCardsSkeleton />
            </div>
          }
        >
          <IncomePageContent searchParams={resolvedParams} />
        </Suspense>
      </div>
    </div>
  );
}
