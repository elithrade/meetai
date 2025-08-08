import {
  MessageNewEvent,
  CallTranscriptionReadyEvent,
  CallSessionParticipantLeftEvent,
  CallRecordingReadyEvent,
  CallSessionStartedEvent,
  CallEndedEvent,
} from "@stream-io/node-sdk";

import { NextRequest, NextResponse } from "next/server";
import { streamVideo } from "@/lib/stream-video";
import { MeetingStatus } from "@/modules/meetings/types";
import { inngest } from "@/inngest/client";
import {
  MeetingsService,
  AgentsService,
  StreamService,
  AIService,
} from "@/services";

function verifySignature(body: string, signature: string): boolean {
  return streamVideo.verifyWebhook(body, signature);
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("x-signature");
  const apiKey = request.headers.get("x-api-key");

  if (!signature || !apiKey) {
    return NextResponse.json(
      { error: "Missing signature or API key" },
      { status: 400 },
    );
  }

  const body = await request.text();

  if (!verifySignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const eventType = (payload as Record<string, unknown>)?.type as string;

  const eventHandlers = {
    "call.session_started": (payload: unknown) =>
      handleCallSessionStarted(payload as CallSessionStartedEvent),
    "call.session_participant_left": (payload: unknown) =>
      handleCallSessionParticipantLeft(
        payload as CallSessionParticipantLeftEvent,
      ),
    "call.session_ended": (payload: unknown) =>
      handleCallSessionEnded(payload as CallEndedEvent),
    "call.transcription_ready": (payload: unknown) =>
      handleCallTranscriptionReady(payload as CallTranscriptionReadyEvent),
    "call.recording_ready": (payload: unknown) =>
      handleCallRecordingReady(payload as CallRecordingReadyEvent),
    "message.new": (payload: unknown) =>
      handleMessageNew(payload as MessageNewEvent),
  } as const;

  const handler = eventHandlers[eventType as keyof typeof eventHandlers];

  if (handler) {
    return await handler(payload);
  }

  return NextResponse.json({ status: "ok" });
}

async function handleCallSessionStarted(event: CallSessionStartedEvent) {
  const meetingId = event.call.custom?.meetingId as string;

  if (!meetingId) {
    return NextResponse.json({ error: "Missing meetingId" }, { status: 400 });
  }

  const existingMeeting = await MeetingsService.getMeetingByIdAndStatus(
    meetingId,
    MeetingStatus.Upcoming,
  );

  if (!existingMeeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  const existingAgent = await AgentsService.getAgentById(
    existingMeeting.agentId,
  );

  if (!existingAgent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  await MeetingsService.updateMeetingStatus(
    meetingId,
    MeetingStatus.Active,
    new Date(),
    undefined,
  );

  await StreamService.connectOpenAiToCall(
    meetingId,
    existingAgent.id,
    existingAgent.instructions,
  );

  return NextResponse.json({ status: "ok" });
}

async function handleCallSessionParticipantLeft(
  event: CallSessionParticipantLeftEvent,
) {
  // call_cid is formatted as "type:<meetingId>"
  const meetingId = event.call_cid.split(":")[1];

  if (!meetingId) {
    return NextResponse.json({ error: "Missing meetingId" }, { status: 400 });
  }

  // Failsafe for ending the call.
  await StreamService.endCall(meetingId);

  return NextResponse.json({ status: "ok" });
}

async function handleCallSessionEnded(event: CallEndedEvent) {
  const meetingId = event.call.custom?.meetingId as string;

  if (!meetingId) {
    return NextResponse.json({ error: "Missing meetingId" }, { status: 400 });
  }

  await MeetingsService.updateMeetingStatus(
    meetingId,
    MeetingStatus.Processing,
    undefined,
    new Date(),
  );

  return NextResponse.json({ status: "ok" });
}

async function handleCallTranscriptionReady(
  event: CallTranscriptionReadyEvent,
) {
  const meetingId = event.call_cid.split(":")[1];

  const updatedMeeting = await MeetingsService.updateMeetingTranscript(
    meetingId,
    event.call_transcription.url,
  );

  if (!updatedMeeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  await inngest.send({
    name: "meetings/processing",
    data: {
      meetingId: updatedMeeting.id,
      transcriptUrl: updatedMeeting.transcriptUrl,
    },
  });

  return NextResponse.json({ status: "ok" });
}

async function handleCallRecordingReady(event: CallRecordingReadyEvent) {
  const meetingId = event.call_cid.split(":")[1];

  await MeetingsService.updateMeetingRecording(
    meetingId,
    event.call_recording.url,
  );

  return NextResponse.json({ status: "ok" });
}

async function handleMessageNew(event: MessageNewEvent) {
  const userId = event.user?.id;
  const channelId = event.channel_id;
  const text = event.message?.text;

  if (!userId || !channelId || !text) {
    return NextResponse.json(
      { error: "Missing userId, channelId or text" },
      { status: 400 },
    );
  }

  const existingMeeting = await MeetingsService.getMeetingByIdAndStatus(
    channelId,
    MeetingStatus.Completed,
  );

  if (!existingMeeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  const existingAgent = await AgentsService.getAgentById(
    existingMeeting.agentId,
  );

  if (!existingAgent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  // Someone not an agent sent a message in the channel.
  if (userId !== existingAgent.id) {
    const recentMessages = await StreamService.getChannelMessages(channelId, 5);

    const conversationHistory = AIService.convertChatMessagesToOpenAI(
      recentMessages,
      existingAgent.id,
    );

    const aiResponse = await AIService.generateMeetingFollowupResponse(
      existingMeeting.summary!,
      existingAgent.instructions,
      conversationHistory,
      text,
    );

    if (!aiResponse) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 400 },
      );
    }

    console.log(JSON.stringify(aiResponse, null, 2));

    await StreamService.sendAgentMessage(
      channelId,
      existingAgent.id,
      existingAgent.name,
      aiResponse,
    );
  }

  return NextResponse.json({ status: "ok" });
}
