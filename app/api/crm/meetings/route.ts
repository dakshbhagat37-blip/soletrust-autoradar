import { NextRequest } from "next/server";
import { listMeetings, scheduleMeeting, completeMeeting } from "@/lib/crm/store";
import { createSuccessResponse, createErrorResponse } from "@/lib/types/api";

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get("leadId") || undefined;
    const meetings = listMeetings(leadId);
    return Response.json(createSuccessResponse(meetings, undefined, requestId), { status: 200 });
  } catch (error) {
    return Response.json(
      createErrorResponse("MEETING_LIST_ERROR", "Failed to retrieve meetings", String(error), requestId),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const body = await request.json();
    if (!body || !body.title || !body.startsAt) {
      return Response.json(
        createErrorResponse("INVALID_INPUT", "Meeting title and start time are required", undefined, requestId),
        { status: 400 }
      );
    }

    const meeting = scheduleMeeting({
      title: body.title,
      leadId: body.leadId,
      description: body.description,
      startsAt: body.startsAt,
      endsAt: body.endsAt,
      location: body.location,
      meetingUrl: body.meetingUrl,
      attendees: body.attendees,
      agenda: body.agenda,
      organizedBy: body.organizedBy,
    });

    return Response.json(createSuccessResponse(meeting, undefined, requestId), { status: 201 });
  } catch (error) {
    return Response.json(
      createErrorResponse("MEETING_CREATE_ERROR", "Failed to schedule meeting", String(error), requestId),
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const body = await request.json();
    if (!body || !body.id) {
      return Response.json(
        createErrorResponse("INVALID_INPUT", "Meeting ID is required", undefined, requestId),
        { status: 400 }
      );
    }

    const meeting = completeMeeting(body.id, body.notes, body.outcome);
    return Response.json(createSuccessResponse(meeting, undefined, requestId), { status: 200 });
  } catch (error) {
    return Response.json(
      createErrorResponse("MEETING_UPDATE_ERROR", "Failed to complete meeting", String(error), requestId),
      { status: 500 }
    );
  }
}

