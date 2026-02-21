"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getDashboardData, getReportsData } from "@/lib/analytics-service";
import { redirect } from "next/navigation";

export interface AnalyticsFilters {
  from?: string;
  to?: string;
  category?: string;
  tag?: string;
}

export async function getDashboardDataAction(filters?: AnalyticsFilters) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");
  return getDashboardData(session.user.id, filters);
}

export async function getReportsDataAction(filters?: AnalyticsFilters) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");
  return getReportsData(session.user.id, filters);
}
