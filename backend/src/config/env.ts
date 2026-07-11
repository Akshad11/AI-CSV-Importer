import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

    PORT: z.coerce.number().default(5000),

    OPENAI_API_KEY: z.string().optional(),
    OPENROUTER_API_KEY: z.string().optional(),

    MAX_FILE_SIZE: z.coerce.number().default(5 * 1024 * 1024),

    LOG_LEVEL: z.string().default("info"),

    LOG_DIRECTORY: z.string().default("logs"),
    LOG_FILE: z.string().default("log.txt"),
    MAX_LOG_SIZE: z.coerce.number().default(10 * 1024 * 1024),
    ENABLE_CONSOLE_LOGS: z.preprocess((val) => val === undefined || val === 'true' || val === true, z.boolean()).default(true),
    ENABLE_FILE_LOGS: z.preprocess((val) => val === undefined || val === 'true' || val === true, z.boolean()).default(true),
    ENABLE_DEBUG_LOGS: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),

    MONGODB_URI: z.string().default("mongodb://localhost:27017/ai_csv_importer"),
    MONGODB_POOL_SIZE: z.coerce.number().default(10),
    MONGODB_CONNECT_TIMEOUT_MS: z.coerce.number().default(30000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error("Invalid environment variables");
    console.error(parsed.error.format());
    process.exit(1);
}

export const env = parsed.data;