import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

    PORT: z.coerce.number().default(5000),

    OPENAI_API_KEY: z.string().optional(),

    MAX_FILE_SIZE: z.coerce.number().default(5 * 1024 * 1024),

    LOG_LEVEL: z.string().default("info"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error("Invalid environment variables");
    console.error(parsed.error.format());
    process.exit(1);
}

export const env = parsed.data;