import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getIncomeForExport } from "@/lib/income-service";
import { generateIncomeCSV } from "@/lib/export-service";
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

    const incomeRecords = await getIncomeForExport(userId, startDate, endDate);
    const csv = generateIncomeCSV(incomeRecords);

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="income-${year}-${month}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("Income Export Error:", error);
    return NextResponse.json(
      { error: "Failed to generate income export" },
      { status: 500 },
    );
  }
}
