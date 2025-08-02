"use client";

import { useTRPC } from "@/trpc/client";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { MeetingIdViewHeader } from "../components/meeting-id-view-header";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useConfirm } from "../../hooks/use-confirm";
import { UpdateMeetingDialog } from "../components/update-meeting-dialog";
import { useState } from "react";
import { UpcomingState } from "../components/upcoming-state";
import { ActiveState } from "../components/active-state";
import { CancelledState } from "../components/cancelled-state";
import { ProcessingState } from "../components/processing-state";

type Prosp = {
  meetingId: string;
};

export const MeetingIdView = ({ meetingId }: Prosp) => {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.meetings.getOne.queryOptions({ id: meetingId }),
  );

  const router = useRouter();
  const queryClient = useQueryClient();

  const [openUpdateMeetingDialog, setOpenUpdateMeetingDialog] = useState(false);

  const removeMeeting = useMutation(
    trpc.meetings.remove.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.meetings.getMany.queryOptions({}));
        // TODO: Invalidate free tier usage
        router.push("/meetings");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const [RemoveMeetingDialog, confirmRemoveMeeting] = useConfirm(
    "Are you sure?",
    `The following action will remove this meeting`,
  );

  const handleRemoveMeeting = async () => {
    const ok = await confirmRemoveMeeting();
    if (!ok) {
      return;
    }

    await removeMeeting.mutateAsync({ id: meetingId });
  };

  const isActive = data.status === "active";
  const isUpcoming = data.status === "upcoming";
  const isCancelled = data.status === "cancelled";
  const isCompleted = data.status === "completed";
  const isProcesssing = data.status === "processing";

  return (
    <>
      <RemoveMeetingDialog />
      <UpdateMeetingDialog
        open={openUpdateMeetingDialog}
        onOpenChange={setOpenUpdateMeetingDialog}
        initialValues={data}
      />
      <div className="flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-4">
        <MeetingIdViewHeader
          meetingId={meetingId}
          meetingName={data.name}
          onEdit={() => {
            setOpenUpdateMeetingDialog(true);
          }}
          onRemove={handleRemoveMeeting}
        />
        {isCancelled && <CancelledState />}
        {isProcesssing && <ProcessingState />}
        {isCompleted && <div>completed</div>}
        {isActive && <ActiveState meetingId={meetingId} />}
        {isUpcoming && (
          <UpcomingState
            meetingId={meetingId}
            onCancelMeeting={() => {}}
            isCancelling={false}
          />
        )}
      </div>
    </>
  );
};
