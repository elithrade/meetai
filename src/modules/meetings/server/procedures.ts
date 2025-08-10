import {
  createTRPCRouter,
  premiumProcedure,
  protectedProcedure,
} from "@/trpc/init";
import z from "zod";
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
} from "@/constants";
import { TRPCError } from "@trpc/server";
import { meetingInsertSchema, meetingUpdateSchema } from "../schema";
import { MeetingStatus } from "../types";
import { AgentsService, MeetingsService, StreamService } from "@/services";

export const meetingsRouter = createTRPCRouter({
  generateChatToken: protectedProcedure.mutation(async ({ ctx }) => {
    return await StreamService.generateChatToken(ctx.auth.user.id);
  }),

  getTranscript: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const existingMeeting = await MeetingsService.getMeetingById(
        input.id,
        ctx.auth.user.id,
      );

      if (!existingMeeting) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meeting not found",
        });
      }

      if (!existingMeeting.transcriptUrl) {
        return [];
      }

      return await StreamService.getTranscriptWithSpeakers(
        existingMeeting.transcriptUrl,
      );
    }),

  generateStreamToken: protectedProcedure.mutation(async ({ ctx }) => {
    return await StreamService.generateStreamToken({
      id: ctx.auth.user.id,
      name: ctx.auth.user.name,
      image: ctx.auth.user.image,
    });
  }),

  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const removedMeeting = await MeetingsService.removeMeeting(
        input.id,
        ctx.auth.user.id,
      );

      if (!removedMeeting) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meeting not found",
        });
      }

      return removedMeeting;
    }),

  update: protectedProcedure
    .input(meetingUpdateSchema)
    .mutation(async ({ input, ctx }) => {
      const updatedMeeting = await MeetingsService.updateMeeting(
        input,
        ctx.auth.user.id,
      );

      if (!updatedMeeting) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meeting not found",
        });
      }

      return updatedMeeting;
    }),

  create: premiumProcedure("meetings")
    .input(meetingInsertSchema)
    .mutation(async ({ input, ctx }) => {
      const createdMeeting = await MeetingsService.createMeeting(
        input,
        ctx.auth.user.id,
      );

      // Create video call
      await StreamService.createVideoCall(createdMeeting.id, ctx.auth.user.id, {
        meetingId: createdMeeting.id,
        meetingName: createdMeeting.name,
      });

      const existingAgent = await AgentsService.getAgentById(
        createdMeeting.agentId,
      );

      if (!existingAgent) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" });
      }

      // Upsert agent user in stream
      await StreamService.upsertAgentUser({
        id: existingAgent.id,
        name: existingAgent.name,
      });

      return createdMeeting;
    }),

  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const existingMeeting = await MeetingsService.getMeetingById(
        input.id,
        ctx.auth.user.id,
      );

      if (!existingMeeting) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meeting not found",
        });
      }

      return existingMeeting;
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
        agentId: z.string().nullish(),
        status: z
          .enum([
            MeetingStatus.Upcoming,
            MeetingStatus.Active,
            MeetingStatus.Completed,
            MeetingStatus.Processing,
            MeetingStatus.Cancelled,
          ])
          .nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await MeetingsService.getManyMeetings({
        userId: ctx.auth.user.id,
        page: input.page,
        pageSize: input.pageSize,
        search: input.search,
        agentId: input.agentId,
        status: input.status,
      });
    }),
});
