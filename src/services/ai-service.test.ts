import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AIService } from "./ai-service";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions/index.mjs";
import { LocalMessage } from "stream-chat";

// The vi.mock() call executes immediately when the module
// is loaded, but the const mockChatCompletionsCreate = vi.fn()
// hasn't been initialized yet, even though it appears first in your code.
const mockChatCompletionsCreate = vi.hoisted(() => vi.fn());

// Mock the entire OpenAI module
vi.mock("openai", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockChatCompletionsCreate,
        },
      },
    })),
  };
});

describe("AIService", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockChatCompletionsCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: "default test response",
          },
        },
      ],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("generateMeetingFollowupResponse", () => {
    it("should generate a followup response with meeting summary and conversation history", async () => {
      const meetingSummary =
        "Meeting discussed project timeline and budget allocation.";
      const agentInstructions = "Be helpful and professional.";
      const conversationHistory: ChatCompletionMessageParam[] = [
        { role: "user", content: "What was the main topic?" },
        { role: "assistant", content: "The main topic was project planning." },
      ];
      const userMessage = "Can you clarify the timeline?";
      const expectedResponse =
        "The timeline discussed was 6 months for phase 1.";

      mockChatCompletionsCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: expectedResponse,
            },
          },
        ],
      });

      const result = await AIService.generateMeetingFollowupResponse(
        meetingSummary,
        agentInstructions,
        conversationHistory,
        userMessage,
      );

      expect(mockChatCompletionsCreate).toHaveBeenCalledWith({
        messages: [
          {
            role: "system",
            content: expect.stringContaining(
              "You are an AI assistant helping the user revisit a recently completed meeting.",
            ),
          },
          ...conversationHistory,
          { role: "user", content: userMessage },
        ],
        model: "gpt-4o",
      });

      expect(result).toBe(expectedResponse);
    });

    it("should include meeting summary in system instructions", async () => {
      const meetingSummary =
        "Discussed quarterly sales targets and marketing strategies.";
      const agentInstructions = "Be concise and data-driven.";
      const conversationHistory: ChatCompletionMessageParam[] = [];
      const userMessage = "What were the key decisions?";

      mockChatCompletionsCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content:
                "Key decisions included increasing marketing budget by 20%.",
            },
          },
        ],
      });

      await AIService.generateMeetingFollowupResponse(
        meetingSummary,
        agentInstructions,
        conversationHistory,
        userMessage,
      );

      const systemMessage =
        mockChatCompletionsCreate.mock.calls[0][0].messages[0];

      expect(systemMessage.role).toBe("system");
      expect(systemMessage.content).toContain(meetingSummary);
      expect(systemMessage.content).toContain(agentInstructions);
    });

    it("should include agent instructions in system message", async () => {
      const meetingSummary = "Brief meeting summary.";
      const agentInstructions =
        "Always be encouraging and positive in your responses.";
      const conversationHistory: ChatCompletionMessageParam[] = [];
      const userMessage = "How did the meeting go?";

      mockChatCompletionsCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: "The meeting went very well!",
            },
          },
        ],
      });

      await AIService.generateMeetingFollowupResponse(
        meetingSummary,
        agentInstructions,
        conversationHistory,
        userMessage,
      );

      const systemMessage =
        mockChatCompletionsCreate.mock.calls[0][0].messages[0];

      expect(systemMessage.content).toContain(agentInstructions);
    });

    it("should handle empty conversation history", async () => {
      const meetingSummary = "Meeting about new product launch.";
      const agentInstructions = "Be detailed and informative.";
      const conversationHistory: ChatCompletionMessageParam[] = [];
      const userMessage = "What was discussed?";

      mockChatCompletionsCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: "The meeting discussed the new product launch timeline.",
            },
          },
        ],
      });

      await AIService.generateMeetingFollowupResponse(
        meetingSummary,
        agentInstructions,
        conversationHistory,
        userMessage,
      );

      expect(mockChatCompletionsCreate).toHaveBeenCalledWith({
        messages: [
          {
            role: "system",
            content: expect.any(String),
          },
          { role: "user", content: userMessage },
        ],
        model: "gpt-4o",
      });
    });

    it("should return null when no response content is available", async () => {
      const meetingSummary = "Meeting summary.";
      const agentInstructions = "Be helpful.";
      const conversationHistory: ChatCompletionMessageParam[] = [];
      const userMessage = "What happened?";

      mockChatCompletionsCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: null,
            },
          },
        ],
      });

      const result = await AIService.generateMeetingFollowupResponse(
        meetingSummary,
        agentInstructions,
        conversationHistory,
        userMessage,
      );

      expect(result).toBeNull();
    });

    it("should return null when no choices are available", async () => {
      const meetingSummary = "Meeting summary.";
      const agentInstructions = "Be helpful.";
      const conversationHistory: ChatCompletionMessageParam[] = [];
      const userMessage = "What happened?";

      mockChatCompletionsCreate.mockResolvedValue({
        choices: [],
      });

      const result = await AIService.generateMeetingFollowupResponse(
        meetingSummary,
        agentInstructions,
        conversationHistory,
        userMessage,
      );

      expect(result).toBeNull();
    });

    it("should use gpt-4o model", async () => {
      const meetingSummary = "Meeting summary.";
      const agentInstructions = "Be helpful.";
      const conversationHistory: ChatCompletionMessageParam[] = [];
      const userMessage = "What happened?";

      mockChatCompletionsCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: "Response content",
            },
          },
        ],
      });

      await AIService.generateMeetingFollowupResponse(
        meetingSummary,
        agentInstructions,
        conversationHistory,
        userMessage,
      );

      expect(mockChatCompletionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "gpt-4o",
        }),
      );
    });
  });

  describe("convertChatMessagesToOpenAI", () => {
    it("should convert user messages correctly", () => {
      const agentId = "agent-123";
      const messages: LocalMessage[] = [
        {
          id: "msg-1",
          text: "Hello there!",
          user: { id: "user-456", name: "John Doe" },
        } as LocalMessage,
        {
          id: "msg-2",
          text: "How can I help you?",
          user: { id: "user-789", name: "Jane Smith" },
        } as LocalMessage,
      ];

      const result = AIService.convertChatMessagesToOpenAI(messages, agentId);

      expect(result).toEqual([
        {
          role: "user",
          content: "Hello there!",
        },
        {
          role: "user",
          content: "How can I help you?",
        },
      ]);
    });

    it("should convert agent messages to assistant role", () => {
      const agentId = "agent-123";
      const messages: LocalMessage[] = [
        {
          id: "msg-1",
          text: "Hello! How can I help?",
          user: { id: "agent-123", name: "AI Assistant" },
        } as LocalMessage,
        {
          id: "msg-2",
          text: "Thank you for your question.",
          user: { id: "agent-123", name: "AI Assistant" },
        } as LocalMessage,
      ];

      const result = AIService.convertChatMessagesToOpenAI(messages, agentId);

      expect(result).toEqual([
        {
          role: "assistant",
          content: "Hello! How can I help?",
        },
        {
          role: "assistant",
          content: "Thank you for your question.",
        },
      ]);
    });

    it("should handle mixed user and agent messages", () => {
      const agentId = "agent-123";
      const messages: LocalMessage[] = [
        {
          id: "msg-1",
          text: "Hi there!",
          user: { id: "user-456", name: "John" },
        } as LocalMessage,
        {
          id: "msg-2",
          text: "Hello! How can I help you?",
          user: { id: "agent-123", name: "AI Assistant" },
        } as LocalMessage,
        {
          id: "msg-3",
          text: "I need help with my project.",
          user: { id: "user-456", name: "John" },
        } as LocalMessage,
        {
          id: "msg-4",
          text: "I'd be happy to help with that!",
          user: { id: "agent-123", name: "AI Assistant" },
        } as LocalMessage,
      ];

      const result = AIService.convertChatMessagesToOpenAI(messages, agentId);

      expect(result).toEqual([
        {
          role: "user",
          content: "Hi there!",
        },
        {
          role: "assistant",
          content: "Hello! How can I help you?",
        },
        {
          role: "user",
          content: "I need help with my project.",
        },
        {
          role: "assistant",
          content: "I'd be happy to help with that!",
        },
      ]);
    });

    it("should handle empty messages array", () => {
      const agentId = "agent-123";
      const messages: LocalMessage[] = [];

      const result = AIService.convertChatMessagesToOpenAI(messages, agentId);

      expect(result).toEqual([]);
    });

    it("should handle messages without user information", () => {
      const agentId = "agent-123";
      const messages = [
        {
          id: "msg-1",
          text: "Message without user",
          user: undefined,
        },
      ] as LocalMessage[];

      const result = AIService.convertChatMessagesToOpenAI(messages, agentId);

      expect(result).toEqual([
        {
          role: "user", // Should default to user when no user info
          content: "Message without user",
        },
      ]);
    });
  });
});
