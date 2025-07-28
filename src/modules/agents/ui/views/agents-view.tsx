"use client";

import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { DataTable } from "../components/data-table";
import { columns } from "../components/columns";
import { EmptyState } from "@/components/empty-state";
import { useAgentsFilters } from "../../hooks/use-agents-filters";

export const AgentsView = () => {
  const trpc = useTRPC();
  const [filters] = useAgentsFilters();
  const { data } = useSuspenseQuery(
    trpc.agents.getMany.queryOptions({ ...filters }),
  );

  return (
    <div className="flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-4">
      {data.items.length > 0 ? (
        <DataTable data={data.items} columns={columns} />
      ) : (
        <EmptyState
          title="Create your first agent"
          description="Create an agent to join your meetings. Each agent will follow your instructions and can interact with participants during the call."
        />
      )}
    </div>
  );
};
