import { describe, expect, it, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { UNAUTHED_ERR_MSG } from "../shared/const";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
      setHeader: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
      setHeader: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("pms.routers", () => {
  let ctx: TrpcContext;
  let publicCtx: TrpcContext;

  beforeEach(() => {
    ctx = createAuthContext();
    publicCtx = createPublicContext();
  });

  describe("rooms", () => {
    it("requires authentication for list procedure", async () => {
      const caller = appRouter.createCaller(publicCtx);
      await expect(caller.rooms.list()).rejects.toThrow("Please login");
    });
  });

  describe("guests", () => {
    it("requires authentication for list procedure", async () => {
      const caller = appRouter.createCaller(publicCtx);
      await expect(caller.guests.list()).rejects.toThrow("Please login");
    });
  });

  describe("reservations", () => {
    it("requires authentication for list procedure", async () => {
      const caller = appRouter.createCaller(publicCtx);
      await expect(caller.reservations.list()).rejects.toThrow("Please login");
    });

    it("validates checkIn input schema", async () => {
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.reservations.checkIn({
          reservationId: 1,
          roomId: 1,
        })
      ).resolves.toBeDefined();
    });

    it("validates checkOut input schema", async () => {
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.reservations.checkOut({
          reservationId: 1,
          roomId: 1,
        })
      ).resolves.toBeDefined();
    });
  });

  describe("notifications", () => {
    it("requires authentication for list procedure", async () => {
      const caller = appRouter.createCaller(publicCtx);
      await expect(caller.notifications.list()).rejects.toThrow("Please login");
    });

    it("requires authentication for unreadCount procedure", async () => {
      const caller = appRouter.createCaller(publicCtx);
      await expect(caller.notifications.unreadCount()).rejects.toThrow("Please login");
    });
  });

  describe("ai", () => {
    it("requires authentication for chat procedure", async () => {
      const caller = appRouter.createCaller(publicCtx);
      await expect(
        caller.ai.chat({
          messages: [{ role: "user", content: "Hello" }],
        })
      ).rejects.toThrow("Please login");
    });

    it("requires authentication for occupancyPrediction procedure", async () => {
      const caller = appRouter.createCaller(publicCtx);
      await expect(
        caller.ai.occupancyPrediction({ days: 7, totalRooms: 30 })
      ).rejects.toThrow("Please login");
    });

    it("requires authentication for roomAssignment procedure", async () => {
      const caller = appRouter.createCaller(publicCtx);
      await expect(
        caller.ai.roomAssignment({ guestName: "John", roomTypes: ["standard"] })
      ).rejects.toThrow("Please login");
    });

    it("requires authentication for insights procedure", async () => {
      const caller = appRouter.createCaller(publicCtx);
      await expect(
        caller.ai.insights({ occupancy: 50, adr: 150, revpar: 75, totalRooms: 30 })
      ).rejects.toThrow("Please login");
    });

    it("requires authentication for voiceTranscribe procedure", async () => {
      const caller = appRouter.createCaller(publicCtx);
      await expect(
        caller.ai.voiceTranscribe({ audioUrl: "https://example.com/audio.webm" })
      ).rejects.toThrow("Please login");
    });
  });
});
