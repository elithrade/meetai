"use client";

import { Button } from "@/components/ui/button";
import { PlusIcon, XCircleIcon } from "lucide-react";
import { NewAgentDialog } from "./new-agent-dialog";
import { useState } from "react";
import { SearchFilter } from "./agents-search-filters";
import { useAgentsFilters } from "../../hooks/use-agents-filters";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export const AgentsListHeader = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filters, setFilters] = useAgentsFilters();

  const filterApplied = !!filters.search;

  const onClearFilters = () => {
    setFilters({ search: "" });
  };

  return (
    <>
      <NewAgentDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <div className="py-4 px-4 md:px-8 flex flex-col gap-y-4">
        <div className="flex items-center justify-between">
          <h5 className="font-medium text-xl">My Agents</h5>
          <Button onClick={() => setDialogOpen(true)}>
            <PlusIcon />
            New Agent
          </Button>
        </div>
        <ScrollArea>
          <div className="flex items-center gap-x-2 p-1">
            <SearchFilter />
            {filterApplied && (
              <Button variant="outline" size="sm" onClick={onClearFilters}>
                <XCircleIcon />
                Clear
              </Button>
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </>
  );
};
