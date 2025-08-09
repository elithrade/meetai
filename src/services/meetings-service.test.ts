import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { MeetingsService } from "./meetings-service";
import { db } from "@/db";
import { meetings } from "@/db/schema";
import { MeetingStatus } from "@/modules/meetings/types";

vi.mock("@/db", () => ({
  db: {
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    select: vi.fn(),
  },
}));

vi.mock("@/db/schema", () => ({
  meetings: {
    id: "id",
    userId: "user_id",
    createdAt: "created_at",
    name: "name",
    status: "status",
    agentId: "agent_id",
    startedAt: "started_at",
    endedAt: "ended_at",
  },
  agents: { id: "agent_id", name: "agent_name" },
}));

describe("MeetingsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createMeeting", () => {
    it("should insert meeting and return created record", async () => {
      const meetingData = { name: "Test Meeting", agentId: "a1" };
      const mockMeeting = { id: "m1", ...meetingData, userId: "u1" };

      (db.insert as Mock).mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockReturnValue([mockMeeting]),
        }),
      });

      const result = await MeetingsService.createMeeting(meetingData, "u1");

      expect(result).toEqual(mockMeeting);
      expect(db.insert).toHaveBeenCalledWith(meetings);
    });
  });

  describe("updateMeeting", () => {
    it("should update meeting and return updated record", async () => {
      const meetingData = { id: "m1", name: "Updated", agentId: "a1" };
      const mockMeeting = { ...meetingData, userId: "u1" };

      (db.update as Mock).mockReturnValueOnce({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockReturnValue([mockMeeting]),
          }),
        }),
      });

      const result = await MeetingsService.updateMeeting(meetingData, "u1");
      expect(result).toEqual(mockMeeting);
    });
  });

  describe("removeMeeting", () => {
    it("should delete meeting and return removed record", async () => {
      const mockMeeting = { id: "m1" };

      (db.delete as Mock).mockReturnValueOnce({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockReturnValue([mockMeeting]),
        }),
      });

      const result = await MeetingsService.removeMeeting("m1", "u1");
      expect(result).toEqual(mockMeeting);
    });
  });

  describe("getMeetingById", () => {
    it("should return meeting with agent and duration", async () => {
      const mockMeeting = { id: "m1", agent: {}, duration: 100 };

      (db.select as Mock).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue([mockMeeting]),
          }),
        }),
      });

      const result = await MeetingsService.getMeetingById("m1", "u1");
      expect(result).toEqual(mockMeeting);
    });
  });

  describe("getManyMeetings", () => {
    it("should return paginated meetings", async () => {
      const mockMeetings = [{ id: "m1", agent: {}, duration: 100 }];
      const mockCount = [{ count: 5 }];

      const orderByMock = vi.fn().mockReturnThis();
      const limitMock = vi.fn().mockReturnThis();
      const offsetMock = vi.fn().mockResolvedValue(mockMeetings);

      (db.select as Mock)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: orderByMock,
                limit: limitMock,
                offset: offsetMock,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue(mockCount),
          }),
        });

      const result = await MeetingsService.getManyMeetings({
        userId: "u1",
        search: null,
        page: 1,
        pageSize: 10,
      });

      expect(result.items).toEqual(mockMeetings);
      expect(result.total).toBe(5);
      expect(result.totalPages).toBe(1);
    });
  });

  describe("getMeetingByIdAndStatus", () => {
    it("should return meeting if id and status match", async () => {
      const mockMeeting = { id: "m1", status: MeetingStatus.Active };

      (db.select as Mock).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue([mockMeeting]),
        }),
      });

      const result = await MeetingsService.getMeetingByIdAndStatus(
        "m1",
        MeetingStatus.Active,
      );
      expect(result).toEqual(mockMeeting);
    });
  });

  describe("updateMeetingStatus", () => {
    it("should update meeting status and return updated record", async () => {
      const mockMeeting = { id: "m1", status: MeetingStatus.Completed };

      (db.update as Mock).mockReturnValueOnce({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockReturnValue([mockMeeting]),
          }),
        }),
      });

      const result = await MeetingsService.updateMeetingStatus(
        "m1",
        MeetingStatus.Completed,
      );
      expect(result).toEqual(mockMeeting);
    });
  });

  describe("updateMeetingTranscript", () => {
    it("should update meeting transcript URL", async () => {
      const mockMeeting = { id: "m1", transcriptUrl: "url" };

      (db.update as Mock).mockReturnValueOnce({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockReturnValue([mockMeeting]),
          }),
        }),
      });

      const result = await MeetingsService.updateMeetingTranscript("m1", "url");
      expect(result).toEqual(mockMeeting);
    });
  });

  describe("updateMeetingRecording", () => {
    it("should update meeting recording URL", async () => {
      const mockMeeting = { id: "m1", recordingUrl: "url" };

      (db.update as Mock).mockReturnValueOnce({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockReturnValue([mockMeeting]),
          }),
        }),
      });

      const result = await MeetingsService.updateMeetingRecording("m1", "url");
      expect(result).toEqual(mockMeeting);
    });
  });

  describe("completeMeetingWithSummary", () => {
    it("should complete meeting with summary", async () => {
      const mockMeeting = {
        id: "m1",
        status: MeetingStatus.Completed,
        summary: "Summary",
      };

      (db.update as Mock).mockReturnValueOnce({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockReturnValue([mockMeeting]),
          }),
        }),
      });

      const result = await MeetingsService.completeMeetingWithSummary(
        "m1",
        "Summary",
      );
      expect(result).toEqual(mockMeeting);
    });
  });
});
