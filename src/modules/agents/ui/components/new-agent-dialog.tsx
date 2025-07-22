import { ResponsiveDialog } from "@/components/responsive-dialog";

type NewAgentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const NewAgentDialog = ({ open, onOpenChange }: NewAgentDialogProps) => {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChangeAction={onOpenChange}
      title="New Agent"
      description="Create a new agent"
    >
      New agent form
    </ResponsiveDialog>
  );
};
