import { db } from "@/db";
import { agents } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  createTRPCRouter,
  baseProcedure,
  protectedProcedure,
} from "@/trpc/init";
// import { TRPCError } from "@trpc/server";
import { agentInsertSchema } from "../schemas";
import z from "zod";

export const agentsRouter = createTRPCRouter({
  // TODO: Change getOne to use protectedProcedure
  getOne: baseProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const [existingAgent] = await db
        .select()
        .from(agents)
        .where(eq(agents.id, input.id));

      return existingAgent;
    }),
  // TODO: Change getMany to use protectedProcedure
  getMany: baseProcedure.query(async () => {
    const data = await db.select().from(agents);
    return data;
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
