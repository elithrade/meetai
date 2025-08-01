import {
  CircleXIcon,
  CircleCheckIcon,
  ClockArrowUpIcon,
  VideoIcon,
  LoaderIcon,
} from "lucide-react";

import { CommandSelect } from "@/components/command-select";
import { useMeetingsFilters } from "@/modules/meetings/hooks/use-meetings-filters";
import { ReactNode } from "react";
import { MeetingStatus } from "../../types";

const getOption = (status: MeetingStatus, icon: ReactNode) => {
  return {
    id: status,
    value: status,
    children: (
      <div className="flex items-center gap-x-2 capitalize">
        {icon}
        {status}
      </div>
    ),
  };
};

const options = [
  getOption(MeetingStatus.Upcoming, <ClockArrowUpIcon />),
  getOption(MeetingStatus.Active, <VideoIcon />),
  getOption(MeetingStatus.Processing, <LoaderIcon />),
  getOption(MeetingStatus.Cancelled, <CircleXIcon />),
  getOption(MeetingStatus.Completed, <CircleCheckIcon />),
];

export const StatusFilter = () => {
  const [filters, setFilters] = useMeetingsFilters();
  return (
    <CommandSelect
      placeholder="Filter by status"
      className="h-9"
      options={options}
      onSelect={(value) => {
        setFilters({ status: value as MeetingStatus });
      }}
      value={filters.status ?? ""}
    />
  );
};
