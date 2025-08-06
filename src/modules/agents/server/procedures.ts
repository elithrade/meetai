import { db } from "@/db";
import { agents } from "@/db/schema";
import { and, eq, getTableColumns, sql } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { agentInsertSchema, agentUpdateSchema } from "../schemas";
import z from "zod";
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
} from "@/constants";
import { TRPCError } from "@trpc/server";
import { AgentsService } from "@/db/agents.service";

export const agentsRouter = createTRPCRouter({
  update: protectedProcedure
    .input(agentUpdateSchema)
    .mutation(async ({ input, ctx }) => {
      const [updatedAgent] = await db
        .update(agents)
        .set(input)
        .where(
          and(eq(agents.id, input.id), eq(agents.userId, ctx.auth.user.id)),
        )
        .returning();

      if (!updatedAgent) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" });
      }

      return updatedAgent;
    }),
  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [removedAgent] = await db
        .delete(agents)
        .where(
          and(eq(agents.id, input.id), eq(agents.userId, ctx.auth.user.id)),
        )
        .returning();

      if (!removedAgent) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" });
      }

      return removedAgent;
    }),
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const [existingAgent] = await db
        .select({
          // TODO: Implement the actual meeting count logic.
          meetingCount: sql<number>`5`,
          ...getTableColumns(agents),
        })
        .from(agents)
        .where(
          and(eq(agents.id, input.id), eq(agents.userId, ctx.auth.user.id)),
        );

      if (!existingAgent) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" });
      }

      return existingAgent;
    }),

  getMany: protectedProcedure
    .input(
      z.object({
        page: z.number().default(DEFAULT_PAGE),
        pageSize: z
          .number()
          .min(MIN_PAGE_SIZE)
          .max(MAX_PAGE_SIZE)
          .default(DEFAULT_PAGE_SIZE),
        search: z.string().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await AgentsService.getManyAgents({
        userId: ctx.auth.user.id,
        page: input.page,
        pageSize: input.pageSize,
        search: input.search,
      });
    }),

  create: protectedProcedure
    .input(agentInsertSchema)
    .mutation(async ({ input, ctx }) => {
      const [createdAgent] = await db
        .insert(agents)
        .values({ ...input, userId: ctx.auth.user.id })
        .returning();

      return createdAgent;
    }),
});
