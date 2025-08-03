"use client";

import { ErrorState } from "@/components/error-state";
import { MeetingStatus } from "@/modules/meetings/types";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CallProvider } from "../components/call-provider";

type Props = {
  meetingId: string;
};
export const CallView = ({ meetingId }: Props) => {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.meetings.getOne.queryOptions({ id: meetingId }),
  );

  if (data.status === MeetingStatus.Completed) {
    return (
      <div className="flex h-screen items-center justify-center">
        <ErrorState
          title="Meeting ended"
          description="This meeting has already ended."
        />
      </div>
    );
  }

  return <CallProvider meetingId={meetingId} meetingName={data.name} />;
};
