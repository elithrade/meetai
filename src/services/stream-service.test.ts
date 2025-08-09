import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import { StreamService } from "./stream-service";
// import { db } from "@/db";
import { streamVideo } from "@/lib/stream-video";
import { streamChat } from "@/lib/stream-chat";
import { generateAvatarUri } from "@/lib/avatar";
import JSONL from "jsonl-parse-stringify";

// Mock external dependencies
vi.mock("@/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    then: vi.fn(),
  },
}));

vi.mock("@/lib/stream-video", () => ({
  streamVideo: {
    createToken: vi.fn(),
    upsertUsers: vi.fn(),
    generateUserToken: vi.fn(),
    video: {
      call: vi.fn(),
      connectOpenAi: vi.fn(),
    },
  },
}));

vi.mock("@/lib/stream-chat", () => ({
  streamChat: {
    createToken: vi.fn(),
    upsertUser: vi.fn(),
    channel: vi.fn(),
  },
}));

vi.mock("@/lib/avatar", () => ({
  generateAvatarUri: vi.fn(),
}));

vi.mock("jsonl-parse-stringify", () => ({
  default: {
    parse: vi.fn(),
  },
}));

// Mock fetch globally
global.fetch = vi.fn();

describe("StreamService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("generateChatToken", () => {
    it("should generate chat token and upsert user", async () => {
      const mockToken = "mock-chat-token";
      const userId = "user-123";

      (streamChat.createToken as Mock).mockResolvedValue(mockToken);
      (streamChat.upsertUser as Mock).mockResolvedValue(undefined);

      const result = await StreamService.generateChatToken(userId);

      expect(streamChat.createToken).toHaveBeenCalledWith(userId);
      expect(streamChat.upsertUser).toHaveBeenCalledWith({
        id: userId,
        role: "admin",
      });
      expect(result).toBe(mockToken);
    });
  });

  describe("generateStreamToken", () => {
    it("should generate stream token with user image", async () => {
      const mockUser = {
        id: "user-123",
        name: "John Doe",
        image: "https://example.com/avatar.jpg",
      };
      const mockToken = "mock-stream-token";

      (streamVideo.upsertUsers as Mock).mockResolvedValue(undefined);
      (streamVideo.generateUserToken as Mock).mockReturnValue(mockToken);

      const result = await StreamService.generateStreamToken(mockUser);

      expect(streamVideo.upsertUsers).toHaveBeenCalledWith([
        {
          id: mockUser.id,
          name: mockUser.name,
          role: "admin",
          image: mockUser.image,
        },
      ]);

      expect(streamVideo.generateUserToken).toHaveBeenCalledWith({
        user_id: mockUser.id,
        iat: Math.floor(Date.now() / 1000) - 3 * 60,
        exp: Math.floor(Date.now() / 1000) + 60 * 60,
      });

      expect(result).toBe(mockToken);
    });

    it("should generate stream token with generated avatar when no image provided", async () => {
      const mockUser = {
        id: "user-123",
        name: "John Doe",
        image: null,
      };
      const mockToken = "mock-stream-token";
      const mockAvatarUri = "mock-avatar-uri";

      (generateAvatarUri as Mock).mockReturnValue(mockAvatarUri);
      (streamVideo.upsertUsers as Mock).mockResolvedValue(undefined);
      (streamVideo.generateUserToken as Mock).mockReturnValue(mockToken);

      const result = await StreamService.generateStreamToken(mockUser);

      expect(generateAvatarUri).toHaveBeenCalledWith({
        seed: mockUser.id,
        variant: "initials",
      });

      expect(streamVideo.upsertUsers).toHaveBeenCalledWith([
        {
          id: mockUser.id,
          name: mockUser.name,
          role: "admin",
          image: mockAvatarUri,
        },
      ]);

      expect(result).toBe(mockToken);
    });
  });

  describe("createVideoCall", () => {
    it("should create video call with proper configuration", async () => {
      const callId = "call-123";
      const createdByUserId = "user-123";
      const meetingData = {
        meetingId: "meeting-123",
        meetingName: "Test Meeting",
      };

      const mockCall = {
        create: vi.fn().mockResolvedValue(undefined),
      };

      (streamVideo.video.call as Mock).mockReturnValue(mockCall);

      await StreamService.createVideoCall(callId, createdByUserId, meetingData);

      expect(streamVideo.video.call).toHaveBeenCalledWith("default", callId);
      expect(mockCall.create).toHaveBeenCalledWith({
        data: {
          created_by_id: createdByUserId,
          custom: {
            meetingId: meetingData.meetingId,
            meetingName: meetingData.meetingName,
          },
          settings_override: {
            transcription: {
              language: "en",
              mode: "auto-on",
              closed_caption_mode: "auto-on",
            },
            recording: {
              mode: "auto-on",
              quality: "1080p",
            },
          },
        },
      });
    });
  });

  describe("upsertAgentUser", () => {
    it("should upsert agent user with generated avatar", async () => {
      const agent = {
        id: "agent-123",
        name: "Test Agent",
      };
      const mockAvatarUri = "mock-agent-avatar";

      (generateAvatarUri as Mock).mockReturnValue(mockAvatarUri);
      (streamVideo.upsertUsers as Mock).mockResolvedValue(undefined);

      await StreamService.upsertAgentUser(agent);

      expect(generateAvatarUri).toHaveBeenCalledWith({
        seed: agent.name,
        variant: "bottts-neutral",
      });

      expect(streamVideo.upsertUsers).toHaveBeenCalledWith([
        {
          id: agent.id,
          name: agent.name,
          role: "user",
          image: mockAvatarUri,
        },
      ]);
    });
  });

  describe("getTranscriptWithSpeakers", () => {
    it("should fetch and parse transcript with speaker images", async () => {
      const transcriptUrl = "https://example.com/transcript";
      const mockTranscriptText =
        '{"speaker_id":"user-1","type":"speech","text":"Hello","start_ts":1000,"stop_ts":2000}\n{"speaker_id":"agent-1","type":"speech","text":"Hi","start_ts":3000,"stop_ts":4000}';
      const mockTranscript = [
        {
          speaker_id: "user-1",
          type: "speech",
          text: "Hello",
          start_ts: 1000,
          stop_ts: 2000,
        },
        {
          speaker_id: "agent-1",
          type: "speech",
          text: "Hi",
          start_ts: 3000,
          stop_ts: 4000,
        },
      ];
      const mockEnrichedTranscript = [
        {
          speaker_id: "user-1",
          type: "speech",
          text: "Hello",
          start_ts: 1000,
          stop_ts: 2000,
          user: { name: "John", image: "avatar1.jpg" },
        },
        {
          speaker_id: "agent-1",
          type: "speech",
          text: "Hi",
          start_ts: 3000,
          stop_ts: 4000,
          user: { name: "Agent", image: "avatar2.jpg" },
        },
      ];

      (global.fetch as Mock).mockResolvedValue({
        text: () => Promise.resolve(mockTranscriptText),
      });
      (JSONL.parse as Mock).mockReturnValue(mockTranscript);

      vi.spyOn(StreamService, "enrichTranscriptWithImages").mockResolvedValue(
        mockEnrichedTranscript,
      );

      const result =
        await StreamService.getTranscriptWithSpeakers(transcriptUrl);

      expect(global.fetch).toHaveBeenCalledWith(transcriptUrl);
      expect(JSONL.parse).toHaveBeenCalledWith(mockTranscriptText);
      expect(StreamService.enrichTranscriptWithImages).toHaveBeenCalledWith(
        mockTranscript,
      );
      expect(result).toEqual(mockEnrichedTranscript);
    });

    it("should return empty array when fetch fails", async () => {
      const transcriptUrl = "https://example.com/transcript";

      (global.fetch as Mock).mockRejectedValue(new Error("Fetch failed"));

      vi.spyOn(StreamService, "enrichTranscriptWithImages").mockResolvedValue(
        [],
      );

      const result =
        await StreamService.getTranscriptWithSpeakers(transcriptUrl);

      expect(result).toEqual([]);
    });
  });

  describe("enrichTranscriptWithNames", () => {
    it("should return empty array for empty transcript", async () => {
      const result = await StreamService.enrichTranscriptWithNames([]);
      expect(result).toEqual([]);
    });

    it("should enrich transcript items with speaker names", async () => {
      const mockTranscript = [
        {
          speaker_id: "user-1",
          type: "speech",
          text: "Hello",
          start_ts: 1000,
          stop_ts: 2000,
        },
        {
          speaker_id: "unknown-user",
          type: "speech",
          text: "Mystery",
          start_ts: 3000,
          stop_ts: 4000,
        },
      ];
      const mockSpeakers = [
        {
          id: "user-1",
          name: "John",
          type: "user" as const,
          email: "john@email.com",
          emailVerified: false,
          image: "john.jpg",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.spyOn(StreamService, "getSpeakersByIds").mockResolvedValue(
        mockSpeakers,
      );

      const result =
        await StreamService.enrichTranscriptWithNames(mockTranscript);

      expect(result).toEqual([
        {
          speaker_id: "user-1",
          type: "speech",
          text: "Hello",
          start_ts: 1000,
          stop_ts: 2000,
          user: { name: "John" },
        },
        {
          speaker_id: "unknown-user",
          type: "speech",
          text: "Mystery",
          start_ts: 3000,
          stop_ts: 4000,
          user: { name: "Unknown" },
        },
      ]);
    });
  });

  describe("enrichTranscriptWithImages", () => {
    it("should return empty array for empty transcript", async () => {
      const result = await StreamService.enrichTranscriptWithImages([]);
      expect(result).toEqual([]);
    });

    it("should enrich transcript items with speaker names and images", async () => {
      const mockTranscript = [
        {
          speaker_id: "user-1",
          type: "speech",
          text: "Hello",
          start_ts: 1000,
          stop_ts: 2000,
        },
        {
          speaker_id: "agent-1",
          type: "speech",
          text: "Hi",
          start_ts: 3000,
          stop_ts: 4000,
        },
        {
          speaker_id: "unknown-user",
          type: "speech",
          text: "Mystery",
          start_ts: 5000,
          stop_ts: 6000,
        },
      ];

      const mockSpeakers = [
        {
          type: "user" as const,
          id: "user-1",
          name: "John",
          email: "john@email.com",
          emailVerified: false,
          image: "john.jpg",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          type: "agent" as const,
          id: "agent-1",
          name: "Agent",
          userId: "user-1",
          instructions: "Test instructions",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.spyOn(StreamService, "getSpeakersByIds").mockResolvedValue(
        mockSpeakers,
      );

      const mockAvatarUri = "generated-avatar.jpg";
      (generateAvatarUri as Mock).mockReturnValue(mockAvatarUri);

      const result =
        await StreamService.enrichTranscriptWithImages(mockTranscript);

      expect(result).toEqual([
        {
          speaker_id: "user-1",
          type: "speech",
          text: "Hello",
          start_ts: 1000,
          stop_ts: 2000,
          user: { name: "John", image: "john.jpg" },
        },
        {
          speaker_id: "agent-1",
          type: "speech",
          text: "Hi",
          start_ts: 3000,
          stop_ts: 4000,
          user: { name: "Agent", image: mockAvatarUri },
        },
        {
          speaker_id: "unknown-user",
          type: "speech",
          text: "Mystery",
          start_ts: 5000,
          stop_ts: 6000,
          user: { name: "Unknown", image: mockAvatarUri },
        },
      ]);
    });
  });

  describe("connectOpenAiToCall", () => {
    it("should connect OpenAI to call and update session", async () => {
      const meetingId = "meeting-123";
      const agentUserId = "agent-123";
      const instructions = "Test instructions";

      const mockCall = {};
      const mockRealtimeClient = {
        updateSession: vi.fn(),
      };

      (streamVideo.video.call as Mock).mockReturnValue(mockCall);
      (streamVideo.video.connectOpenAi as Mock).mockResolvedValue(
        mockRealtimeClient,
      );

      const result = await StreamService.connectOpenAiToCall(
        meetingId,
        agentUserId,
        instructions,
      );

      expect(streamVideo.video.call).toHaveBeenCalledWith("default", meetingId);
      expect(streamVideo.video.connectOpenAi).toHaveBeenCalledWith({
        call: mockCall,
        openAiApiKey: process.env.OPENAI_API_KEY,
        agentUserId,
      });
      expect(mockRealtimeClient.updateSession).toHaveBeenCalledWith({
        instructions,
      });
      expect(result).toBe(mockRealtimeClient);
    });
  });

  describe("endCall", () => {
    it("should end the call", async () => {
      const meetingId = "meeting-123";
      const mockCall = {
        end: vi.fn().mockResolvedValue(undefined),
      };

      (streamVideo.video.call as Mock).mockReturnValue(mockCall);

      await StreamService.endCall(meetingId);

      expect(streamVideo.video.call).toHaveBeenCalledWith("default", meetingId);
      expect(mockCall.end).toHaveBeenCalled();
    });
  });

  describe("getChannelMessages", () => {
    it("should get channel messages with default limit", async () => {
      const channelId = "channel-123";
      const mockMessages = [
        { text: "Hello" },
        { text: "World" },
        { text: "" }, // Should be filtered out
        { text: "  " }, // Should be filtered out
        { text: "Valid message" },
      ];

      const mockChannel = {
        watch: vi.fn().mockResolvedValue(undefined),
        state: {
          messages: mockMessages,
        },
      };

      (streamChat.channel as Mock).mockReturnValue(mockChannel);

      const result = await StreamService.getChannelMessages(channelId);

      expect(streamChat.channel).toHaveBeenCalledWith("messaging", channelId);
      expect(mockChannel.watch).toHaveBeenCalled();
      expect(result).toEqual([
        { text: "Hello" },
        { text: "World" },
        { text: "Valid message" },
      ]);
    });

    it("should get channel messages with custom limit", async () => {
      const channelId = "channel-123";
      const limit = 10;
      const mockMessages = Array.from({ length: 15 }, (_, i) => ({
        text: `Message ${i}`,
      }));

      const mockChannel = {
        watch: vi.fn().mockResolvedValue(undefined),
        state: {
          messages: mockMessages,
        },
      };

      (streamChat.channel as Mock).mockReturnValue(mockChannel);

      const result = await StreamService.getChannelMessages(channelId, limit);

      expect(result).toHaveLength(10);
      expect(result[0]).toEqual({ text: "Message 5" }); // Last 10 messages
    });
  });

  describe("sendAgentMessage", () => {
    it("should send agent message with generated avatar", async () => {
      const channelId = "channel-123";
      const agentId = "agent-123";
      const agentName = "Test Agent";
      const message = "Hello from agent";
      const mockAvatarUrl = "agent-avatar.jpg";

      const mockChannel = {
        sendMessage: vi.fn().mockResolvedValue(undefined),
      };

      (generateAvatarUri as Mock).mockReturnValue(mockAvatarUrl);
      (streamChat.upsertUser as Mock).mockResolvedValue(undefined);
      (streamChat.channel as Mock).mockReturnValue(mockChannel);

      await StreamService.sendAgentMessage(
        channelId,
        agentId,
        agentName,
        message,
      );

      expect(generateAvatarUri).toHaveBeenCalledWith({
        seed: agentName,
        variant: "bottts-neutral",
      });

      expect(streamChat.upsertUser).toHaveBeenCalledWith({
        id: agentId,
        name: agentName,
        image: mockAvatarUrl,
      });

      expect(streamChat.channel).toHaveBeenCalledWith("messaging", channelId);
      expect(mockChannel.sendMessage).toHaveBeenCalledWith({
        text: message,
        user: {
          id: agentId,
          name: agentName,
          image: mockAvatarUrl,
        },
      });
    });
  });

  describe("fetchAndParseTranscript", () => {
    it("should fetch and parse transcript", async () => {
      const transcriptUrl = "https://example.com/transcript";
      const mockTranscriptText =
        '{"speaker_id":"user-1","type":"speech","text":"Hello","start_ts":1000,"stop_ts":2000}\n{"speaker_id":"user-2","type":"speech","text":"World","start_ts":3000,"stop_ts":4000}';
      const mockParsedTranscript = [
        {
          speaker_id: "user-1",
          type: "speech",
          text: "Hello",
          start_ts: 1000,
          stop_ts: 2000,
        },
        {
          speaker_id: "user-2",
          type: "speech",
          text: "World",
          start_ts: 3000,
          stop_ts: 4000,
        },
      ];

      (global.fetch as Mock).mockResolvedValue({
        text: () => Promise.resolve(mockTranscriptText),
      });
      (JSONL.parse as Mock).mockReturnValue(mockParsedTranscript);

      const result = await StreamService.fetchAndParseTranscript(transcriptUrl);

      expect(global.fetch).toHaveBeenCalledWith(transcriptUrl);
      expect(JSONL.parse).toHaveBeenCalledWith(mockTranscriptText);
      expect(result).toEqual(mockParsedTranscript);
    });
  });
});
