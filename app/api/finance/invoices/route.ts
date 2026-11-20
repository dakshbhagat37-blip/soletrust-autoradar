import { NextRequest } from "next/server";
import { dbStore } from "@/server/db/store";
import { createInvoiceFromMilestone, generatePrintableInvoiceHtml, generateOverdueReminder } from "@/features/finance/invoice-engine";
import { createSuccessResponse, createErrorResponse } from "@/lib/types/api";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId") || undefined;
  const invoiceId = searchParams.get("id");
  const format = searchParams.get("format");

  if (invoiceId) {
    const inv = dbStore.getInvoice(invoiceId);
    if (!inv) return Response.json(createErrorResponse("NOT_FOUND", "Invoice not found"), { status: 404 });
    if (format === "html") {
      const html = generatePrintableInvoiceHtml(inv);
      return new Response(html, { headers: { "Content-Type": "text/html" } });
    }
    return Response.json(createSuccessResponse(inv), { status: 200 });
  }

  const invoices = dbStore.listInvoices(clientId);
  return Response.json(createSuccessResponse(invoices), { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === "send_reminder") {
      const reminder = generateOverdueReminder(body.invoiceId);
      return Response.json(createSuccessResponse(reminder), { status: 200 });
    }

    if (!body.projectId || !body.milestoneId) {
      return Response.json(createErrorResponse("INVALID_INPUT", "projectId and milestoneId are required"), { status: 400 });
    }

    const invoice = createInvoiceFromMilestone({
      projectId: body.projectId,
      milestoneId: body.milestoneId,
      dueDateDays: body.dueDateDays,
      taxType: body.taxType,
      customNotes: body.customNotes,
    });

    return Response.json(createSuccessResponse(invoice), { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to generate invoice";
    return Response.json(createErrorResponse("INVOICE_FAILED", message), { status: 500 });
  }
}
