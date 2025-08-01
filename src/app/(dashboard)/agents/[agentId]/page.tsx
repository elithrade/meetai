import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { AgentIdView } from "@/modules/agents/ui/views/agent-id-view";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

type Props = {
  params: Promise<{ agentId: string }>;
};

const Page = async ({ params }: Props) => {
  // TODO: Implement session checks.
  const { agentId } = await params;
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(
    trpc.agents.getOne.queryOptions({ id: agentId }),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense
        fallback={
          <LoadingState
            title="Loading agent"
            description="This can take a few seconds"
          ></LoadingState>
        }
      >
        <ErrorBoundary
          fallback={
            <ErrorState
              title="Error loading agent"
              description="Please try again later."
            />
          }
        >
          <AgentIdView agentId={agentId} />
        </ErrorBoundary>
      </Suspense>
    </HydrationBoundary>
  );
};

export default Page;
