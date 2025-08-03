import { StreamTheme, useCall } from "@stream-io/video-react-sdk";
import { useState } from "react";
import { CallLobby } from "./call-lobby";
import { join } from "path";

type Pros = {
  meetingName: string;
};

export const CallUI = ({ meetingName }: Pros) => {
  const call = useCall();
  const [show, setShow] = useState<"lobby" | "call" | "ended">("lobby");

  const handleJoin = async () => {
    if (!call) return;
    await call.join();

    setShow("call");
  };

  const handleLeave = async () => {
    if (!call) return;
    await call.endCall();

    setShow("ended");
  };

  return (
    <StreamTheme className="h-full">
      {show === "lobby" && <CallLobby onJoin={join}></CallLobby>}
      {show === "call" && <p>Call</p>}
      {show === "ended" && <p>Ended</p>}
    </StreamTheme>
  );
};
