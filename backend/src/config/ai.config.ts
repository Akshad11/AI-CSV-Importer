import dotenv from "dotenv";

dotenv.config();

export interface AIConfig {
    provider: string;
    model: string;
    batchSize: number;
    temperature: number;
    maxOutputTokens: number;
}

export const aiConfig: AIConfig = {
    provider: process.env.AI_PROVIDER || "mock",
    model: process.env.AI_MODEL || "mock-model",
    batchSize: parseInt(process.env.AI_BATCH_SIZE || "100", 10),
    temperature: parseFloat(process.env.AI_TEMPERATURE || "0.2"),
    maxOutputTokens: parseInt(process.env.AI_MAX_OUTPUT_TOKENS || "2000", 10),
};
