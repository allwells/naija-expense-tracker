import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getIncome } from "@/lib/income-service";
import { Header } from "@/components/Header";
import { IncomeList } from "@/components/IncomeList";
import { IncomeTableSkeleton } from "@/components/IncomeList/IncomeTable";
import { IncomeCardsSkeleton } from "@/components/IncomeList/IncomeCards";
import type {
  IncomeFilters as IncomeFiltersType,
  PaginatedIncome,
} from "@/types/income";
import type { IncomeType } from "@/types/database";
import { Button } from "@/components/ui";
import { IncomeFilters } from "@/components/IncomeList/IncomeFilters";
import { IconPlus } from "@tabler/icons-react";
import { IncomeFormWrapper } from "@/components/IncomeList/IncomeFormWrapper";

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
  const filters: IncomeFiltersType = {
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
        <div className="max-w-12xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                Recent Income
              </h2>
            </div>

            <div className="flex items-center gap-4">
              <IncomeFilters />
              <IncomeFormWrapper>
                <Button size="sm" className="hidden md:flex">
                  <IconPlus className="size-4" />
                  Add Income
                </Button>
              </IncomeFormWrapper>
            </div>
          </div>

          <Suspense
            key={JSON.stringify(resolvedParams)}
            fallback={
              <div className="relative flex flex-col gap-4">
                <IncomeTableSkeleton />
                <IncomeCardsSkeleton />
              </div>
            }
          >
            <IncomePageContent searchParams={resolvedParams} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
