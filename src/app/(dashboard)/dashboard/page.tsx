import { Suspense } from "react";
import { Skeleton } from "@/components/ui";
import { Header } from "@/components/Header";
import { DashboardClient } from "@/components/Dashboard";
import { getDashboardDataAction } from "@/app/actions/analytics-actions";

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4 pb-8 px-4 md:px-6">
      {/* Filters Skeleton */}
      <div className="flex w-full items-center justify-end">
        <Skeleton className="h-8 w-24" />
      </div>

      {/* StatsRow Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>

      {/* Bento Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Skeleton className="h-90 w-full rounded-xl" />
        </div>
        <div className="lg:col-span-1">
          <Skeleton className="h-90 w-full rounded-xl" />
        </div>
        <div className="lg:col-span-1">
          <Skeleton className="h-90 w-full rounded-xl" />
        </div>
        <div className="lg:col-span-2">
          <Skeleton className="h-90 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

interface DashboardContentProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Separate async component to enable Suspense boundary at the page level
async function DashboardContent({ searchParams }: DashboardContentProps) {
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

  const preset =
    typeof resolvedParams.preset === "string"
      ? resolvedParams.preset
      : undefined;

  const data = await getDashboardDataAction({ from, to, category, tag });

  return (
    <div className="px-4 md:px-6">
      <DashboardClient data={data} activePreset={preset} />
    </div>
  );
}

export default function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <div className="w-full">
      <Header title="Dashboard" />

      <main className="mt-8">
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  );
}
