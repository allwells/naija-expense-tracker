export const CHART_COLORS = {
  chart1: "var(--chart-1)", // orange — primary spend
  chart2: "var(--chart-2)", // teal — income
  chart3: "var(--chart-3)", // blue — tax
  chart4: "var(--chart-4)", // yellow — deductible
  chart5: "var(--chart-5)", // amber — non-deductible
  muted: "var(--muted-foreground)",
  border: "var(--border)",
  background: "var(--card)",
  foreground: "var(--card-foreground)",
} as const;

export const CATEGORY_COLORS: Record<string, string> = {
  office_supplies: "var(--chart-1)",
  travel: "var(--chart-2)",
  meals_entertainment: "var(--chart-3)",
  software_subscriptions: "var(--chart-4)",
  equipment: "var(--chart-5)",
  rent: "var(--chart-1)",
  utilities: "var(--chart-2)",
  salaries: "var(--chart-3)",
  marketing: "var(--chart-4)",
  professional_services: "var(--chart-5)",
  bank_charges: "var(--chart-1)",
  insurance: "var(--chart-2)",
  repairs_maintenance: "var(--chart-3)",
  fuel: "var(--chart-4)",
  airtime_internet: "var(--chart-5)",
  other: "var(--muted-foreground)",
};
