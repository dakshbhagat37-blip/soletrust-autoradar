import { getFinancialHealthMetrics } from "@/features/finance/ledger-engine";
import { dbStore } from "@/server/db/store";
import { createSuccessResponse } from "@/lib/types/api";

export async function GET() {
  const expenses = dbStore.listExpenses();
  const invoices = dbStore.listInvoices();
  const metrics = getFinancialHealthMetrics();

  return Response.json(
    createSuccessResponse({
      metrics,
      invoices,
      expenses,
    }),
    { status: 200 }
  );
}
