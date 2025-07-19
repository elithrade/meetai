import {
  CommandDialog,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dispatch } from "react";

type Props = {
  open: boolean;
  setOpen: Dispatch<React.SetStateAction<boolean>>;
};

export const DashboardCommand = ({ open, setOpen }: Props) => {
  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Find a meeting or agent" />
      <CommandList>
        <CommandItem></CommandItem>
      </CommandList>
    </CommandDialog>
  );
};
