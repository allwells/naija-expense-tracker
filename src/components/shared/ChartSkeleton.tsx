import { Skeleton } from "@/components/ui/skeleton";

interface ChartSkeletonProps {
  height?: number;
}

export function ChartSkeleton({ height = 280 }: ChartSkeletonProps) {
  return <Skeleton className="w-full" style={{ height }} />;
}
