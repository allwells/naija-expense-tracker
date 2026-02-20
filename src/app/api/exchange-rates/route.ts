import { apiOk, apiError } from "@/lib/api-response";
import { getAllRates } from "@/lib/exchange-rate-service";
import { FX_ERRORS } from "@/types/errors";

export const runtime = "nodejs";

export async function GET() {
  try {
    const rates = await getAllRates();
    return apiOk({ rates, timestamp: new Date().toISOString() });
  } catch {
    return apiError(FX_ERRORS.FETCH_FAILED, 503);
  }
}
