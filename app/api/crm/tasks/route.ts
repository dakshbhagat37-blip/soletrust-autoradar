import { NextRequest } from "next/server";
import { listTasks, createTask, updateTaskStatus } from "@/lib/crm/store";
import { createSuccessResponse, createErrorResponse } from "@/lib/types/api";

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get("leadId") || undefined;
    const tasks = listTasks(leadId);
    return Response.json(createSuccessResponse(tasks, undefined, requestId), { status: 200 });
  } catch (error) {
    return Response.json(
      createErrorResponse("TASK_LIST_ERROR", "Failed to retrieve tasks", String(error), requestId),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const body = await request.json();
    if (!body || !body.title) {
      return Response.json(
        createErrorResponse("INVALID_INPUT", "Task title is required", undefined, requestId),
        { status: 400 }
      );
    }

    const task = createTask({
      title: body.title,
      leadId: body.leadId,
      description: body.description,
      priority: body.priority,
      dueAt: body.dueAt,
      assignedTo: body.assignedTo,
      createdBy: body.createdBy,
    });

    return Response.json(createSuccessResponse(task, undefined, requestId), { status: 201 });
  } catch (error) {
    return Response.json(
      createErrorResponse("TASK_CREATE_ERROR", "Failed to create task", String(error), requestId),
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const body = await request.json();
    if (!body || !body.id || !body.status) {
      return Response.json(
        createErrorResponse("INVALID_INPUT", "Task ID and status are required", undefined, requestId),
        { status: 400 }
      );
    }

    const task = updateTaskStatus(body.id, body.status);
    return Response.json(createSuccessResponse(task, undefined, requestId), { status: 200 });
  } catch (error) {
    return Response.json(
      createErrorResponse("TASK_UPDATE_ERROR", "Failed to update task", String(error), requestId),
      { status: 500 }
    );
  }
}

