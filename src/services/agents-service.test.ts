import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { AgentsService } from "./agents-service";
import { db } from "@/db";

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    insert: vi.fn(),
    $count: vi.fn(),
  },
}));

vi.mock("@/db/schema", () => ({
  agents: {
    id: "id",
    userId: "user_id",
    createdAt: "created_at",
    name: "name",
  },
  meetings: {
    id: "id",
    userId: "user_id",
    createdAt: "created_at",
    name: "name",
    status: "status",
    agentId: "agent_id",
    startedAt: "started_at",
    endedAt: "ended_at",
  },
}));

describe("AgentsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getManyAgents", () => {
    it("should return paginated agents with total and totalPages", async () => {
      const mockData = [{ id: "a1", meetingCount: 6, name: "Agent 1" }];
      const mockCount = [{ count: 3 }];

      const whereMock = vi.fn().mockReturnThis();
      const orderByMock = vi.fn().mockReturnThis();
      const limitMock = vi.fn().mockReturnThis();
      const offsetMock = vi.fn().mockResolvedValue(mockData);

      (db.select as Mock)
        .mockReturnValueOnce({
          from: () => ({
            where: whereMock,
            orderBy: orderByMock,
            limit: limitMock,
            offset: offsetMock,
          }),
        })
        .mockReturnValueOnce({
          from: () => ({
            where: () => mockCount,
          }),
        });

      (db.$count as Mock).mockReturnValueOnce(mockCount[0].count);

      const result = await AgentsService.getManyAgents({
        userId: "u1",
        page: 1,
        pageSize: 10,
        search: "Agent",
      });

      expect(result.items).toEqual(mockData);
      expect(result.total).toBe(3);
      expect(result.totalPages).toBe(1);
    });
  });

  describe("getUserAgentById", () => {
    it("should return agent with meeting count", async () => {
      const mockAgent = { id: "a1", meetingCount: 5 };
      (db.select as Mock).mockReturnValueOnce({
        from: () => ({
          where: () => [mockAgent],
        }),
      });

      const result = await AgentsService.getUserAgentById("a1", "u1");

      expect(result).toEqual(mockAgent);
    });
  });

  describe("getAgentById", () => {
    it("should return single agent", async () => {
      const mockAgent = { id: "a1" };
      (db.select as Mock).mockReturnValueOnce({
        from: () => ({
          where: () => [mockAgent],
        }),
      });

      const result = await AgentsService.getAgentById("a1");

      expect(result).toEqual(mockAgent);
    });
  });

  describe("updateAgent", () => {
    it("should update agent and return updated record", async () => {
      const mockAgent = {
        id: "a1",
        name: "Updated",
        instructions: "New instructions",
      };
      (db.update as Mock).mockReturnValueOnce({
        set: () => ({
          where: () => ({
            returning: () => [mockAgent],
          }),
        }),
      });

      const result = await AgentsService.updateAgent(mockAgent, "u1");

      expect(result).toEqual(mockAgent);
    });
  });

  describe("removeAgent", () => {
    it("should delete agent and return removed record", async () => {
      const mockAgent = { id: "a1" };
      (db.delete as Mock).mockReturnValueOnce({
        where: () => ({
          returning: () => [mockAgent],
        }),
      });

      const result = await AgentsService.removeAgent("a1", "u1");

      expect(result).toEqual(mockAgent);
    });
  });

  describe("createAgent", () => {
    it("should create agent and return created record", async () => {
      const mockAgent = { id: "a1", name: "New Agent" };
      (db.insert as Mock).mockReturnValueOnce({
        values: () => ({
          returning: () => [mockAgent],
        }),
      });

      const result = await AgentsService.createAgent(
        { name: "New Agent", instructions: "Instructions" },
        "u1",
      );

      expect(result).toEqual(mockAgent);
    });
  });
});
