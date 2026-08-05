import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  getAllRooms,
  getRoomsByFilter,
  updateRoomStatus,
  assignRoom,
  getAllGuests,
  searchGuests,
  insertGuest,
  getAllReservations,
  getTodayArrivals,
  getTodayDepartures,
  getReservationsForTapeChart,
  checkInReservation,
  checkOutReservation,
  updateReservationCharges,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadCount,
  insertNotification,
  getUserByOpenId,
  getReservationHistory,
  assignReservationToRoom,
} from "./db";
import { invokeLLM, type Message } from "./_core/llm";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============= ROOMS =============
  rooms: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getAllRooms();
    }),
    filtered: protectedProcedure.input(z.object({
      type: z.string().optional(),
      floor: z.number().optional(),
      status: z.string().optional(),
    })).query(async ({ input }) => {
      return await getRoomsByFilter(input);
    }),
    updateStatus: protectedProcedure.input(z.object({
      roomId: z.number(),
      status: z.enum(["vacant", "occupied", "dirty", "maintenance", "reserved"]),
    })).mutation(async ({ input }) => {
      const result = await updateRoomStatus(input.roomId, input.status);
      return result?.[0] ?? null;
    }),
    assign: protectedProcedure.input(z.object({
      roomId: z.number(),
      reservationId: z.number(),
    })).mutation(async ({ input }) => {
      return await assignRoom(input.roomId, input.reservationId);
    }),
  }),

  // ============= GUESTS =============
  guests: router({
    list: protectedProcedure.query(async () => {
      return await getAllGuests();
    }),
    search: protectedProcedure.input(z.object({
      query: z.string().min(1),
    })).query(async ({ input }) => {
      return await searchGuests(input.query);
    }),
    create: protectedProcedure.input(z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().optional(),
      phone: z.string().optional(),
      idType: z.string().optional(),
      idNumber: z.string().optional(),
      specialRequests: z.string().optional(),
    })).mutation(async ({ input }) => {
      return await insertGuest({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email ?? null,
        phone: input.phone ?? null,
        idType: input.idType ?? null,
        idNumber: input.idNumber ?? null,
        specialRequests: input.specialRequests ?? null,
        loyaltyPoints: 0,
      });
    }),
  }),

  // ============= RESERVATIONS =============
  reservations: router({
    list: protectedProcedure.query(async () => {
      return await getAllReservations();
    }),
    todayArrivals: protectedProcedure.query(async () => {
      return await getTodayArrivals();
    }),
    todayDepartures: protectedProcedure.query(async () => {
      return await getTodayDepartures();
    }),
    tapeChart: protectedProcedure.input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    })).query(async ({ input }) => {
      return await getReservationsForTapeChart(input.startDate, input.endDate);
    }),
    checkIn: protectedProcedure.input(z.object({
      reservationId: z.number(),
      roomId: z.number(),
    })).mutation(async ({ input }) => {
      return await checkInReservation(input.reservationId, input.roomId);
    }),
    checkOut: protectedProcedure.input(z.object({
      reservationId: z.number(),
      roomId: z.number(),
    })).mutation(async ({ input }) => {
      return await checkOutReservation(input.reservationId, input.roomId);
    }),
    updateCharges: protectedProcedure.input(z.object({
      reservationId: z.number(),
      amount: z.number(),
    })).mutation(async ({ input }) => {
      return await updateReservationCharges(input.reservationId, input.amount);
    }),
    history: protectedProcedure.input(z.object({
      roomId: z.number().optional(),
      guestId: z.number().optional(),
    })).query(async ({ input }) => {
      return await getReservationHistory(input.roomId, input.guestId);
    }),
    reassignRoom: protectedProcedure.input(z.object({
      reservationId: z.number(),
      newRoomId: z.number(),
      oldRoomId: z.number().optional(),
    })).mutation(async ({ input }) => {
      return await assignReservationToRoom(input.reservationId, input.newRoomId, input.oldRoomId);
    }),
  }),

  // ============= NOTIFICATIONS =============
  notifications: router({
    list: protectedProcedure.query(async () => {
      return await getNotifications();
    }),
    markRead: protectedProcedure.input(z.object({
      notificationId: z.number(),
    })).mutation(async ({ input }) => {
      return await markNotificationRead(input.notificationId);
    }),
    markAllRead: protectedProcedure.mutation(async () => {
      return await markAllNotificationsRead();
    }),
    unreadCount: protectedProcedure.query(async () => {
      return await getUnreadCount();
    }),
    create: protectedProcedure.input(z.object({
      type: z.enum(["arrival", "departure", "maintenance", "charge", "system", "ai_insight"]),
      title: z.string().min(1),
      message: z.string().min(1),
    })).mutation(async ({ input }) => {
      return await insertNotification({
        ...input,
        isRead: 0,
      });
    }),
  }),

  // ============= AI FEATURES =============
  ai: router({
    chat: protectedProcedure.input(z.object({
      messages: z.array(z.object({
        role: z.enum(["system", "user", "assistant"]),
        content: z.string(),
      })),
    })).mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: (input.messages as any[]).map(m => ({
          role: m.role,
          content: m.content as string,
        })),
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "chat_response",
            strict: true,
            schema: {
              type: "object",
              properties: {
                reply: { type: "string" },
                action: { type: "string", enum: ["inform", "lookup_guest", "lookup_room", "check_availability", "suggest_upgrade", "local_recommendation", "policy_explanation", "escalate"] },
                entities: {
                  type: "object",
                  properties: {
                    roomNumber: { type: ["string", "null"] },
                    guestName: { type: ["string", "null"] },
                    checkIn: { type: ["string", "null"] },
                    checkOut: { type: ["string", "null"] },
                    roomType: { type: ["string", "null"] },
                  },
                  required: ["roomNumber", "guestName", "checkIn", "checkOut", "roomType"],
                  additionalProperties: false,
                },
                suggestions: { type: "array", items: { type: "string" } },
              },
              required: ["reply", "action", "entities", "suggestions"],
              additionalProperties: false,
            },
          },
        },
      });
      try {
        const raw = response.choices[0]?.message?.content;
        const content = typeof raw === "string" ? raw : "{}";
        const parsed = JSON.parse(content);
        return {
          reply: parsed.reply ?? "Sorry, I couldn't generate a response.",
          action: parsed.action ?? "inform",
          entities: parsed.entities ?? {},
          suggestions: parsed.suggestions ?? [],
        };
      } catch {
        return {
          reply: "Sorry, I couldn't generate a response.",
          action: "inform",
          entities: {},
          suggestions: [],
        };
      }
    }),

    occupancyPrediction: protectedProcedure.input(z.object({
      days: z.number().default(7),
      totalRooms: z.number().default(30),
    })).mutation(async ({ input }) => {
      const messages: Message[] = [
        {
          role: "system",
          content: "You are an AI hotel analytics engine. Predict occupancy based on historical patterns, seasonality, and market trends.",
        },
        {
          role: "user",
          content: `Predict hotel occupancy for the next ${input.days} days. Total rooms: ${input.totalRooms}. Return JSON with predictions array (date, predictedOccupancy 0-100, confidence 0-100, factors), summary string, and riskLevel (low|medium|high).`,
        },
      ];
      const response = await invokeLLM({
        messages,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "occupancy_prediction",
            strict: true,
            schema: {
              type: "object",
              properties: {
                predictions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      date: { type: "string" },
                      predictedOccupancy: { type: "number" },
                      confidence: { type: "number" },
                      factors: { type: "array", items: { type: "string" } },
                    },
                    required: ["date", "predictedOccupancy", "confidence", "factors"],
                    additionalProperties: false,
                  },
                },
                summary: { type: "string" },
                riskLevel: { type: "string", enum: ["low", "medium", "high"] },
              },
              required: ["predictions", "summary", "riskLevel"],
              additionalProperties: false,
            },
          },
        },
      });
      try {
        const raw = response.choices[0]?.message?.content;
        const content = typeof raw === "string" ? raw : "{}";
        const parsed = JSON.parse(content);
        return parsed;
      } catch {
        return { predictions: [], summary: "Unable to generate prediction", riskLevel: "medium" };
      }
    }),

    roomAssignment: protectedProcedure.input(z.object({
      guestName: z.string(),
      roomTypes: z.array(z.string()),
      preferences: z.string().optional(),
    })).mutation(async ({ input }) => {
      const messages: Message[] = [
        {
          role: "system",
          content: "You are an AI hotel room assignment assistant. Suggest the best room based on guest preferences and available room types.",
        },
        {
          role: "user",
          content: `Suggest the best room for guest "${input.guestName}". Available types: ${input.roomTypes.join(", ")}. Preferences: ${input.preferences || "None"}. Return JSON with suggestedRoom (roomNumber, roomType, floor, rate, reason), alternatives array, and notes.`,
        },
      ];
      const response = await invokeLLM({
        messages,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "room_assignment",
            strict: true,
            schema: {
              type: "object",
              properties: {
                suggestedRoom: {
                  type: "object",
                  properties: {
                    roomNumber: { type: "string" },
                    roomType: { type: "string" },
                    floor: { type: "number" },
                    rate: { type: "number" },
                    reason: { type: "string" },
                  },
                  required: ["roomNumber", "roomType", "floor", "rate", "reason"],
                  additionalProperties: false,
                },
                alternatives: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      roomNumber: { type: "string" },
                      roomType: { type: "string" },
                      reason: { type: "string" },
                    },
                    required: ["roomNumber", "roomType", "reason"],
                    additionalProperties: false,
                  },
                },
                notes: { type: "string" },
              },
              required: ["suggestedRoom", "alternatives", "notes"],
              additionalProperties: false,
            },
          },
        },
      });
      try {
        const raw = response.choices[0]?.message?.content;
        const content = typeof raw === "string" ? raw : "{}";
        const parsed = JSON.parse(content);
        return parsed;
      } catch {
        return { suggestedRoom: null, alternatives: [], notes: "Unable to generate suggestion" };
      }
    }),

    insights: protectedProcedure.input(z.object({
      occupancy: z.number(),
      adr: z.number(),
      revpar: z.number(),
      totalRooms: z.number(),
    })).mutation(async ({ input }) => {
      const messages: Message[] = [
        {
          role: "system",
          content: "You are an AI hotel analytics consultant. Analyze performance metrics and provide actionable insights.",
        },
        {
          role: "user",
          content: `Analyze hotel performance:
- Occupancy: ${input.occupancy}%
- ADR: $${input.adr}
- RevPAR: $${input.revpar}
- Total Rooms: ${input.totalRooms}

Return JSON with insights array (title, description, priority high|medium|low, action), overallHealth (excellent|good|needs_attention|critical), recommendations array, weeklyTrend (improving|stable|declining).`,
        },
      ];
      const response = await invokeLLM({
        messages,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "hotel_insights",
            strict: true,
            schema: {
              type: "object",
              properties: {
                insights: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      priority: { type: "string", enum: ["high", "medium", "low"] },
                      action: { type: "string" },
                    },
                    required: ["title", "description", "priority", "action"],
                    additionalProperties: false,
                  },
                },
                overallHealth: { type: "string", enum: ["excellent", "good", "needs_attention", "critical"] },
                recommendations: { type: "array", items: { type: "string" } },
                weeklyTrend: { type: "string", enum: ["improving", "stable", "declining"] },
              },
              required: ["insights", "overallHealth", "recommendations", "weeklyTrend"],
              additionalProperties: false,
            },
          },
        },
      });
      try {
        const raw = response.choices[0]?.message?.content;
        const content = typeof raw === "string" ? raw : "{}";
        const parsed = JSON.parse(content);
        return parsed;
      } catch {
        return { insights: [], overallHealth: "needs_attention", recommendations: [], weeklyTrend: "stable" };
      }
    }),

    voiceTranscribe: protectedProcedure.input(z.object({
      audioUrl: z.string().url(),
    })).mutation(async ({ input }) => {
      const { transcribeAudio } = await import("./_core/voiceTranscription");
      const result = await transcribeAudio({ audioUrl: input.audioUrl, language: "en" });
      if ("text" in result) {
        return { text: result.text ?? "", language: result.language ?? "en" };
      }
      return { text: "", language: "en" };
    }),
  }),
});

export type AppRouter = typeof appRouter;
