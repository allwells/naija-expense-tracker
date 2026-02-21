import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getExpensesForExport } from "@/lib/expense-service";
import { getIncomeForExport } from "@/lib/income-service";
import { getProfile } from "@/lib/profile-service";
import { getReportsData } from "@/lib/analytics-service";
import { generateTaxSummaryCSV } from "@/lib/export-service";
import { startOfYear, endOfYear, endOfDay } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const now = new Date();
    const startDate = from
      ? new Date(from).toISOString()
      : startOfYear(now).toISOString();
    const endDate = to
      ? endOfDay(new Date(to)).toISOString()
      : endOfYear(now).toISOString();

    const fromStr = from ?? undefined;
    const toStr = to ?? undefined;

    const [profile, expenses, incomeRecords, reportsData] = await Promise.all([
      getProfile(userId),
      getExpensesForExport(userId, startDate, endDate),
      getIncomeForExport(userId, startDate, endDate),
      getReportsData(userId, { from: fromStr, to: toStr }),
    ]);

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const taxResult = reportsData.tax;
    if (!taxResult) {
      return NextResponse.json(
        { error: "Could not compute tax liability" },
        { status: 500 },
      );
    }

    const csv = generateTaxSummaryCSV(
      profile,
      expenses,
      incomeRecords,
      taxResult,
    );

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="tax-summary-${year}-${month}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("Tax Summary Export Error:", error);
    return NextResponse.json(
      { error: "Failed to generate tax summary export" },
      { status: 500 },
    );
  }
}
