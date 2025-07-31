import { ReactNode, useState } from "react";
import { Button } from "./ui/button";
import { ChevronsUpDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";

type Props = {
  options: Array<{
    id: string;
    value: string;
    children: ReactNode;
  }>;
  onSelect: (value: string) => void;
  onSearch?: (value: string) => void;
  value: string;
  placeholder?: string;
  className?: string;
};

export const CommandSelect = ({
  options,
  onSelect,
  onSearch,
  value,
  placeholder,
  className,
}: Props) => {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        type="button"
        variant="outline"
        className={cn(
          "h-9 justify-between font-normal px-2",
          !selectedOption && "text-muted-foreground",
          className,
        )}
      >
        <div>{selectedOption ? selectedOption.children : placeholder}</div>
        <ChevronsUpDownIcon />
      </Button>
      <CommandDialog
        shouldFilter={!onSearch}
        open={open}
        onOpenChange={setOpen}
      >
        <CommandInput placeholder="Search..." onValueChange={onSearch} />
        <CommandList>
          <CommandEmpty>
            <span className="text-sm text-muted-foreground">
              No options found
            </span>
          </CommandEmpty>
          {options.map((option) => (
            <CommandItem
              key={option.id}
              onSelect={() => {
                onSelect(option.value);
                setOpen(false);
              }}
            >
              {option.children}
            </CommandItem>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
};
