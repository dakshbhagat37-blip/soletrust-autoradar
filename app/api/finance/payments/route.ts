import { NextRequest } from "next/server";
import { recordInvoicePayment } from "@/features/finance/invoice-engine";
import { createSuccessResponse, createErrorResponse } from "@/lib/types/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { invoiceId, amountCents, paymentReference, notes } = body;

    if (!invoiceId || !amountCents) {
      return Response.json(
        createErrorResponse("INVALID_INPUT", "invoiceId and amountCents are required"),
        { status: 400 }
      );
    }

    const updatedInvoice = recordInvoicePayment({
      invoiceId,
      amountCents,
      paymentReference,
      notes,
    });

    return Response.json(createSuccessResponse(updatedInvoice), { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to record payment";
    return Response.json(createErrorResponse("PAYMENT_FAILED", message), { status: 500 });
  }
}
