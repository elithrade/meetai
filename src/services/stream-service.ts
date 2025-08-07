import { db } from "@/db";
import { agents, user } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { streamVideo } from "@/lib/stream-video";
import { streamChat } from "@/lib/stream-chat";
import { generateAvatarUri } from "@/lib/avatar";
import JSONL from "jsonl-parse-stringify";
import { StreamTranscriptItem } from "@/modules/meetings/types";

export class StreamService {
  static async generateChatToken(userId: string): Promise<string> {
    const token = streamChat.createToken(userId);
    await streamChat.upsertUser({
      id: userId,
      role: "admin",
    });
    return token;
  }

  static async generateStreamToken(user: {
    id: string;
    name: string;
    image?: string | null;
  }): Promise<string> {
    await streamVideo.upsertUsers([
      {
        id: user.id,
        name: user.name,
        role: "admin",
        image:
          user.image ??
          generateAvatarUri({ seed: user.id, variant: "initials" }),
      },
    ]);

    const issuedAt = Math.floor(Date.now() / 1000) - 60; // 1 minute ago
    const expirationTime = Math.floor(Date.now() / 1000) + 60 * 60; // 1 hour from now

    const token = streamVideo.generateUserToken({
      user_id: user.id,
      iat: issuedAt,
      exp: expirationTime,
    });

    return token;
  }

  static async createVideoCall(
    callId: string,
    createdByUserId: string,
    meetingData: {
      meetingId: string;
      meetingName: string;
    },
  ): Promise<void> {
    const call = streamVideo.video.call("default", callId);
    await call.create({
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
  }

  static async upsertAgentUser(agent: {
    id: string;
    name: string;
  }): Promise<void> {
    await streamVideo.upsertUsers([
      {
        id: agent.id,
        name: agent.name,
        role: "user",
        image: generateAvatarUri({
          seed: agent.name,
          variant: "bottts-neutral",
        }),
      },
    ]);
  }

  static async getTranscriptWithSpeakers(
    transcriptUrl: string,
  ): Promise<
    Array<StreamTranscriptItem & { user: { name: string; image: string } }>
  > {
    // Fetch and parse transcript
    const transcript = await fetch(transcriptUrl)
      .then((res) => res.text())
      .then((text) => JSONL.parse<StreamTranscriptItem>(text))
      .catch(() => {
        return [];
      });

    if (transcript.length === 0) {
      return [];
    }

    const speakerIds = [...new Set(transcript.map((item) => item.speaker_id))];

    // Get user speakers
    const userSpeakers = await db
      .select()
      .from(user)
      .where(inArray(user.id, speakerIds))
      .then((users) =>
        users.map((user) => ({
          ...user,
          image:
            user.image ??
            generateAvatarUri({ seed: user.name, variant: "initials" }),
        })),
      );

    // Get agent speakers
    const agentSpeakers = await db
      .select()
      .from(agents)
      .where(inArray(agents.id, speakerIds))
      .then((agents) =>
        agents.map((agent) => ({
          ...agent,
          image: generateAvatarUri({
            seed: agent.name,
            variant: "bottts-neutral",
          }),
        })),
      );

    const speakers = [...userSpeakers, ...agentSpeakers];

    // Map transcript items with speaker information
    const transcriptWithSpeakers = transcript.map((item) => {
      const speaker = speakers.find(
        (speaker) => speaker.id === item.speaker_id,
      );

      if (!speaker) {
        return {
          ...item,
          user: {
            name: "Unknown",
            image: generateAvatarUri({
              seed: "unknown",
              variant: "initials",
            }),
          },
        };
      }

      return {
        ...item,
        user: {
          name: speaker.name,
          image: speaker.image,
        },
      };
    });

    return transcriptWithSpeakers;
  }
}
