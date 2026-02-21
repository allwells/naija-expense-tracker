import { Suspense } from "react";
import { Header } from "@/components/Header";
import { Skeleton } from "@/components/ui";
import { ReportsClient } from "@/components/Reports";
import { getReportsDataAction } from "@/app/actions/analytics-actions";

function ReportsSkeleton() {
  return (
    <div className="flex flex-col gap-4 pb-8 px-4 md:px-6">
      <div className="flex w-full items-center justify-end">
        <Skeleton className="h-8 w-24" />
      </div>
      <Skeleton className="h-90 w-full rounded-xl" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-100 w-full rounded-xl" />
        <Skeleton className="h-100 w-full rounded-xl" />
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

  return (
    <div className="px-4 md:px-6">
      <ReportsClient data={data} />
    </div>
  );
}

export default function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <div className="w-full">
      <Header title="Reports & Tax" />

      <main className="mt-8">
        <Suspense fallback={<ReportsSkeleton />}>
          <ReportsContent searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  );
}
