import { ResponsiveDialog } from "@/components/responsive-dialog";
import { AgentForm } from "./agent-form";

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
      <AgentForm
        onSuccess={() => onOpenChange(false)}
        onCancel={() => onOpenChange(false)}
      />
    </ResponsiveDialog>
  );
};
