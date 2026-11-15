import { listCustomers } from "@/lib/crm/store";
import { createSuccessResponse, createErrorResponse } from "@/lib/types/api";

export async function GET() {
  const requestId = crypto.randomUUID();
  try {
    const customers = listCustomers();
    return Response.json(createSuccessResponse(customers, undefined, requestId), { status: 200 });
  } catch (error) {
    return Response.json(
      createErrorResponse("CUSTOMER_LIST_ERROR", "Failed to retrieve customers", String(error), requestId),
      { status: 500 }
    );
  }
}
