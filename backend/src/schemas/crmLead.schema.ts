import { z } from "zod";

export const crmLeadSchema = z.object({
    firstName: z.string().nullable(),

    lastName: z.string().nullable(),

    email: z.email().nullable(),

    company: z.string().nullable(),

    phone: z.string().nullable(),

    title: z.string().nullable()
});

export type CrmLead =
    z.infer<typeof crmLeadSchema>;