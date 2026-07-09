import { z } from "zod";
import { leadSchema } from "./lead.schema";

export const aiResponseSchema = z.array(leadSchema);

export type AIResponseData = z.infer<typeof aiResponseSchema>;
