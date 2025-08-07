import { MeetingStatus } from "@/modules/meetings/types";
import z from "zod";
import {
  meetingInsertSchema,
  meetingUpdateSchema,
} from "@/modules/meetings/schema";
import { agents, meetings } from "@/db/schema";

export type GetManyMeetingsParams = {
  userId: string;
  page: number;
  pageSize: number;
  search?: string | null;
  agentId?: string | null;
  status?: MeetingStatus | null;
};

export type GetManyMeetingsResult = {
  items: Array<
    {
      duration: number;
      agent: typeof agents.$inferSelect;
    } & typeof meetings.$inferSelect
  >;
  total: number;
  totalPages: number;
};

export type MeetingWithAgentAndDuration = {
  duration: number;
  agent: typeof agents.$inferSelect;
};

export type MeetingInsert = z.infer<typeof meetingInsertSchema>;

export type MeetingUpdate = z.infer<typeof meetingUpdateSchema>;
