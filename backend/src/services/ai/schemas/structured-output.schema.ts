import { z } from "zod";
import { leadSchema } from "./lead.schema";

export const structuredOutputSchema = z.object({
    leads: z.array(leadSchema)
});

export type StructuredOutput = z.infer<typeof structuredOutputSchema>;
