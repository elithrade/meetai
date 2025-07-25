"use client";

import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { DataTable } from "../components/data-table";
import { columns, Payment } from "../components/columns";

const mockData = [
  {
    id: "729ed5sf",
    amount: 100,
    status: "pending",
    email: "email@example.com",
  },
] satisfies Payment[];

export const AgentsView = () => {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.agents.getMany.queryOptions());

  return (
    <div>
      <DataTable data={mockData} columns={columns} />
    </div>
  );
};
