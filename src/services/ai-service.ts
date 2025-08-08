import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions/index.mjs";
import { LocalMessage } from "stream-chat";

const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class AIService {
  static async generateMeetingFollowupResponse(
    meetingSummary: string,
    agentInstructions: string,
    conversationHistory: ChatCompletionMessageParam[],
    userMessage: string,
  ): Promise<string | null> {
    const instructions = `
      You are an AI assistant helping the user revisit a recently completed meeting.
      Below is a summary of the meeting, generated from the transcript:

      ${meetingSummary}

      The following are your original instructions from the live meeting assistant. Please continue to follow these behavioral guidelines as you assist the user:

      ${agentInstructions}

      The user may ask questions about the meeting, request clarifications, or ask for follow-up actions.
      Always base your responses on the meeting summary above.

      You also have access to the recent conversation history between you and the user. Use the context of previous messages to provide relevant, coherent, and helpful responses. If the user's question refers to something discussed earlier, make sure to take that into account and maintain continuity in the conversation.

      If the summary does not contain enough information to answer a question, politely let the user know.

      Be concise, helpful, and focus on providing accurate information from the meeting and the ongoing conversation.
    `;

    const response = await openaiClient.chat.completions.create({
      messages: [
        { role: "system", content: instructions },
        ...conversationHistory,
        { role: "user", content: userMessage },
      ],
      model: "gpt-4o",
    });

    return response.choices[0]?.message?.content || null;
  }

  static convertChatMessagesToOpenAI(
    messages: LocalMessage[],
    agentId: string,
  ): ChatCompletionMessageParam[] {
    return messages.map((m) => {
      const isAssistant = m.user?.id === agentId;
      return {
        role: isAssistant ? "assistant" : "user",
        content: m.text!,
      };
    });
  }
}
