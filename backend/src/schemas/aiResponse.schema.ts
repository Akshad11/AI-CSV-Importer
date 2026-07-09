import { z } from "zod";
import { crmLeadSchema } from "./crmLead.schema";

export const aiResponseSchema =
    z.array(crmLeadSchema);

export type AILeadResponse =
    z.infer<typeof aiResponseSchema>;