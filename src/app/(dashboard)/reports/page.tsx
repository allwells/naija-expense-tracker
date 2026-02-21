import { Suspense } from "react";
import { Header } from "@/components/Header";
import { Skeleton } from "@/components/ui";
import { ReportsClient } from "@/components/Reports";
import { ReportsFilters } from "@/components/Reports/ReportsFilters";
import { ExportPanel } from "@/components/ExportPanel";
import { getReportsDataAction } from "@/app/actions/analytics-actions";

function ReportsSkeleton() {
  return (
    <div className="flex flex-col gap-4 pb-8">
      <Skeleton className="h-[400px] w-full rounded-xl" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[500px] w-full rounded-xl" />
        <Skeleton className="h-[500px] w-full rounded-xl" />
      </div>
    </div>
  );
}

interface ReportsContentProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function ReportsContent({ searchParams }: ReportsContentProps) {
  const resolvedParams = await searchParams;
  const from =
    typeof resolvedParams.from === "string" ? resolvedParams.from : undefined;
  const to =
    typeof resolvedParams.to === "string" ? resolvedParams.to : undefined;
  const category =
    typeof resolvedParams.category === "string"
      ? resolvedParams.category
      : undefined;
  const tag =
    typeof resolvedParams.tag === "string" ? resolvedParams.tag : undefined;

  const data = await getReportsDataAction({ from, to, category, tag });

  return <ReportsClient data={data} />;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const paramsKey = JSON.stringify(resolvedParams);

  return (
    <div className="w-full">
      <Header title="Reports & Tax" />

      <main className="mt-8 px-4 md:px-6">
        <div className="max-w-12xl mx-auto">
          <div className="flex w-full items-center justify-end gap-2 mb-4">
            <ReportsFilters />
            <ExportPanel />
          </div>

          <Suspense key={paramsKey} fallback={<ReportsSkeleton />}>
            <ReportsContent searchParams={searchParams} />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
