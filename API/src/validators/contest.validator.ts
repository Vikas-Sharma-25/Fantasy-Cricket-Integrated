import { z } from "zod";

export const createContestSchema = z.object({
  body: z.object({
    matchId: z.string().min(1),

    name: z
      .string()
      .min(2)
      .max(80),

    type: z
      .enum(["PUBLIC", "PRIVATE"])
      .default("PUBLIC"),

    maxSlots: z
      .number()
      .int()
      .positive(),

    rules: z
      .record(z.unknown())
      .optional()
  })
});

export const updateContestSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2)
      .max(80)
      .optional(),

    maxSlots: z
      .number()
      .int()
      .positive()
      .optional(),

    rules: z
      .record(z.unknown())
      .optional(),

    status: z
      .enum([
        "OPEN",
        "FULL",
        "LOCKED",
        "COMPLETED",
        "CANCELLED"
      ])
      .optional()
  }),

  params: z.object({
    contestId: z.string().min(1)
  })
});

export const joinContestSchema = z.object({
  body: z.object({
    fantasyTeamId: z.string().min(1)
  }),

  params: z.object({
    contestId: z.string().min(1)
  })
});

export const createPrivateContestSchema = z.object({
  body: z.object({
    matchId: z.string().min(1),

    name: z
      .string()
      .min(2)
      .max(80),

    maxSlots: z
      .number()
      .int()
      .positive(),

    rules: z
      .record(z.unknown())
      .optional()
  })
});