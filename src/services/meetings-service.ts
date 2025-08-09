import { and, count, desc, eq, getTableColumns, ilike, sql } from "drizzle-orm";
import {
  GetManyMeetingsParams,
  GetManyMeetingsResult,
  MeetingInsert,
  MeetingUpdate,
} from "./meetings-types";
import { agents, meetings } from "@/db/schema";
import { db } from "@/db";
import { MeetingStatus } from "@/modules/meetings/types";

export class MeetingsService {
  static async createMeeting(meetingData: MeetingInsert, userId: string) {
    const [createdMeeting] = await db
      .insert(meetings)
      .values({
        ...meetingData,
        userId,
      })
      .returning();

    return createdMeeting;
  }

  static async updateMeeting(meetingData: MeetingUpdate, userId: string) {
    const [updatedMeeting] = await db
      .update(meetings)
      .set(meetingData)
      .where(and(eq(meetings.id, meetingData.id), eq(meetings.userId, userId)))
      .returning();

    return updatedMeeting;
  }

  static async removeMeeting(meetingId: string, userId: string) {
    const [removedMeeting] = await db
      .delete(meetings)
      .where(and(eq(meetings.id, meetingId), eq(meetings.userId, userId)))
      .returning();

    return removedMeeting;
  }

  static async getMeetingById(meetingId: string, userId: string) {
    const [existingMeeting] = await db
      .select({
        ...getTableColumns(meetings),
        agent: agents,
        duration:
          sql<number>`EXTRACT(EPOCH FROM ${meetings.endedAt} - ${meetings.startedAt})`.as(
            "duration",
          ),
      })
      .from(meetings)
      .innerJoin(agents, eq(meetings.agentId, agents.id))
      .where(and(eq(meetings.id, meetingId), eq(meetings.userId, userId)));

    return existingMeeting;
  }

  static async getManyMeetings(
    params: GetManyMeetingsParams,
  ): Promise<GetManyMeetingsResult> {
    const { userId, search, page, pageSize, status, agentId } = params;

    const whereClause = and(
      eq(meetings.userId, userId),
      search ? ilike(meetings.name, `%${search}%`) : undefined,
      status ? eq(meetings.status, status) : undefined,
      agentId ? eq(meetings.agentId, agentId) : undefined,
    );

    const data = await db
      .select({
        ...getTableColumns(meetings),
        agent: agents,
        duration:
          sql<number>`EXTRACT(EPOCH FROM ${meetings.endedAt} - ${meetings.startedAt})`.as(
            "duration",
          ),
      })
      .from(meetings)
      .innerJoin(agents, eq(meetings.agentId, agents.id))
      .where(whereClause)
      .orderBy(desc(meetings.createdAt), desc(meetings.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const [total] = await db
      .select({ count: count() })
      .from(meetings)
      .where(whereClause);

    const totalPages = Math.ceil(total.count / pageSize);

    return {
      items: data,
      total: total.count,
      totalPages,
    };
  }

  static async getMeetingByIdAndStatus(
    meetingId: string,
    status: MeetingStatus,
  ) {
    const [meeting] = await db
      .select()
      .from(meetings)
      .where(and(eq(meetings.id, meetingId), eq(meetings.status, status)));

    return meeting;
  }

  // TODO: Change params to use UpdateMeetingStatus
  static async updateMeetingStatus(
    meetingId: string,
    status: MeetingStatus,
    startedAt?: Date,
    endedAt?: Date,
  ) {
    type UpdateData = {
      startedAt?: Date;
      endedAt?: Date;
      status: MeetingStatus;
    };

    const updateData: UpdateData = { status };

    if (startedAt) {
      updateData.startedAt = startedAt;
    }
    if (endedAt) {
      updateData.endedAt = endedAt;
    }

    const whereClause = and(eq(meetings.id, meetingId));

    const [updatedMeeting] = await db
      .update(meetings)
      .set(updateData)
      .where(whereClause)
      .returning();

    return updatedMeeting;
  }

  static async updateMeetingTranscript(
    meetingId: string,
    transcriptUrl: string,
  ) {
    const [updatedMeeting] = await db
      .update(meetings)
      .set({ transcriptUrl })
      .where(eq(meetings.id, meetingId))
      .returning();

    return updatedMeeting;
  }

  static async updateMeetingRecording(meetingId: string, recordingUrl: string) {
    const [updatedMeeting] = await db
      .update(meetings)
      .set({ recordingUrl })
      .where(eq(meetings.id, meetingId))
      .returning();

    return updatedMeeting;
  }

  static async completeMeetingWithSummary(meetingId: string, summary: string) {
    const [updatedMeeting] = await db
      .update(meetings)
      .set({
        summary,
        status: MeetingStatus.Completed,
      })
      .where(eq(meetings.id, meetingId))
      .returning();

    return updatedMeeting;
  }
}
