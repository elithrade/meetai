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
        {JSON.stringify(data, null, 2)}
      </div>
    </>
  );
};
