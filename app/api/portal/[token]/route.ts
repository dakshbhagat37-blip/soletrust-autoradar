import { NextRequest } from "next/server";
import { dbStore } from "@/server/db/store";
import { updateDeliverableStatus } from "@/features/operations/project-spawner";
import { recordInvoicePayment } from "@/features/finance/invoice-engine";
import { createSuccessResponse, createErrorResponse } from "@/lib/types/api";

type RouteParams = {
  params: Promise<{ token: string }>;
};

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { token } = await params;
  if (!token) return Response.json(createErrorResponse("INVALID_TOKEN", "Token is required"), { status: 400 });

  const session = dbStore.getPortalSession(token);
  const client = dbStore.getClientByToken(token);
  const project = dbStore.getProjectByToken(token);
  const invoices = client ? dbStore.listInvoices(client.id) : [];

  return Response.json(
    createSuccessResponse({
      session: session || null,
      client: client || null,
      project: project || null,
      invoices,
    }),
    { status: 200 }
  );
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { token } = await params;
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "sign_contract") {
      const session = dbStore.getPortalSession(token);
      if (!session) return Response.json(createErrorResponse("NOT_FOUND", "Session not found"), { status: 404 });
      session.contractSigned = true;
      session.contractSignedAt = new Date().toISOString();
      session.contractSignerName = body.signerName || "Authorized Signer";
      dbStore.savePortalSession(session);
      return Response.json(createSuccessResponse(session), { status: 200 });
    }

    if (action === "approve_deliverable") {
      const { projectId, deliverableId, approvedBy, feedback } = body;
      const deliverable = updateDeliverableStatus(projectId, deliverableId, "approved", {
        approvedBy,
        feedback,
      });
      return Response.json(createSuccessResponse(deliverable), { status: 200 });
    }

    if (action === "pay_invoice") {
      const { invoiceId, amountCents } = body;
      const payment = recordInvoicePayment({
        invoiceId,
        amountCents,
        paymentReference: `PORTAL-PAY-${Date.now().toString().slice(-6)}`,
      });
      return Response.json(createSuccessResponse(payment), { status: 200 });
    }

    return Response.json(createErrorResponse("INVALID_ACTION", "Unknown portal action"), { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Portal action failed";
    return Response.json(createErrorResponse("PORTAL_ERROR", message), { status: 500 });
  }
}
