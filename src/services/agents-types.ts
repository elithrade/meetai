import { agentInsertSchema, agentUpdateSchema } from "@/modules/agents/schemas";
import z from "zod";

export type GetManyAgentsParams = {
  userId: string;
  page: number;
  pageSize: number;
  search?: string | null;
};

export type GetManyAgentsResult = {
  items: Array<AgentWithMeetingCount>;
  total: number;
  totalPages: number;
};

export type AgentWithMeetingCount = {
  meetingCount: number;
  id: string;
  userId: string;
  name: string;
  instructions: string;
  createdAt: Date;
  updatedAt: Date;
};

export type AgentInsert = z.infer<typeof agentInsertSchema>;

export type AgentUpdate = z.infer<typeof agentUpdateSchema>;
