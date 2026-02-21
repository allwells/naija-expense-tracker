interface ChartEmptyProps {
  message?: string;
  height?: number;
}

export function ChartEmpty({
  message = "No data for this period",
  height = 200,
}: ChartEmptyProps) {
  return (
    <div
      className="flex items-center justify-center border border-dashed rounded-md"
      style={{ height }}
    >
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
