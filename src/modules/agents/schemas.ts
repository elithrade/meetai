import { z } from "zod";

// TODO: Replace with AgentInsert type from db/agents.types.ts
export const agentInsertSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  instructions: z.string().min(1, { message: "Instructions are required" }),
});

// TODO: Replace with AgentUpdate type from db/agents.types.ts
export const agentUpdateSchema = agentInsertSchema.extend({
  id: z.string().min(1, { message: "Agent id is required" }),
});
