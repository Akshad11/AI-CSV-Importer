import { z } from "zod";

export const importStatusSchema = z.object({
    status: z.string(),
    message: z.string(),
});

export type ImportStatusSchema = z.infer<typeof importStatusSchema>;