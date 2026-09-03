import { z } from "zod";

export const createTeamSchema = z.object({
  body: z.object({
    matchId: z.string().min(1),
    name: z.string().min(2).max(50),
    playerIds: z.array(z.string().min(1)).min(1),
    captainId: z.string().min(1),
    viceCaptainId: z.string().min(1)
  })
});

export const updateTeamSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(50).optional(),
    playerIds: z.array(z.string().min(1)).min(1).optional(),
    captainId: z.string().min(1).optional(),
    viceCaptainId: z.string().min(1).optional()
  }),
  params: z.object({
    teamId: z.string().min(1)
  })
});
