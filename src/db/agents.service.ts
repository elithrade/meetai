import { and, count, desc, eq, getTableColumns, ilike, sql } from "drizzle-orm";
import { GetManyAgentsParams, GetManyAgentsResult } from "./agents.types";
import { agents } from "./schema";
import { db } from ".";

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
}
