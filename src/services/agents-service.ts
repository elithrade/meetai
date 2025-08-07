import { and, count, desc, eq, getTableColumns, ilike, sql } from "drizzle-orm";
import {
  AgentInsert,
  AgentUpdate,
  AgentWithMeetingCount,
  GetManyAgentsParams,
  GetManyAgentsResult,
} from "./agents-types";
import { db } from "@/db";
import { agents } from "@/db/schema";

export class AgentsService {
  static async getManyAgents(
    params: GetManyAgentsParams,
  ): Promise<GetManyAgentsResult> {
    const { userId, page, pageSize, search } = params;

    const whereClause = and(
      eq(agents.userId, userId),
      search ? ilike(agents.name, `%${search}%`) : undefined,
    );

    const data = await db
      .select({
        // TODO: Implement actual meeting count logic.
        meetingCount: sql<number>`6`,
        ...getTableColumns(agents),
      })
      .from(agents)
      .where(whereClause)
      .orderBy(desc(agents.createdAt), desc(agents.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const [total] = await db
      .select({ count: count() })
      .from(agents)
      .where(whereClause);

    const totalPages = Math.ceil(total.count / pageSize);

    return {
      items: data,
      total: total.count,
      totalPages,
    };
  }

  static async getAgentById(
    agentId: string,
    userId: string,
  ): Promise<AgentWithMeetingCount | undefined> {
    const [existingAgent] = await db
      .select({
        // TODO: Implement the actual meeting count logic.
        meetingCount: sql<number>`5`,
        ...getTableColumns(agents),
      })
      .from(agents)
      .where(and(eq(agents.id, agentId), eq(agents.userId, userId)));

    return existingAgent;
  }

  static async updateAgent(agentData: AgentUpdate, userId: string) {
    const [updatedAgent] = await db
      .update(agents)
      .set(agentData)
      .where(and(eq(agents.id, agentData.id), eq(agents.userId, userId)))
      .returning();

    return updatedAgent;
  }

  static async removeAgent(agentId: string, userId: string) {
    const [removedAgent] = await db
      .delete(agents)
      .where(and(eq(agents.id, agentId), eq(agents.userId, userId)))
      .returning();

    return removedAgent;
  }

  static async createAgent(agentData: AgentInsert, userId: string) {
    const [createdAgent] = await db
      .insert(agents)
      .values({ ...agentData, userId })
      .returning();

    return createdAgent;
  }
}
