import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { CommandSelect } from "@/components/command-select";
import { useMeetingsFilters } from "@/modules/meetings/hooks/use-meetings-filters";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { useTRPC } from "@/trpc/client";

export const AgentIdFilter = () => {
  const [filters, setFilters] = useMeetingsFilters();

  const trpc = useTRPC();

  const [agentSearch, setAgentSearch] = useState("");
  const { data } = useQuery(
    trpc.agents.getMany.queryOptions({ pageSize: 100, search: agentSearch }),
  );

  return (
    <CommandSelect
      className="h-9"
      placeholder="Filter by agent"
      options={(data?.items ?? []).map((agent) => ({
        id: agent.id,
        value: agent.id,
        children: (
          <div className="flex items-center gap-x-2">
            <GeneratedAvatar
              className="size-4"
              seed={agent.name}
              variant="botttsNeutral"
            />
            {agent.name}
          </div>
        ),
      }))}
      onSelect={(value) => setFilters({ agentId: value })}
      onSearch={setAgentSearch}
      value={filters.agentId ?? ""}
    />
  );
};
