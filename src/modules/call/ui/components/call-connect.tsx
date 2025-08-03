import {
  Call,
  CallingState,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
} from "@stream-io/video-react-sdk";

import { LoaderIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import { CallUI } from "./call-ui";

type Props = {
  meetingId: string;
  meetingName: string;
  userId: string;
  userName: string;
  userAvatar: string;
};

export const CallConnect = ({
  meetingId,
  meetingName,
  userId,
  userName,
  userAvatar,
}: Props) => {
  const trpc = useTRPC();
  const { mutateAsync: generateToken } = useMutation(
    trpc.meetings.generateStreamToken.mutationOptions(),
  );

  const tokenProvider = useCallback(async () => {
    try {
      const token = await generateToken();
      return token;
    } catch (error) {
      console.error("Token generation failed:", error);
      throw error;
    }
  }, [generateToken]);

  const [client, setClient] = useState<StreamVideoClient | null>(null);
  useEffect(() => {
    const _client = new StreamVideoClient({
      apiKey: process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY!,
      user: {
        id: userId,
        name: userName,
        image: userAvatar,
      },
      tokenProvider,
    });

    setClient(_client);

    return () => {
      _client.disconnectUser();
      setClient(null);
    };
  }, [generateToken, tokenProvider, userAvatar, userId, userName]);

  const [call, setCall] = useState<Call | null>(null);
  useEffect(() => {
    if (!client) return;
    const _call = client.call("default", meetingId);
    _call.camera.disable();
    _call.microphone.disable();
    setCall(_call);

    return () => {
      if (_call.state.callingState !== CallingState.LEFT) {
        _call.leave();
        _call.endCall();
        setCall(null);
      }
    };
  }, [client, meetingId]);

  if (!client || !call) {
    return (
      <div className="flex h-screen items-center justify-center bg-radial from-sidebar-accent to-sidebar">
        <LoaderIcon className="size-6 animate-spin text-white" />
      </div>
    );
  }

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <CallUI meetingName={meetingName} />
      </StreamCall>
    </StreamVideo>
  );
};
