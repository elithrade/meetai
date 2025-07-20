"use client";

import { authClient } from "@/lib/auth-client";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";

export const HomeView = () => {
  const { data: session } = authClient.useSession();
  const trpc = useTRPC();

  const { data } = useQuery(
    trpc.hello.queryOptions({ text: session?.user?.name || "Guest" }),
  );

  return <div className="p-4 flex flex-col gap-y-4">{data?.greeting}</div>;
};
