"use client";

import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";

export const AgentsView = () => {
  const trpc = useTRPC();
  const { data, isLoading, isError } = useQuery(
    trpc.agents.getMany.queryOptions(),
  );

  if (isLoading) {
    return (
      <LoadingState
        title="Loading agents"
        description="This may take a few seconds"
      />
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load agents"
        description="Something went wrong, please try again later"
      ></ErrorState>
    );
  }

  return <div>{JSON.stringify(data, null, 2)}</div>;
};
